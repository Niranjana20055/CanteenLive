import Redis from 'ioredis';
import { config } from '../config.js';

// Main connection: used for GET / SET / Lua scripts / PUBLISH
export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 3 });
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (e) => console.error('Redis error:', e.message));

// A connection that has called SUBSCRIBE can do nothing else, so it needs its own copy.
export const createSubscriber = () => redis.duplicate();

export const CHANNEL = 'queue:updates';

// One place for the key naming convention from Review 1.
export const keys = {
  queue: (stallId) => `queue:${stallId}`,
  active: (stallId) => `active_checkins:${stallId}`,
  userQueue: (userId) => `user:queue:${userId}`,
};
