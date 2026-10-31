import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { connectMongo, closeMongo } from '../db/mongo.js';

const EVENT_DAYS = 30;           // how many days of history to invent
const DEV_PASSWORD = 'canteen123'; // every seeded account uses this (development only!)

const db = await connectMongo();
const stallsRaw = JSON.parse(readFileSync(new URL('../seed/stalls.json', import.meta.url), 'utf8'));

/* ---------- helpers ---------- */
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const round2 = (n) => Math.round(n * 100) / 100;
const pad = (n) => String(n).padStart(2, '0');

function makeHours(weekday, weekend) {
  const hours = {};
  for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) hours[d] = { open: weekday[0], close: weekday[1] };
  for (const d of ['saturday', 'sunday']) hours[d] = { open: weekend[0], close: weekend[1] };
  return hours;
}

// how busy each hour of the day is (relative): breakfast, LUNCH rush, evening snacks
const HOUR_WEIGHT = { 8: 2, 9: 3, 10: 2, 11: 4, 12: 10, 13: 10, 14: 5, 15: 3, 16: 5, 17: 8, 18: 6, 19: 3 };
const HOURS = Object.keys(HOUR_WEIGHT).map(Number);
const TOTAL_WEIGHT = HOURS.reduce((s, h) => s + HOUR_WEIGHT[h], 0);
function pickHour() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const h of HOURS) { r -= HOUR_WEIGHT[h]; if (r <= 0) return h; }
  return 12;
}

const estimate = (len, avg, counters) => Math.round((len * avg) / Math.max(counters, 1));

/* ---------- 1. stalls ---------- */
const stalls = stallsRaw.map((s) => ({
  _id: s._id, name: s.name, location: s.location, menu: s.menu,
  hours: makeHours(s.weekday_hours, s.weekend_hours),
  avg_service_time: s.avg_service_time, active_counters: s.active_counters,
  created_at: new Date(),
}));
await db.collection('stalls').deleteMany({});
await db.collection('stalls').insertMany(stalls);
console.log(`stalls: inserted ${stalls.length}`);

/* ---------- 2. users ---------- */
const hash = await bcrypt.hash(DEV_PASSWORD, 10);
const users = [
  { reg_no: 'ADMIN001', name: 'Project Admin', role: 'admin', stall_id: null },
  ...stalls.map((s, i) => ({ reg_no: `STAFF00${i + 1}`, name: `${s.name} Staff`, role: 'staff', stall_id: s._id })),
  { reg_no: '23BCE0314', name: 'Kashish', role: 'student', stall_id: null },
  { reg_no: '23BCE0780', name: 'Niranjana Vijayaraghavan', role: 'student', stall_id: null },
  { reg_no: '23BCE2100', name: 'Priyal Chamaria', role: 'student', stall_id: null },
].map((u) => ({ ...u, password_hash: hash, created_at: new Date() }));
await db.collection('users').deleteMany({});
await db.collection('users').insertMany(users);
console.log(`users: inserted ${users.length}  (password for all: ${DEV_PASSWORD})`);

/* ---------- 3. queue_events (SIMULATED history) ---------- */
// Only removes earlier simulated data - events created by the real app (source:'app') are kept.
await db.collection('queue_events').deleteMany({ source: 'seed' });

const studentPool = Array.from({ length: 80 }, (_, i) => `23BCE${1000 + i}`);
const events = [];

for (let dayAgo = EVENT_DAYS; dayAgo >= 1; dayAgo--) {
  const date = new Date(Date.now() - dayAgo * 24 * 3600 * 1000);
  const dateStr = new Date(date.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // date in IST
  const isWeekend = [0, 6].includes(new Date(`${dateStr}T12:00:00+05:30`).getDay());

  for (const [idx, s] of stallsRaw.entries()) {
    const visits = Math.round(randInt(40, 60) * s.popularity * (isWeekend ? 0.6 : 1));
    for (let v = 0; v < visits; v++) {
      const hour = pickHour();
      const start = new Date(`${dateStr}T${pad(hour)}:${pad(randInt(0, 59))}:${pad(randInt(0, 59))}+05:30`);
      const user_id = studentPool[randInt(0, studentPool.length - 1)];

      const lengthAfter = Math.max(1, Math.round(HOUR_WEIGHT[hour] * s.popularity * rand(0.3, 0.9)));
      const estimated = estimate(lengthAfter, s.avg_service_time, s.active_counters);
      const actual = round2(Math.max(1, estimated * rand(0.75, 1.35) + rand(0.5, 2))); // real time differs from the estimate

      events.push({
        stall_id: s._id, user_id, type: 'CHECK_IN', queue_length_after: lengthAfter,
        estimated_wait_minutes: estimated, source: 'seed', timestamp: start,
      });
      events.push({
        stall_id: s._id, user_id, type: 'CHECK_OUT', queue_length_after: Math.max(0, lengthAfter - 1),
        duration_min: actual, source: 'seed', timestamp: new Date(start.getTime() + actual * 60000),
      });
    }

    // staff corrections: the digital count drifts from the physical queue a few times a day
    for (let c = 0; c < randInt(1, 4); c++) {
      const hour = pickHour();
      const previous = randInt(0, 15);
      const next = Math.max(0, previous + (Math.random() < 0.5 ? -1 : 1) * randInt(1, 5));
      events.push({
        stall_id: s._id, user_id: `STAFF00${idx + 1}`, type: 'STAFF_SET',
        previous_length: previous, new_length: next, queue_length_after: next, source: 'seed',
        timestamp: new Date(`${dateStr}T${pad(hour)}:${pad(randInt(0, 59))}:00+05:30`),
      });
    }
  }
}

for (let i = 0; i < events.length; i += 2000) {
  await db.collection('queue_events').insertMany(events.slice(i, i + 2000), { ordered: false });
}
console.log(`queue_events: inserted ${events.length} simulated events for the last ${EVENT_DAYS} days`);
console.log('\nDone. Next: npm run indexes');
await closeMongo();
