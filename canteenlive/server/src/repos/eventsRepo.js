import { getDb } from '../db/mongo.js';

export const events = () => getDb().collection('queue_events');

// Append one event (CHECK_IN, CHECK_OUT, STAFF_INC, STAFF_DEC, STAFF_SET)
export async function logEvent(doc) {
  const full = { source: 'app', ...doc, timestamp: new Date() };
  await events().insertOne(full);
  return full;
}

// Most recent CHECK_IN of this student at this stall (used to compute time spent in queue)
export const lastCheckIn = (user_id, stall_id) =>
  events().findOne({ user_id, stall_id, type: 'CHECK_IN' }, { sort: { timestamp: -1 } });

// Latest events of a stall (shown in the staff panel)
export const recentEvents = (stall_id, limit = 10) =>
  events().find({ stall_id }).sort({ timestamp: -1 }).limit(limit).toArray();
