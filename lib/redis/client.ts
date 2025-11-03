import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return redis;
}

// Cache helpers
export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  const client = getRedisClient();
  await client.setex(key, ttl, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
}

export async function cacheDelete(key: string) {
  const client = getRedisClient();
  await client.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.exists(key);
  return result === 1;
}

// Session helpers
export async function setSession(sessionId: string, data: any, ttl: number = 86400) {
  await cacheSet(`session:${sessionId}`, data, ttl);
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  return await cacheGet<T>(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string) {
  await cacheDelete(`session:${sessionId}`);
}

// Port management helpers
export async function acquirePort(range: 'frontend' | 'backend'): Promise<number> {
  const client = getRedisClient();
  const startPort = range === 'frontend' 
    ? parseInt(process.env.FRONTEND_PORT_START || '50000')
    : parseInt(process.env.BACKEND_PORT_START || '60001');
  const endPort = range === 'frontend'
    ? parseInt(process.env.FRONTEND_PORT_END || '60000')
    : parseInt(process.env.BACKEND_PORT_END || '70000');

  // Try to acquire a port
  for (let port = startPort; port <= endPort; port++) {
    const key = `port:${range}:${port}`;
    const acquired = await client.setnx(key, '1');
    
    if (acquired === 1) {
      // Port acquired successfully
      await client.expire(key, 86400); // Expire after 24 hours as safety
      return port;
    }
  }

  throw new Error(`No available ports in ${range} range`);
}

export async function releasePort(range: 'frontend' | 'backend', port: number) {
  const client = getRedisClient();
  const key = `port:${range}:${port}`;
  await client.del(key);
}

export default getRedisClient;
