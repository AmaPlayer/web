// Progressive Web App service for installation and offline capabilities

interface PWAInstallPrompt {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
    supportsServiceWorker: boolean;
    supportsNotifications: boolean;
    supportsPush: boolean;
    supportsBackgroundSync: boolean;
    isOnline: boolean;
}

interface OfflineQueueItem {
    id: string;
    url: string;
    method: string;
    data: any;
    timestamp: Date;
    retryCount: number;
}

export class PWAService {
    private installPrompt: PWAInstallPrompt | null = null;
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private offlineQueue: OfflineQueueItem[] = [];
    private isOnline: boolean = navigator.onLine;
    private capabilities: PWACapabilities;

    constructor() {
        this.capabilities = this.detectCapabilities();
        this.initializeServiceWorker();
        this.setupEventListeners();
        this.loadOfflineQueue();
    }

    /**
     * Detect PWA capabilities
     */
    private detectCapabilities(): PWACapabilities {
        return {
            canInstall: false, // Will be updated when beforeinstallprompt fires
            isInstalled: this.isAppInstalled(),
            isStandalone: this.isStandaloneMode(),
            supportsServiceWorker: 'serviceWorker' in navigator,
            supportsNotifications: 'Notification' in window,
            supportsPush: 'PushManager' in window,
            supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            isOnline: navigator.onLine
        };
    }

    /**
     * Check if app is installed
     */
    private isAppInstalled(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://');
    }

    /**
     * Check if running in standalone mode
     */
    private isStandaloneMode(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }

    /**
     * Initialize service worker
     */
    private async initializeServiceWorker(): Promise<void> {
        if (!this.capabilities.supportsServiceWorker) {
            console.log('PWA: Service Worker not supported');
            return;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('PWA: Service Worker registered successfully');

            // Listen for service worker updates
            this.serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = this.serviceWorkerRegistration!.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is available
                            this.notifyServiceWorkerUpdate();
                        }
                    });
                }
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });

        } catch (error) {
            console.error('PWA: Service Worker registration failed:', error);
        }
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e as any;
            this.capabilities.canInstall = true;
            this.notifyInstallAvailable();
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA: App installed successfully');
            this.capabilities.isInstalled = true;
            this.capabilities.canInstall = false;
            this.installPrompt = null;
            this.notifyAppInstalled();
        });

        // Listen for online/offline changes
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.capabilities.isOnline = true;
            this.processOfflineQueue();
            this.notifyConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.capabilities.isOnline = false;
            this.notifyConnectionChange(false);
        });

        // Listen for visibility changes (for background sync)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.syncWhenVisible();
            }
        });
    }

    /**
     * Get PWA capabilities
     */
    getCapabilities(): PWACapabilities {
        return { ...this.capabilities };
    }

    /**
     * Check if app can be installed
     */
    canInstall(): boolean {
        return this.capabilities.canInstall && this.installPrompt !== null;
    }

    /**
     * Trigger app installation
     */
    async installApp(): Promise<boolean> {
        if (!this.canInstall()) {
            throw new Error('App cannot be installed at this time');
        }

        try {
            await this.installPrompt!.prompt();
            const choiceResult = await this.installPrompt!.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('PWA: User accepted the install prompt');
                return true;
            } else {
                console.log('PWA: User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('PWA: Installation failed:', error);
            throw error;
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission(): Promise<NotificationPermission> {
        if (!this.capabilities.supportsNotifications) {
            throw new Error('Notifications not supported');
        }

        const permission = await Notification.requestPermission();
        console.log('PWA: Notification permission:', permission);
        return permission;
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
        if (!this.capabilities.supportsPush || !this.serviceWorkerRegistration) {
            throw new Error('Push notifications not supported');
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('PWA: Push subscription created:', subscription);
            return subscription;
        } catch (error) {
            console.error('PWA: Push subscription failed:', error);
            return null;
        }
    }

    /**
     * Add item to offline queue
     */
    addToOfflineQueue(url: string, method: string = 'POST', data: any = null): void {
        const item: OfflineQueueItem = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            method,
            data,
            timestamp: new Date(),
            retryCount: 0
        };

        this.offlineQueue.push(item);
        this.saveOfflineQueue();

        console.log('PWA: Added to offline queue:', item);
    }

    /**
     * Process offline queue when online
     */
    private async processOfflineQueue(): Promise<void> {
        if (!this.isOnline || this.offlineQueue.length === 0) {
            return;
        }

        console.log('PWA: Processing offline queue:', this.offlineQueue.length, 'items');

        const itemsToProcess = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const item of itemsToProcess) {
            try {
                await this.processOfflineItem(item);
                console.log('PWA: Offline item processed successfully:', item.id);
            } catch (error) {
                console.error('PWA: Failed to process offline item:', item.id, error);

                // Retry logic
                if (item.retryCount < 3) {
                    item.retryCount++;
                    this.offlineQueue.push(item);
                } else {
                    console.error('PWA: Max retries reached for offline item:', item.id);
                }
            }
        }

        this.saveOfflineQueue();
    }

    /**
     * Process individual offline item
     */
    private async processOfflineItem(item: OfflineQueueItem): Promise<void> {
        const response = await fetch(item.url, {
            method: item.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: item.data ? JSON.stringify(item.data) : null
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Save offline queue to localStorage
     */
    private saveOfflineQueue(): void {
        try {
            localStorage.setItem('pwa_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('PWA: Failed to save offline queue:', error);
        }
    }

    /**
     * Load offline queue from localStorage
     */
    private loadOfflineQueue(): void {
        try {
            const stored = localStorage.getItem('pwa_offline_queue');
            if (stored) {
                this.offlineQueue = JSON.parse(stored);
                console.log('PWA: Loaded offline queue:', this.offlineQueue.length, 'items');
            }
        } catch (error) {
            console.error('PWA: Failed to load offline queue:', error);
            this.offlineQueue = [];
        }
    }

    /**
     * Clear offline queue
     */
    clearOfflineQueue(): void {
        this.offlineQueue = [];
        this.saveOfflineQueue();
    }

    /**
     * Get offline queue status
     */
    getOfflineQueueStatus(): { count: number; items: OfflineQueueItem[] } {
        return {
            count: this.offlineQueue.length,
            items: [...this.offlineQueue]
        };
    }

    /**
     * Cache important resources
     */
    async cacheImportantResources(urls: string[]): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            console.warn('PWA: Service Worker not available for caching');
            return;
        }

        try {
            this.serviceWorkerRegistration.active?.postMessage({
                type: 'CACHE_URLS',
                urls
            });
            console.log('PWA: Requested caching of important resources');
        } catch (error) {
            console.error('PWA: Failed to cache resources:', error);
        }
    }

    /**
     * Update service worker
     */
    async updateServiceWorker(): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            throw new Error('Service Worker not available');
        }

        try {
            await this.serviceWorkerRegistration.update();
            console.log('PWA: Service Worker update requested');
        } catch (error) {
            console.error('PWA: Service Worker update failed:', error);
            throw error;
        }
    }

    /**
     * Skip waiting for new service worker
     */
    skipWaitingForNewServiceWorker(): void {
        if (this.serviceWorkerRegistration?.waiting) {
            this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    /**
     * Handle service worker messages
     */
    private handleServiceWorkerMessage(data: any): void {
        switch (data.type) {
            case 'BACKGROUND_SYNC_COMPLETE':
                console.log('PWA: Background sync completed');
                this.notifyBackgroundSyncComplete();
                break;
            case 'CACHE_UPDATED':
                console.log('PWA: Cache updated');
                this.notifyCacheUpdated();
                break;
            default:
                console.log('PWA: Unknown service worker message:', data);
        }
    }

    /**
     * Sync when app becomes visible
     */
    private async syncWhenVisible(): Promise<void> {
        if (this.capabilities.supportsBackgroundSync && this.serviceWorkerRegistration) {
            try {
                // Check if sync is available on the registration
                if ('sync' in this.serviceWorkerRegistration) {
                    await (this.serviceWorkerRegistration as any).sync.register('background-sync');
                    console.log('PWA: Background sync registered');
                } else {
                    console.log('PWA: Background sync not supported');
                }
            } catch (error) {
                console.error('PWA: Background sync registration failed:', error);
            }
        }
    }

    /**
     * Convert VAPID key for push subscription
     */
    private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer;
    }

    /**
     * Event notification methods
     */
    private notifyInstallAvailable(): void {
        window.dispatchEvent(new CustomEvent('pwa:installAvailable'));
    }

    private notifyAppInstalled(): void {
        window.dispatchEvent(new CustomEvent('pwa:appInstalled'));
    }

    private notifyServiceWorkerUpdate(): void {
        window.dispatchEvent(new CustomEvent('pwa:serviceWorkerUpdate'));
    }

    private notifyConnectionChange(isOnline: boolean): void {
        window.dispatchEvent(new CustomEvent('pwa:connectionChange', {
            detail: { isOnline }
        }));
    }

    private notifyBackgroundSyncComplete(): void {
        window.dispatchEvent(new CustomEvent('pwa:backgroundSyncComplete'));
    }

    private notifyCacheUpdated(): void {
        window.dispatchEvent(new CustomEvent('pwa:cacheUpdated'));
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Remove event listeners and cleanup
        this.clearOfflineQueue();
    }
}

// Export singleton instance
export const pwaService = new PWAService();
export default pwaService;