import { redis } from '../db/redis.js';

// Sets every live queue back to zero (run before a demo).  MongoDB is NOT touched.
const patterns = ['queue:*', 'active_checkins:*', 'user:queue:*'];
for (const pattern of patterns) {
  const found = await redis.keys(pattern);
  if (found.length) await redis.del(...found);
  console.log(`${pattern} -> removed ${found.length} keys`);
}
await redis.quit();
