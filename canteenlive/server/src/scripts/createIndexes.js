import { connectMongo, closeMongo } from '../db/mongo.js';

const db = await connectMongo();

// Safe to run many times: MongoDB does nothing if the index already exists.
await db.collection('users').createIndex({ reg_no: 1 }, { unique: true, name: 'uniq_reg_no' });

await db.collection('stalls').createIndex({ name: 1 }, { unique: true, name: 'uniq_stall_name' });
await db.collection('stalls').createIndex({ name: 'text', 'menu.name': 'text' }, { name: 'text_stall_menu' });

const ev = db.collection('queue_events');
await ev.createIndex({ stall_id: 1, timestamp: -1 }, { name: 'stall_time' });   // "latest events of a stall"
await ev.createIndex({ user_id: 1, timestamp: -1 }, { name: 'user_time' });     // "last check-in of a student"
await ev.createIndex({ type: 1, timestamp: -1 }, { name: 'type_time' });        // analytics: all CHECK_INs in a date range
await ev.createIndex({ timestamp: 1 }, { name: 'ttl_90d', expireAfterSeconds: 60 * 60 * 24 * 90 }); // auto-delete after 90 days

for (const name of ['users', 'stalls', 'queue_events']) {
  console.log(`\n${name}:`);
  for (const ix of await db.collection(name).indexes()) console.log('  -', ix.name, JSON.stringify(ix.key));
}
await closeMongo();
