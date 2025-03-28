/**
 * Interface for cache entries with timestamp for TTL checking
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  accessed: number; // Last access time
  accessCount: number; // Number of times accessed
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

/**
 * Enhanced cache implementation with TTL support and metrics
 * Provides both fresh and stale data access with statistics
 */
export class Cache {
  private cache: Record<string, CacheEntry> = {};
  private ttl: number; // Time to live in milliseconds
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    size: 0,
    oldestEntry: null,
    newestEntry: null
  };
  
  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }
  
  /**
   * Get data from cache if not expired
   */
  get(key: string): any | null {
    const entry = this.cache[key];
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.stats.misses++;
      return null; // Expired
    }
    
    // Update access metadata
    entry.accessed = now;
    entry.accessCount++;
    this.stats.hits++;
    
    return entry.data;
  }
  
  /**
   * Get data even if expired (for fallback)
   */
  getStale(key: string): any | null {
    const entry = this.cache[key];
    if (!entry) {
      return null;
    }
    
    // Update access metadata even for stale data
    const now = Date.now();
    entry.accessed = now;
    entry.accessCount++;
    
    // Track stale hits separately
    if (now - entry.timestamp > this.ttl) {
      this.stats.staleHits++;
    }
    
    return entry.data;
  }
  
  /**
   * Check if cache has a specific key (even if expired)
   */
  has(key: string): boolean {
    return key in this.cache;
  }
  
  /**
   * Check if data is expired
   */
  isExpired(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return true;
    
    return Date.now() - entry.timestamp > this.ttl;
  }
  
  /**
   * Store data in cache
   */
  set(key: string, data: any): void {
    const now = Date.now();
    const isNewKey = !this.cache[key];
    
    this.cache[key] = {
      data,
      timestamp: now,
      accessed: now,
      accessCount: 0
    };
    
    // Update stats
    if (isNewKey) {
      this.stats.size++;
    }
    
    // Update oldest/newest entry stats
    if (this.stats.oldestEntry === null || this.stats.oldestEntry > now) {
      this.stats.oldestEntry = now;
    }
    this.stats.newestEntry = now;
  }
  
  /**
   * Remove specific key from cache to force refresh
   */
  forceRefresh(key: string): void {
    if (this.cache[key]) {
      delete this.cache[key];
      this.stats.size--;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Get time until expiration for a key (in ms)
   * Returns negative number if already expired
   */
  getTimeToExpiration(key: string): number | null {
    const entry = this.cache[key];
    if (!entry) return null;
    
    return this.ttl - (Date.now() - entry.timestamp);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache = {};
    // Reset stats except for hits/misses
    this.stats.size = 0;
    this.stats.oldestEntry = null;
    this.stats.newestEntry = null;
  }
}
