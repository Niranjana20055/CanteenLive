import 'dotenv/config';

// Stop immediately (with a clear message) if the .env file is incomplete.
for (const key of ['MONGO_URI', 'REDIS_URL', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  mongoDb: process.env.MONGO_DB || 'canteenlive',
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  // comma-separated list allowed, e.g. http://localhost:5173,http://192.168.1.5:5173
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  // false = students can check in even when the stall is "closed" (handy for demos at night)
  enforceHours: process.env.ENFORCE_HOURS === 'true',
};
