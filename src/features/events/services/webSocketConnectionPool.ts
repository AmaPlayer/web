import { Timestamp } from 'firebase/firestore';
import {
  WebSocketMessage,
  MessageType,
  ConnectionStatus,
  WebSocketConfig,
  ActivityEvent
} from '@features/events/types/realtime.types';

interface PooledConnection {
  id: string;
  ws: WebSocket;
  status: ConnectionStatus;
  subscriptions: Set<string>;
  lastActivity: Timestamp;
  messageQueue: WebSocketMessage[];
  reconnectAttempts: number;
}

interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  messageQueueLimit: number;
}

export class WebSocketConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private availableConnections: Set<string> = new Set();
  private subscriptionMap: Map<string, string> = new Map(); // channel -> connectionId
  private config: ConnectionPoolConfig;
  private cleanupInterval: number | null = null;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      maxConnections: 5,
      connectionTimeout: 10000,
      idleTimeout: 300000, // 5 minutes
      maxReconnectAttempts: 3,
      reconnectDelay: 2000,
      heartbeatInterval: 30000,
      messageQueueLimit: 100,
      ...config
    };

    this.startCleanupInterval();
  }

  /**
   * Get or create a connection for a user
   */
  async getConnection(userId: string, wsUrl: string): Promise<string> {
    // Check if user already has a connection
    const existingConnectionId = this.findUserConnection(userId);
    if (existingConnectionId) {
      const connection = this.connections.get(existingConnectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.lastActivity = Timestamp.now();
        return existingConnectionId;
      }
    }

    // Try to reuse an available connection
    const availableConnectionId = this.getAvailableConnection();
    if (availableConnectionId) {
      const connection = this.connections.get(availableConnectionId)!;
      connection.status.userId = userId;
      connection.lastActivity = Timestamp.now();
      this.availableConnections.delete(availableConnectionId);
      return availableConnectionId;
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      return await this.createConnection(userId, wsUrl);
    }

    // Pool is full, reuse least recently used connection
    const lruConnectionId = this.getLeastRecentlyUsedConnection();
    if (lruConnectionId) {
      await this.reassignConnection(lruConnectionId, userId);
      return lruConnectionId;
    }

    throw new Error('Unable to obtain WebSocket connection');
  }

  /**
   * Subscribe to a channel using pooled connection
   */
  async subscribe(
    userId: string, 
    channel: string, 
    callback: (data: any) => void,
    wsUrl: string
  ): Promise<void> {
    const connectionId = await this.getConnection(userId, wsUrl);
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Add subscription to connection
    connection.subscriptions.add(channel);
    this.subscriptionMap.set(channel, connectionId);

    // Send subscription message
    const subscribeMessage: WebSocketMessage = {
      type: MessageType.SUBSCRIBE,
      channel,
      data: { userId },
      timestamp: Timestamp.now(),
      messageId: this.generateMessageId()
    };

    this.sendMessage(connectionId, subscribeMessage);

    // Store callback for message handling
    connection.ws.addEventListener('message', (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.channel === channel) {
          callback(message.data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    connection.lastActivity = Timestamp.now();
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, userId: string): void {
    const connectionId = this.subscriptionMap.get(channel);
    if (!connectionId) return;

    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove subscription
    connection.subscriptions.delete(channel);
    this.subscriptionMap.delete(channel);

    // Send unsubscribe message
    const unsubscribeMessage: WebSocketMessage = {
      type: MessageType.UNSUBSCRIBE,
      channel,
      data: { userId },
      timestamp: Timestamp.now(),
      messageId: this.generateMessageId()
    };

    this.sendMessage(connectionId, unsubscribeMessage);
    connection.lastActivity = Timestamp.now();

    // If connection has no more subscriptions, mark as available
    if (connection.subscriptions.size === 0) {
      this.availableConnections.add(connectionId);
    }
  }

  /**
   * Publish message to a channel
   */
  publish(channel: string, data: ActivityEvent, userId: string): void {
    const connectionId = this.subscriptionMap.get(channel);
    if (!connectionId) return;

    const publishMessage: WebSocketMessage = {
      type: MessageType.PUBLISH,
      channel,
      data: { ...data, userId },
      timestamp: Timestamp.now(),
      messageId: this.generateMessageId()
    };

    this.sendMessage(connectionId, publishMessage);
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    availableConnections: number;
    totalSubscriptions: number;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.ws.readyState === WebSocket.OPEN).length;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      availableConnections: this.availableConnections.size,
      totalSubscriptions: this.subscriptionMap.size
    };
  }

  /**
   * Close all connections and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const connection of this.connections.values()) {
      connection.ws.close(1000, 'Pool shutting down');
    }

    this.connections.clear();
    this.availableConnections.clear();
    this.subscriptionMap.clear();
  }

  /**
   * Create a new WebSocket connection
   */
  private async createConnection(userId: string, wsUrl: string): Promise<string> {
    const connectionId = this.generateConnectionId();
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        
        const connection: PooledConnection = {
          id: connectionId,
          ws,
          status: {
            isConnected: true,
            connectionId,
            userId,
            connectedAt: Timestamp.now(),
            lastActivity: Timestamp.now(),
            subscriptions: []
          },
          subscriptions: new Set(),
          lastActivity: Timestamp.now(),
          messageQueue: [],
          reconnectAttempts: 0
        };

        this.connections.set(connectionId, connection);
        this.setupConnectionHandlers(connection);
        this.startHeartbeat(connectionId);
        
        resolve(connectionId);
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };
    });
  }

  /**
   * Setup event handlers for a connection
   */
  private setupConnectionHandlers(connection: PooledConnection): void {
    connection.ws.onclose = (event) => {
      console.log(`Connection ${connection.id} closed:`, event.code, event.reason);
      this.handleConnectionClose(connection.id);
    };

    connection.ws.onerror = (error) => {
      console.error(`Connection ${connection.id} error:`, error);
      this.handleConnectionError(connection.id);
    };

    connection.ws.onmessage = (event) => {
      connection.lastActivity = Timestamp.now();
      this.processQueuedMessages(connection.id);
    };
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.status.isConnected = false;
    this.availableConnections.delete(connectionId);

    // Attempt reconnection if within limits
    if (connection.reconnectAttempts < this.config.maxReconnectAttempts) {
      setTimeout(() => {
        this.attemptReconnection(connectionId);
      }, this.config.reconnectDelay * (connection.reconnectAttempts + 1));
    } else {
      // Remove failed connection
      this.removeConnection(connectionId);
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status.isConnected = false;
    }
  }

  /**
   * Attempt to reconnect a connection
   */
  private async attemptReconnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.reconnectAttempts++;
    
    try {
      const wsUrl = connection.ws.url;
      const newWs = new WebSocket(wsUrl);
      
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          newWs.close();
          reject(new Error('Reconnection timeout'));
        }, this.config.connectionTimeout);

        newWs.onopen = () => {
          clearTimeout(timeoutId);
          
          // Replace the old WebSocket
          connection.ws.close();
          connection.ws = newWs;
          connection.status.isConnected = true;
          connection.status.connectedAt = Timestamp.now();
          connection.lastActivity = Timestamp.now();
          
          this.setupConnectionHandlers(connection);
          this.resubscribeChannels(connectionId);
          
          resolve();
        };

        newWs.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('Reconnection failed'));
        };
      });

      console.log(`Connection ${connectionId} reconnected successfully`);
    } catch (error) {
      console.error(`Failed to reconnect connection ${connectionId}:`, error);
      this.handleConnectionClose(connectionId);
    }
  }

  /**
   * Resubscribe to channels after reconnection
   */
  private resubscribeChannels(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    for (const channel of connection.subscriptions) {
      const subscribeMessage: WebSocketMessage = {
        type: MessageType.SUBSCRIBE,
        channel,
        data: { userId: connection.status.userId },
        timestamp: Timestamp.now(),
        messageId: this.generateMessageId()
      };

      this.sendMessage(connectionId, subscribeMessage);
    }
  }

  /**
   * Send message through connection
   */
  private sendMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(message));
        connection.lastActivity = Timestamp.now();
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(connectionId, message);
      }
    } else {
      this.queueMessage(connectionId, message);
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.messageQueue.length >= this.config.messageQueueLimit) {
      // Remove oldest message
      connection.messageQueue.shift();
    }

    connection.messageQueue.push(message);
  }

  /**
   * Process queued messages
   */
  private processQueuedMessages(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

    while (connection.messageQueue.length > 0) {
      const message = connection.messageQueue.shift();
      if (message) {
        try {
          connection.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send queued message:', error);
          connection.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(connectionId: string): void {
    const heartbeatInterval = setInterval(() => {
      const connection = this.connections.get(connectionId);
      if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
        clearInterval(heartbeatInterval);
        return;
      }

      const heartbeatMessage: WebSocketMessage = {
        type: MessageType.HEARTBEAT,
        channel: 'heartbeat',
        data: {},
        timestamp: Timestamp.now(),
        messageId: this.generateMessageId()
      };

      this.sendMessage(connectionId, heartbeatMessage);
    }, this.config.heartbeatInterval);
  }

  /**
   * Find existing connection for user
   */
  private findUserConnection(userId: string): string | null {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.status.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
        return connectionId;
      }
    }
    return null;
  }

  /**
   * Get available connection
   */
  private getAvailableConnection(): string | null {
    for (const connectionId of this.availableConnections) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        return connectionId;
      }
    }
    return null;
  }

  /**
   * Get least recently used connection
   */
  private getLeastRecentlyUsedConnection(): string | null {
    let lruConnectionId: string | null = null;
    let oldestActivity = Timestamp.now();

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.lastActivity.toMillis() < oldestActivity.toMillis()) {
        oldestActivity = connection.lastActivity;
        lruConnectionId = connectionId;
      }
    }

    return lruConnectionId;
  }

  /**
   * Reassign connection to new user
   */
  private async reassignConnection(connectionId: string, userId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Clear existing subscriptions
    for (const channel of connection.subscriptions) {
      this.subscriptionMap.delete(channel);
    }
    connection.subscriptions.clear();

    // Update user
    connection.status.userId = userId;
    connection.lastActivity = Timestamp.now();
    this.availableConnections.delete(connectionId);
  }

  /**
   * Remove connection from pool
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Clear subscriptions
      for (const channel of connection.subscriptions) {
        this.subscriptionMap.delete(channel);
      }
      
      connection.ws.close();
      this.connections.delete(connectionId);
      this.availableConnections.delete(connectionId);
    }
  }

  /**
   * Cleanup idle connections
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Timestamp.now();
      const connectionsToRemove: string[] = [];

      for (const [connectionId, connection] of this.connections.entries()) {
        const idleTime = now.toMillis() - connection.lastActivity.toMillis();
        
        if (idleTime > this.config.idleTimeout && connection.subscriptions.size === 0) {
          connectionsToRemove.push(connectionId);
        }
      }

      for (const connectionId of connectionsToRemove) {
        console.log(`Removing idle connection: ${connectionId}`);
        this.removeConnection(connectionId);
      }
    }, 60000) as unknown as number; // Check every minute
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `pool_conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const webSocketConnectionPool = new WebSocketConnectionPool();
export default webSocketConnectionPool;