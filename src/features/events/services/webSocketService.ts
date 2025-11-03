import { Timestamp } from 'firebase/firestore';
import {
    WebSocketMessage,
    MessageType,
    SubscriptionMessage,
    PublishMessage,
    HeartbeatMessage,
    ErrorMessage,
    ConnectionStatus,
    WebSocketConfig,
    ActivityEvent
} from '@features/events/types/realtime.types';

// WebSocket Error class for typed error responses
export class WebSocketError extends Error {
    constructor(
        public code: number,
        public message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'WebSocketError';
    }
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private connectionStatus: ConnectionStatus | null = null;
    private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
    private reconnectAttempts = 0;
    private heartbeatInterval: number | null = null;
    private reconnectTimeout: number | null = null;
    private messageQueue: WebSocketMessage[] = [];

    private config: WebSocketConfig = {
        url: process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080/ws', // Default WebSocket URL
        reconnectAttempts: 5,
        reconnectDelay: 3000,
        heartbeatInterval: 30000,
        maxMessageSize: 1024 * 1024 // 1MB
    };

    /**
     * Initialize WebSocket connection
     */
    async connect(userId: string, config?: Partial<WebSocketConfig>): Promise<void> {
        // Skip WebSocket connection in development if no server is running
        if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_WEBSOCKET_URL) {
            console.log('WebSocket disabled in development (no REACT_APP_WEBSOCKET_URL)');
            return Promise.resolve();
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        // Update config if provided
        if (config) {
            this.config = { ...this.config, ...config };
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.connectionStatus = {
                        isConnected: true,
                        connectionId: this.generateConnectionId(),
                        userId,
                        connectedAt: Timestamp.fromDate(new Date()),
                        lastActivity: Timestamp.fromDate(new Date()),
                        subscriptions: []
                    };

                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.processMessageQueue();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    this.handleDisconnection();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(new WebSocketError(500, 'Failed to connect to WebSocket server', error));
                };

            } catch (error) {
                reject(new WebSocketError(500, 'Failed to initialize WebSocket connection', error));
            }
        });
    }

    /**
     * Subscribe to a channel for real-time updates
     */
    subscribe(channel: string, callback: (data: any) => void): void {
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
        }

        this.subscriptions.get(channel)!.add(callback);

        // Send subscription message to server
        const subscribeMessage: SubscriptionMessage = {
            type: MessageType.SUBSCRIBE,
            channel,
            userId: this.connectionStatus?.userId || 'anonymous'
        };

        this.sendMessage(subscribeMessage);

        // Update connection status
        if (this.connectionStatus) {
            this.connectionStatus.subscriptions.push(channel);
            this.connectionStatus.lastActivity = Timestamp.fromDate(new Date());
        }
    }

    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channel: string, callback?: (data: any) => void): void {
        const channelCallbacks = this.subscriptions.get(channel);

        if (channelCallbacks) {
            if (callback) {
                channelCallbacks.delete(callback);
            } else {
                channelCallbacks.clear();
            }

            // If no more callbacks, remove the channel and notify server
            if (channelCallbacks.size === 0) {
                this.subscriptions.delete(channel);

                const unsubscribeMessage: SubscriptionMessage = {
                    type: MessageType.UNSUBSCRIBE,
                    channel,
                    userId: this.connectionStatus?.userId || 'anonymous'
                };

                this.sendMessage(unsubscribeMessage);

                // Update connection status
                if (this.connectionStatus) {
                    this.connectionStatus.subscriptions = this.connectionStatus.subscriptions.filter(
                        sub => sub !== channel
                    );
                    this.connectionStatus.lastActivity = Timestamp.fromDate(new Date());
                }
            }
        }
    }

    /**
     * Publish data to a channel
     */
    publish(channel: string, data: ActivityEvent): void {
        const publishMessage: PublishMessage = {
            type: MessageType.PUBLISH,
            channel,
            data
        };

        this.sendMessage(publishMessage);

        if (this.connectionStatus) {
            this.connectionStatus.lastActivity = Timestamp.fromDate(new Date());
        }
    }

    /**
     * Disconnect WebSocket connection
     */
    disconnect(): void {
        this.stopHeartbeat();

        if (this.reconnectTimeout) {
            window.clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }

        this.connectionStatus = null;
        this.subscriptions.clear();
        this.messageQueue = [];
    }

    /**
     * Get current connection status
     */
    getConnectionStatus(): ConnectionStatus | null {
        return this.connectionStatus;
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN && this.connectionStatus?.isConnected === true;
    }

    /**
     * Send message to WebSocket server
     */
    private sendMessage(message: any): void {
        const wsMessage: WebSocketMessage = {
            ...message,
            timestamp: Timestamp.fromDate(new Date()),
            messageId: this.generateMessageId()
        };

        // Check message size
        const messageSize = JSON.stringify(wsMessage).length;
        if (messageSize > this.config.maxMessageSize) {
            throw new WebSocketError(413, 'Message too large', { size: messageSize });
        }

        if (this.isConnected()) {
            try {
                this.ws!.send(JSON.stringify(wsMessage));
            } catch (error) {
                console.error('Failed to send message:', error);
                this.messageQueue.push(wsMessage);
            }
        } else {
            // Queue message for later sending
            this.messageQueue.push(wsMessage);
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
                case MessageType.ACTIVITY:
                    this.handleActivityMessage(message);
                    break;
                case MessageType.NOTIFICATION:
                    this.handleNotificationMessage(message);
                    break;
                case MessageType.HEARTBEAT:
                    this.handleHeartbeatMessage(message as HeartbeatMessage);
                    break;
                case MessageType.ERROR:
                    if ('error' in message && 'code' in message) {
                        this.handleErrorMessage(message as ErrorMessage);
                    }
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }

            if (this.connectionStatus) {
                this.connectionStatus.lastActivity = Timestamp.fromDate(new Date());
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Handle activity messages
     */
    private handleActivityMessage(message: WebSocketMessage): void {
        const channelCallbacks = this.subscriptions.get(message.channel);
        if (channelCallbacks) {
            channelCallbacks.forEach(callback => {
                try {
                    callback(message.data);
                } catch (error) {
                    console.error('Error in activity callback:', error);
                }
            });
        }
    }

    /**
     * Handle notification messages
     */
    private handleNotificationMessage(message: WebSocketMessage): void {
        // Broadcast to all notification subscribers
        const notificationCallbacks = this.subscriptions.get('notifications');
        if (notificationCallbacks) {
            notificationCallbacks.forEach(callback => {
                try {
                    callback(message.data);
                } catch (error) {
                    console.error('Error in notification callback:', error);
                }
            });
        }
    }

    /**
     * Handle heartbeat messages
     */
    private handleHeartbeatMessage(_message: HeartbeatMessage): void {
        // Respond with heartbeat
        const response: HeartbeatMessage = {
            type: MessageType.HEARTBEAT,
            timestamp: Timestamp.fromDate(new Date())
        };
        this.sendMessage(response);
    }

    /**
     * Handle error messages
     */
    private handleErrorMessage(message: ErrorMessage): void {
        console.error('WebSocket server error:', message.error, message.code);

        // Broadcast error to error subscribers
        const errorCallbacks = this.subscriptions.get('errors');
        if (errorCallbacks) {
            errorCallbacks.forEach(callback => {
                try {
                    callback(message);
                } catch (error) {
                    console.error('Error in error callback:', error);
                }
            });
        }
    }

    /**
     * Handle WebSocket disconnection
     */
    private handleDisconnection(): void {
        this.stopHeartbeat();

        if (this.connectionStatus) {
            this.connectionStatus.isConnected = false;
        }

        // Attempt to reconnect if within retry limits
        if (this.reconnectAttempts < this.config.reconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.reconnectAttempts})...`);

            this.reconnectTimeout = window.setTimeout(() => {
                if (this.connectionStatus) {
                    this.connect(this.connectionStatus.userId);
                }
            }, this.config.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.connectionStatus = null;
        }
    }

    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = window.setInterval(() => {
            if (this.isConnected()) {
                const heartbeat: HeartbeatMessage = {
                    type: MessageType.HEARTBEAT,
                    timestamp: Timestamp.fromDate(new Date())
                };
                this.sendMessage(heartbeat);
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Stop heartbeat mechanism
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Process queued messages when connection is restored
     */
    private processMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.isConnected()) {
            const message = this.messageQueue.shift();
            if (message) {
                try {
                    this.ws!.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Failed to send queued message:', error);
                    // Put message back at the front of the queue
                    this.messageQueue.unshift(message);
                    break;
                }
            }
        }
    }

    /**
     * Generate unique connection ID
     */
    private generateConnectionId(): string {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update WebSocket configuration
     */
    updateConfig(config: Partial<WebSocketConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): WebSocketConfig {
        return { ...this.config };
    }

    /**
     * Get subscription count for debugging
     */
    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /**
     * Get active subscriptions for debugging
     */
    getActiveSubscriptions(): string[] {
        return Array.from(this.subscriptions.keys());
    }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;