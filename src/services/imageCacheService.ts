class ImageCacheService {
  private cache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();
  private preloadProgress = new Map<string, { loaded: number; total: number }>();
  private preloadedImages = new Set<string>(); // Track successfully preloaded images

  /**
   * Preload multiple images and track progress
   */
  async preloadImages(
    imageUrls: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const validUrls = imageUrls.filter(url => url && url.trim() !== '');
    if (validUrls.length === 0) return;

    const batchId = `batch-${Date.now()}`;
    this.preloadProgress.set(batchId, { loaded: 0, total: validUrls.length });

    console.log(`Starting preload of ${validUrls.length} images`);

    const promises = validUrls.map(async (url) => {
      try {
        await this.simplePreloadImage(url);
        this.preloadedImages.add(url);
        const progress = this.preloadProgress.get(batchId);
        if (progress) {
          progress.loaded++;
          onProgress?.(progress.loaded, progress.total);
          console.log(`Image ${progress.loaded}/${progress.total} preloaded: ${url}`);
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
        const progress = this.preloadProgress.get(batchId);
        if (progress) {
          progress.loaded++;
          onProgress?.(progress.loaded, progress.total);
        }
      }
    });

    await Promise.allSettled(promises);
    this.preloadProgress.delete(batchId);
    console.log(`Completed preloading ${validUrls.length} images`);
  }

  /**
   * Simple image preloading that just loads into browser cache
   */
  private simplePreloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve();
      };

      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${url}`));
      };

      // Set a timeout for slow-loading images
      setTimeout(() => {
        reject(new Error(`Image preload timeout: ${url}`));
      }, 10000); // 10 second timeout

      img.src = url;
    });
  }

  /**
   * Load a single image and cache it
   */
  async loadImage(url: string): Promise<string> {
    if (!url || url.trim() === '') {
      throw new Error('Invalid image URL');
    }

    // Return cached version if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Create new loading promise
    const loadingPromise = this.createImageLoadPromise(url);
    this.loadingPromises.set(url, loadingPromise);

    try {
      const cachedUrl = await loadingPromise;
      this.cache.set(url, cachedUrl);
      return cachedUrl;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Create a promise that loads an image
   */
  private createImageLoadPromise(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Enable cross-origin for images that support it
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Simply resolve with the original URL since the image is now in browser cache
        // This avoids issues with blob URLs becoming invalid over time
        resolve(url);
      };

      img.onerror = () => {
        // Try without crossOrigin for images that don't support it
        if (img.crossOrigin) {
          img.crossOrigin = '';
          img.src = url; // Retry without CORS
        } else {
          reject(new Error(`Failed to load image: ${url}`));
        }
      };

      // Set a timeout for slow-loading images
      setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, 15000); // 15 second timeout

      img.src = url;
    });
  }

  /**
   * Get cached image URL
   */
  getCachedImage(url: string): string | null {
    return this.cache.get(url) || null;
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Check if image is currently loading
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url);
  }

  /**
   * Check if image was preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.preloadProgress.clear();
    this.preloadedImages.clear();
    console.log('Image cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    };
  }

  /**
   * Preload images for specific players
   */
  async preloadPlayerImages(
    players: Array<{ imageUrl?: string; name: string }>,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const imageUrls = players
      .map(player => player.imageUrl)
      .filter((url): url is string => Boolean(url));

    if (imageUrls.length === 0) {
      console.log('No player images to preload');
      return;
    }

    console.log(`Preloading images for ${imageUrls.length} players`);
    await this.preloadImages(imageUrls, onProgress);
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
