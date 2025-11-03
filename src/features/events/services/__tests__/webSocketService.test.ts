import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webSocketService, WebSocketError } from '@features/events/services/webSocketService';
import { MessageType, ActivityType, Priority } from '@features/events/types/realtime.types';

// Mock WebSocket class for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  send = vi.fn();
  close = vi.fn();

  // Helper methods for testing
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('WebSocketService', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Reset the service state
    webSocketService.disconnect();
    
    // Mock WebSocket constructor
    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    }) as any;
  });

  afterEach(() => {
    webSocketService.disconnect();
    vi.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      const connectPromise = webSocketService.connect('test-user');
      
      // Simulate WebSocket opening
      mockWebSocket.simulateOpen();
      
      await connectPromise;
      
      expect(webSocketService.isConnected()).toBe(true);
      expect(webSocketService.getConnectionStatus()).toMatchObject({
        isConnected: true,
        userId: 'test-user'
      });
    });

    it('should handle connection errors', async () => {
      const connectPromise = webSocketService.connect('test-user');
      
      // Simulate WebSocket error
      mockWebSocket.simulateError();
      
      await expect(connectPromise).rejects.toThrow(WebSocketError);
    });

    it('should not create multiple connections for same user', async () => {
      // First connection
      const connectPromise1 = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise1;

      // Second connection attempt
      await webSocketService.connect('test-user');
      
      // Should only create one WebSocket instance
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });

    it('should disconnect properly', async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;

      webSocketService.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Client disconnecting');
      expect(webSocketService.isConnected()).toBe(false);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should subscribe to channels', () => {
      const callback = vi.fn();
      const channel = 'test-channel';

      webSocketService.subscribe(channel, callback);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"subscribe"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining(`"channel":"${channel}"`)
      );
    });

    it('should unsubscribe from channels', () => {
      const callback = vi.fn();
      const channel = 'test-channel';

      webSocketService.subscribe(channel, callback);
      mockWebSocket.send.mockClear();

      webSocketService.unsubscribe(channel, callback);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"unsubscribe"')
      );
    });

    it('should handle multiple callbacks for same channel', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const channel = 'test-channel';

      webSocketService.subscribe(channel, callback1);
      webSocketService.subscribe(channel, callback2);

      // Simulate receiving a message
      const testMessage = {
        type: MessageType.ACTIVITY,
        channel,
        data: { test: 'data' }
      };
      mockWebSocket.simulateMessage(testMessage);

      expect(callback1).toHaveBeenCalledWith({ test: 'data' });
      expect(callback2).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('Message Publishing', () => {
    beforeEach(async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should publish activity events', () => {
      const channel = 'event:123:feed';
      const activityData = {
        id: 'activity-1',
        eventId: '123',
        userId: 'user-1',
        userName: 'Test User',
        type: ActivityType.USER_JOINED,
        data: { participationType: 'going' },
        timestamp: new Date(),
        priority: Priority.MEDIUM
      };

      webSocketService.publish(channel, activityData);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"publish"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining(`"channel":"${channel}"`)
      );
    });

    it('should queue messages when disconnected', () => {
      webSocketService.disconnect();
      
      const channel = 'test-channel';
      const data = { test: 'data' };

      // This should not throw an error, but queue the message
      expect(() => {
        webSocketService.publish(channel, data);
      }).not.toThrow();

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should reject oversized messages', async () => {
      const channel = 'test-channel';
      const largeData = {
        data: 'x'.repeat(2 * 1024 * 1024) // 2MB of data
      };

      expect(() => {
        webSocketService.publish(channel, largeData as any);
      }).toThrow(WebSocketError);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should handle activity messages', () => {
      const callback = vi.fn();
      const channel = 'event:123:feed';

      webSocketService.subscribe(channel, callback);

      const activityMessage = {
        type: MessageType.ACTIVITY,
        channel,
        data: {
          id: 'activity-1',
          type: ActivityType.USER_JOINED,
          userName: 'Test User'
        }
      };

      mockWebSocket.simulateMessage(activityMessage);

      expect(callback).toHaveBeenCalledWith(activityMessage.data);
    });

    it('should handle notification messages', () => {
      const callback = vi.fn();
      webSocketService.subscribe('notifications', callback);

      const notificationMessage = {
        type: MessageType.NOTIFICATION,
        data: {
          title: 'Test Notification',
          message: 'This is a test'
        }
      };

      mockWebSocket.simulateMessage(notificationMessage);

      expect(callback).toHaveBeenCalledWith(notificationMessage.data);
    });

    it('should respond to heartbeat messages', () => {
      const heartbeatMessage = {
        type: MessageType.HEARTBEAT,
        timestamp: new Date()
      };

      mockWebSocket.simulateMessage(heartbeatMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"')
      );
    });

    it('should handle error messages', () => {
      const errorCallback = vi.fn();
      webSocketService.subscribe('errors', errorCallback);

      const errorMessage = {
        type: MessageType.ERROR,
        error: 'Test error',
        code: 500
      };

      mockWebSocket.simulateMessage(errorMessage);

      expect(errorCallback).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should handle disconnection', () => {
      // Simulate unexpected disconnection
      mockWebSocket.simulateClose(1006, 'Connection lost');

      expect(webSocketService.isConnected()).toBe(false);
    });
  });

  describe('Heartbeat Mechanism', () => {
    beforeEach(async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;
    });

    it('should handle heartbeat messages', () => {
      const heartbeatMessage = {
        type: MessageType.HEARTBEAT,
        timestamp: new Date()
      };

      mockWebSocket.simulateMessage(heartbeatMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"heartbeat"')
      );
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        reconnectAttempts: 10,
        heartbeatInterval: 60000
      };

      webSocketService.updateConfig(newConfig);
      const config = webSocketService.getConfig();

      expect(config.reconnectAttempts).toBe(10);
      expect(config.heartbeatInterval).toBe(60000);
    });

    it('should provide subscription statistics', async () => {
      const connectPromise = webSocketService.connect('test-user');
      mockWebSocket.simulateOpen();
      await connectPromise;

      webSocketService.subscribe('channel1', vi.fn());
      webSocketService.subscribe('channel2', vi.fn());

      expect(webSocketService.getSubscriptionCount()).toBe(2);
      expect(webSocketService.getActiveSubscriptions()).toEqual(['channel1', 'channel2']);
    });
  });
});