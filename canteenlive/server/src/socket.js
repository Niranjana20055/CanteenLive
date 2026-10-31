import { createSubscriber, CHANNEL } from './db/redis.js';

// Redis Pub/Sub -> Socket.IO bridge.
// Any server operation PUBLISHes to 'queue:updates'; this file receives it and pushes it to every browser.
export function initSocket(io) {
  const sub = createSubscriber();

  sub.subscribe(CHANNEL, (err) => {
    if (err) console.error('Could not subscribe to', CHANNEL, err.message);
    else console.log('Subscribed to Redis channel', CHANNEL);
  });

  sub.on('message', (channel, message) => {
    try {
      io.emit('queue:update', JSON.parse(message)); // -> every connected client
    } catch (e) {
      console.error('Bad pub/sub message:', e.message);
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });
}
