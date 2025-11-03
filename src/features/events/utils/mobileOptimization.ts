// Mobile optimization utilities for enhanced touch interactions and PWA capabilities

interface TouchGestureConfig {
  swipeThreshold: number;
  tapTimeout: number;
  longPressTimeout: number;
  doubleTapTimeout: number;
  pinchThreshold: number;
}

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class MobileOptimizationService {
  private config: TouchGestureConfig = {
    swipeThreshold: 50,
    tapTimeout: 300,
    longPressTimeout: 500,
    doubleTapTimeout: 300,
    pinchThreshold: 10
  };

  private touchStartPoints: TouchPoint[] = [];
  private lastTap: TouchPoint | null = null;
  private longPressTimer: number | null = null;

  /**
   * Detect device capabilities and optimize accordingly
   */
  static detectDeviceCapabilities(): {
    isMobile: boolean;
    isTablet: boolean;
    hasTouch: boolean;
    supportsVibration: boolean;
    supportsServiceWorker: boolean;
    supportsNotifications: boolean;
    connectionType: string;
    pixelRatio: number;
  } {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    
    return {
      isMobile,
      isTablet,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      supportsVibration: 'vibrate' in navigator,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsNotifications: 'Notification' in window,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Optimize touch target sizes for mobile
   */
  static optimizeTouchTargets(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Minimum touch target size (44px recommended by Apple, 48dp by Google) */
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      /* Enhanced button styles for mobile */
      .mobile-button {
        padding: 12px 16px;
        border-radius: 8px;
        border: none;
        font-size: 16px; /* Prevents zoom on iOS */
        line-height: 1.5;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.2s ease;
      }

      .mobile-button:active {
        transform: scale(0.98);
        opacity: 0.8;
      }

      /* Improved form inputs for mobile */
      .mobile-input {
        font-size: 16px; /* Prevents zoom on iOS */
        padding: 12px;
        border-radius: 8px;
        border: 2px solid #e1e5e9;
        width: 100%;
        box-sizing: border-box;
      }

      .mobile-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      }

      /* Swipe indicators */
      .swipe-indicator {
        position: relative;
        overflow: hidden;
      }

      .swipe-indicator::after {
        content: '';
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid #666;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        opacity: 0.5;
      }

      /* Pull-to-refresh indicator */
      .pull-to-refresh {
        position: relative;
        overflow: hidden;
      }

      .pull-indicator {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #007bff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: top 0.3s ease;
      }

      .pull-indicator.visible {
        top: 10px;
      }

      /* Loading states optimized for mobile */
      .mobile-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        gap: 12px;
      }

      .mobile-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Responsive grid for mobile */
      .mobile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        padding: 16px;
      }

      /* Safe area handling for notched devices */
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }

      .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }

      .safe-area-left {
        padding-left: env(safe-area-inset-left);
      }

      .safe-area-right {
        padding-right: env(safe-area-inset-right);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Setup swipe gesture detection
   */
  setupSwipeGestures(
    element: HTMLElement,
    onSwipe: (direction: SwipeDirection) => void,
    config?: Partial<TouchGestureConfig>
  ): () => void {
    const gestureConfig = { ...this.config, ...config };
    let startTouch: TouchPoint | null = null;
    let currentTouch: TouchPoint | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startTouch = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && startTouch) {
        const touch = e.touches[0];
        currentTouch = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startTouch && currentTouch) {
        const deltaX = currentTouch.x - startTouch.x;
        const deltaY = currentTouch.y - startTouch.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = currentTouch.timestamp - startTouch.timestamp;
        const velocity = distance / duration;

        if (distance > gestureConfig.swipeThreshold) {
          let direction: 'left' | 'right' | 'up' | 'down';
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          onSwipe({
            direction,
            distance,
            velocity,
            duration
          });
        }
      }

      startTouch = null;
      currentTouch = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  /**
   * Setup long press gesture detection
   */
  setupLongPress(
    element: HTMLElement,
    onLongPress: (point: TouchPoint) => void,
    config?: Partial<TouchGestureConfig>
  ): () => void {
    const gestureConfig = { ...this.config, ...config };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const touchPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        this.longPressTimer = window.setTimeout(() => {
          onLongPress(touchPoint);
          this.provideTactileFeedback();
        }, gestureConfig.longPressTimeout);
      }
    };

    const handleTouchEnd = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };

    const handleTouchMove = () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    };
  }

  /**
   * Setup double tap gesture detection
   */
  setupDoubleTap(
    element: HTMLElement,
    onDoubleTap: (point: TouchPoint) => void,
    config?: Partial<TouchGestureConfig>
  ): () => void {
    const gestureConfig = { ...this.config, ...config };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const touchPoint = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        if (this.lastTap) {
          const timeDiff = touchPoint.timestamp - this.lastTap.timestamp;
          const distance = Math.sqrt(
            Math.pow(touchPoint.x - this.lastTap.x, 2) +
            Math.pow(touchPoint.y - this.lastTap.y, 2)
          );

          if (timeDiff < gestureConfig.doubleTapTimeout && distance < 50) {
            onDoubleTap(touchPoint);
            this.provideTactileFeedback();
            this.lastTap = null;
            return;
          }
        }

        this.lastTap = touchPoint;
        setTimeout(() => {
          this.lastTap = null;
        }, gestureConfig.doubleTapTimeout);
      }
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  /**
   * Provide tactile feedback (vibration)
   */
  provideTactileFeedback(pattern: number | number[] = 50): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Setup pull-to-refresh functionality
   */
  setupPullToRefresh(
    element: HTMLElement,
    onRefresh: () => Promise<void>,
    threshold: number = 80
  ): () => void {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;
    let pullIndicator: HTMLElement | null = null;

    // Create pull indicator
    const createPullIndicator = () => {
      pullIndicator = document.createElement('div');
      pullIndicator.className = 'pull-indicator';
      pullIndicator.innerHTML = '↓';
      element.style.position = 'relative';
      element.appendChild(pullIndicator);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        if (!pullIndicator) {
          createPullIndicator();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY > 0 && !isRefreshing) {
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0) {
          e.preventDefault();
          
          if (pullIndicator) {
            const progress = Math.min(pullDistance / threshold, 1);
            pullIndicator.style.top = `${-60 + (progress * 70)}px`;
            pullIndicator.style.transform = `translateX(-50%) rotate(${progress * 180}deg)`;
            
            if (progress >= 1) {
              pullIndicator.innerHTML = '↑';
              pullIndicator.style.background = '#28a745';
            } else {
              pullIndicator.innerHTML = '↓';
              pullIndicator.style.background = '#007bff';
            }
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (startY > 0 && !isRefreshing) {
        const pullDistance = currentY - startY;
        
        if (pullDistance >= threshold) {
          isRefreshing = true;
          
          if (pullIndicator) {
            pullIndicator.innerHTML = '⟳';
            pullIndicator.style.animation = 'spin 1s linear infinite';
          }

          try {
            await onRefresh();
          } finally {
            isRefreshing = false;
            if (pullIndicator) {
              pullIndicator.style.top = '-60px';
              pullIndicator.style.animation = '';
              pullIndicator.innerHTML = '↓';
              pullIndicator.style.background = '#007bff';
            }
          }
        } else if (pullIndicator) {
          pullIndicator.style.top = '-60px';
        }
      }

      startY = 0;
      currentY = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (pullIndicator) {
        pullIndicator.remove();
      }
    };
  }

  /**
   * Optimize images for mobile devices
   */
  static optimizeImagesForMobile(): void {
    const images = document.querySelectorAll('img[data-mobile-optimize]');
    
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Use appropriate image size based on device pixel ratio
      if (devicePixelRatio > 1) {
        const highResUrl = imageElement.dataset.highRes;
        if (highResUrl) {
          imageElement.src = highResUrl;
        }
      }

      // Add lazy loading
      imageElement.loading = 'lazy';
      
      // Add error handling
      imageElement.onerror = () => {
        const fallbackUrl = imageElement.dataset.fallback;
        if (fallbackUrl) {
          imageElement.src = fallbackUrl;
        }
      };
    });
  }

  /**
   * Setup responsive font sizing
   */
  static setupResponsiveFonts(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Responsive typography */
      html {
        font-size: 16px;
      }

      @media screen and (max-width: 480px) {
        html {
          font-size: 14px;
        }
        
        h1 { font-size: 1.8rem; }
        h2 { font-size: 1.5rem; }
        h3 { font-size: 1.3rem; }
        h4 { font-size: 1.1rem; }
        
        .small-text { font-size: 0.8rem; }
        .large-text { font-size: 1.2rem; }
      }

      @media screen and (min-width: 481px) and (max-width: 768px) {
        html {
          font-size: 15px;
        }
      }

      @media screen and (min-width: 769px) {
        html {
          font-size: 16px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Handle orientation changes
   */
  static setupOrientationHandling(onOrientationChange?: (orientation: string) => void): () => void {
    const handleOrientationChange = () => {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      // Add orientation class to body
      document.body.classList.remove('portrait', 'landscape');
      document.body.classList.add(orientation);
      
      // Call callback if provided
      if (onOrientationChange) {
        onOrientationChange(orientation);
      }

      // Force layout recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    // Initial setup
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }
}

// Export singleton instance
export const mobileOptimization = new MobileOptimizationService();
export default mobileOptimization;