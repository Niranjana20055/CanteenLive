import { redis, keys, createSubscriber, CHANNEL } from '../db/redis.js';
import '../redis/commands.js';
import { estimateWait } from '../utils/wait.js';

// A self-check for the Redis part. It uses its own key names (test_*), so real queues are not touched.
let failed = 0;
const check = (condition, message) => {
  console.log(condition ? '  PASS' : '  FAIL', message);
  if (!condition) failed++;
};

const S = 'test_stall';
const checkIn = (u) => redis.qCheckIn(keys.userQueue(u), keys.active(S), keys.queue(S), u, S);
const checkOut = (u) => redis.qCheckOut(keys.userQueue(u), keys.active(S), keys.queue(S), u, S);
const cleanup = async () => {
  const found = [...(await redis.keys(`*${S}*`)), ...(await redis.keys('user:queue:TEST*'))];
  if (found.length) await redis.del(...found);
};

await cleanup();

console.log('\n1. Race condition: the SAME student taps "Check in" 50 times at the same instant');
const race = await Promise.all(Array.from({ length: 50 }, () => checkIn('TEST_RACE')));
check(race.filter((r) => r[0] === 1).length === 1, 'exactly ONE of the 50 requests was accepted');
check((await redis.get(keys.queue(S))) === '1', 'queue counter is 1 (not 50)');

console.log('\n2. Thirty different students check in at the same instant');
await Promise.all(Array.from({ length: 30 }, (_, i) => checkIn(`TEST_${i}`)));
check((await redis.get(keys.queue(S))) === '31', 'counter is 31');
check((await redis.scard(keys.active(S))) === 31, 'the Redis Set holds 31 students');

console.log('\n3. Check-out');
const out = await checkOut('TEST_0');
check(out[0] === 1 && out[1] === 30, 'counter goes down to 30');
check((await checkOut('TEST_0'))[0] === 0, 'checking out twice is rejected');

console.log('\n4. Staff correction (never below zero)');
let a = await redis.qAdjust(keys.queue(S), 'set', 13);
check(a[0] === 30 && a[1] === 13, 'staff set the count from 30 to 13');
await redis.qAdjust(keys.queue(S), 'set', 0);
a = await redis.qAdjust(keys.queue(S), 'dec', 0);
check(a[1] === 0, 'decrement at 0 stays 0');
a = await redis.qAdjust(keys.queue(S), 'set', -5);
check(a[1] === 0, 'a negative value is clamped to 0');

console.log('\n5. Pub/Sub');
const sub = createSubscriber();
await sub.subscribe(CHANNEL);
const received = new Promise((resolve) => sub.on('message', (c, m) => resolve(JSON.parse(m))));
await redis.publish(CHANNEL, JSON.stringify({ event: 'QUEUE_UPDATED', stall_id: S, queue_length: 5 }));
check((await received).queue_length === 5, 'a published message reaches the subscriber');

console.log('\n6. Wait-time formula: queue x service time / counters');
check(estimateWait(12, 3, 1) === 36, '12 people x 3 min / 1 counter = 36');
check(estimateWait(12, 3, 2) === 18, '12 people x 3 min / 2 counters = 18');
check(estimateWait(5, 3, 0) === 15, '0 counters does not crash (treated as 1)');

await cleanup();
await sub.quit();
await redis.quit();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
