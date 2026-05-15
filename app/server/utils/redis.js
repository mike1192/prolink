/**
 * 💾 Redis caching service
 * Centralized cache management for database queries
 */

import redis from "redis";

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.connected) return;

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error("❌ Redis reconnect limit exceeded");
              return new Error("Redis reconnect limit exceeded");
            }
            return retries * 100;
          },
        },
      });

      this.client.on("error", (err) => {
        console.error("🔴 Redis Client Error", err);
        this.connected = false;
      });

      this.client.on("connect", () => {
        console.log("✅ Redis connected");
        this.connected = true;
      });

      await this.client.connect();
      this.connected = true;
    } catch (err) {
      console.warn("⚠️ Redis connection failed. Caching disabled.", err.message);
      this.connected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.connected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`✅ Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (err) {
      console.error(`Error getting cache key ${key}:`, err);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = 600) {
    if (!this.connected) return false;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (err) {
      console.error(`Error setting cache key ${key}:`, err);
      return false;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key) {
    if (!this.connected) return false;

    try {
      const result = await this.client.del(key);
      console.log(`🗑️ Cache DELETE: ${key}`);
      return result > 0;
    } catch (err) {
      console.error(`Error deleting cache key ${key}:`, err);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    if (!this.connected) return false;

    try {
      await this.client.flushAll();
      console.log("🗑️ Cache FLUSH: All keys deleted");
      return true;
    } catch (err) {
      console.error("Error flushing cache:", err);
      return false;
    }
  }

  /**
   * Cache key generator
   */
  static key(prefix, params = {}) {
    const params_str = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join(":");
    return params_str ? `${prefix}:${params_str}` : prefix;
  }

  /**
   * Invalidate cache pattern
   */
  async invalidatePattern(pattern) {
    if (!this.connected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cache INVALIDATE: ${keys.length} keys matching "${pattern}"`);
      }
      return true;
    } catch (err) {
      console.error(`Error invalidating cache pattern ${pattern}:`, err);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      console.log("🔌 Redis disconnected");
    }
  }
}

export default new RedisCache();
