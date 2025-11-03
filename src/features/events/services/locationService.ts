import { LocationSuggestion } from '@features/events/types/event.types';

// API configuration
const API_BASE_URL = '/api';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

// Timeout for location search requests
const LOCATION_SEARCH_TIMEOUT = 10000; // 10 seconds

class LocationService {
  private debounceTimer: number | null = null;
  private abortController: AbortController | null = null;

  /**
   * Debounces a function call
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        if (this.debounceTimer !== null) {
          window.clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }

  /**
   * Searches for location suggestions based on query with timeout handling
   * Requirements: 8.3, 10.4, 10.6
   */
  private async searchLocationsInternal(query: string): Promise<LocationSuggestion[]> {
    // Cancel any pending request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Don't search for empty or very short queries
    if (!query || query.trim().length < 2) {
      return [];
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort();
      }
    }, LOCATION_SEARCH_TIMEOUT);

    try {
      const params = new URLSearchParams({ q: query.trim() });
      const response = await fetch(`${API_BASE_URL}/locations/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to search locations'
        }));
        throw new Error(errorData.message || 'Failed to search locations');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Check if it was a timeout or manual cancellation
          if (this.abortController === null) {
            // Request was cancelled manually, return empty array
            return [];
          }
          // Request timed out
          throw new Error('Location search timeout. Please try again.');
        }
        throw error;
      }
      throw new Error('Network error occurred while searching locations');
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Searches for location suggestions with debouncing
   * Requirements: 8.3
   */
  searchLocations = this.debounce(
    this.searchLocationsInternal.bind(this),
    DEBOUNCE_DELAY
  );

  /**
   * Gets the user's current location
   */
  async getCurrentLocation(): Promise<LocationSuggestion> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get location details
            const response = await fetch(
              `${API_BASE_URL}/locations/reverse?lat=${latitude}&lng=${longitude}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              }
            );

            if (!response.ok) {
              throw new Error('Failed to get location details');
            }

            const result = await response.json();
            resolve(result.data);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        }
      );
    });
  }

  /**
   * Cancels any pending location search
   */
  cancelSearch(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
