const redis = require('redis');
require('dotenv').config({ path: '.env.development' });

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      socket: {
        connectTimeout: 5000,
        reconnectDelayOnFailure: 1000,
      }
    };
  }

  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      console.log('🔗 Connecting to Redis...');

      this.client = redis.createClient(this.config);

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis client ready for operations');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      console.log('⚠️  Running without Redis caching (degraded performance)');
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis client disconnected');
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Redis GET error for key "${key}":`, error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedData = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedData);
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key "${key}":`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL error for key "${key}":`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key "${key}":`, error.message);
      return false;
    }
  }

  async flushPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis FLUSH pattern error for "${pattern}":`, error.message);
      return false;
    }
  }

  // Generate cache keys
  generateKey(prefix, ...args) {
    const keyParts = [prefix, ...args].filter(Boolean);
    return keyParts.join(':');
  }

  // TTL constants
  static TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 1800,       // 30 minutes
    EXTRA_LONG: 3600  // 1 hour
  };

  // Health check
  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return {
        status: 'disconnected',
        message: 'Redis client not connected'
      };
    }

    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = 'ok';

      // Test SET
      await this.client.setEx(testKey, 10, testValue);

      // Test GET
      const result = await this.client.get(testKey);

      // Test DEL
      await this.client.del(testKey);

      return {
        status: result === testValue ? 'healthy' : 'error',
        message: result === testValue ? 'Redis operations working correctly' : 'Redis operations failed'
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Redis health check failed: ${error.message}`
      };
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;