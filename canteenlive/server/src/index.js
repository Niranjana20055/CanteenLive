import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { connectMongo } from './db/mongo.js';
import { redis } from './db/redis.js';
import { initSocket } from './socket.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import stallRoutes from './routes/stalls.js';
import userRoutes from './routes/users.js';
import queueRoutes from './routes/queue.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.use(cors({ origin: config.clientOrigins }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', redis: redis.status, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/users', userRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.clientOrigins } });
initSocket(io);

await connectMongo();
server.listen(config.port, () => {
  console.log(`CanteenLive API running on http://localhost:${config.port}`);
});
