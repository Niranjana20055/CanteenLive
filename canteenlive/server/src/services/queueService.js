import { redis, keys, CHANNEL } from '../db/redis.js';
import '../redis/commands.js'; // registers redis.qCheckIn / qCheckOut / qAdjust
import { config } from '../config.js';
import { HttpError } from '../utils/errors.js';
import { estimateWait } from '../utils/wait.js';
import { isOpenNow } from '../utils/hours.js';
import { getStall, listStalls } from '../repos/stallsRepo.js';
import { logEvent, lastCheckIn } from '../repos/eventsRepo.js';

// Combine MongoDB stall info + Redis live count into one object for the UI
function toLive(stall, queueLength) {
  return {
    stall_id: stall._id,
    name: stall.name,
    location: stall.location,
    is_open: isOpenNow(stall.hours),
    queue_length: queueLength,
    estimated_wait_minutes: estimateWait(queueLength, stall.avg_service_time, stall.active_counters),
    avg_service_time: stall.avg_service_time,
    active_counters: stall.active_counters,
  };
}

const asInt = (v) => parseInt(v ?? '0', 10) || 0;

export async function getAllLive() {
  const stalls = await listStalls(); // MongoDB
  if (stalls.length === 0) return [];
  const counts = await redis.mget(stalls.map((s) => keys.queue(s._id))); // Redis (one round trip)
  return stalls.map((s, i) => toLive(s, asInt(counts[i])));
}

export async function getLive(stallId) {
  const stall = await getStall(stallId);
  if (!stall) throw new HttpError(404, 'Stall not found');
  return toLive(stall, asInt(await redis.get(keys.queue(stallId))));
}

// Tell everyone: save nothing here, just PUBLISH. socket.js listens and pushes to browsers.
async function announce(stall, queueLength) {
  const payload = {
    event: 'QUEUE_UPDATED',
    stall_id: stall._id,
    queue_length: queueLength,
    estimated_wait_minutes: estimateWait(queueLength, stall.avg_service_time, stall.active_counters),
  };
  await redis.publish(CHANNEL, JSON.stringify(payload));
  return payload;
}

// Logging to MongoDB must never break the live queue, so failures are only printed.
async function safeLog(doc) {
  try {
    await logEvent(doc);
  } catch (e) {
    console.error('queue_events insert failed:', e.message);
  }
}

export async function checkIn(user, stallId) {
  const stall = await getStall(stallId);
  if (!stall) throw new HttpError(404, 'Stall not found');
  if (config.enforceHours && !isOpenNow(stall.hours)) throw new HttpError(400, 'This stall is closed right now.');

  const [ok, value] = await redis.qCheckIn(
    keys.userQueue(user.reg_no), keys.active(stallId), keys.queue(stallId),
    user.reg_no, stallId
  );
  if (ok === 0) throw new HttpError(409, `You are already checked in at ${value}. Check out first.`);

  const payload = await announce(stall, value);
  await safeLog({
    stall_id: stallId, user_id: user.reg_no, type: 'CHECK_IN',
    queue_length_after: value, estimated_wait_minutes: payload.estimated_wait_minutes,
  });
  return payload;
}

export async function checkOut(user) {
  const stallId = await redis.get(keys.userQueue(user.reg_no));
  if (!stallId) throw new HttpError(409, 'You are not checked in anywhere.');

  const [ok, value] = await redis.qCheckOut(
    keys.userQueue(user.reg_no), keys.active(stallId), keys.queue(stallId),
    user.reg_no, stallId
  );
  if (ok === 0) throw new HttpError(409, 'You are not checked in at that stall.');

  const stall = (await getStall(stallId)) ?? { _id: stallId, avg_service_time: 3, active_counters: 1 };
  const payload = await announce(stall, value);

  // time spent in the queue = now - the moment of the matching CHECK_IN
  let duration_min = null;
  try {
    const start = await lastCheckIn(user.reg_no, stallId);
    if (start) duration_min = Math.round(((Date.now() - start.timestamp.getTime()) / 60000) * 100) / 100;
  } catch (e) {
    console.error('lastCheckIn failed:', e.message);
  }
  await safeLog({ stall_id: stallId, user_id: user.reg_no, type: 'CHECK_OUT', queue_length_after: value, duration_min });
  return payload;
}

export async function myQueue(user) {
  const stallId = await redis.get(keys.userQueue(user.reg_no));
  return { stall_id: stallId || null };
}

// action: 'inc' | 'dec' | 'set'
export async function staffAdjust(user, stallId, action, value) {
  const stall = await getStall(stallId);
  if (!stall) throw new HttpError(404, 'Stall not found');
  if (!['inc', 'dec', 'set'].includes(action)) throw new HttpError(400, "action must be 'inc', 'dec' or 'set'");
  if (action === 'set' && !(Number.isInteger(value) && value >= 0 && value <= 500)) {
    throw new HttpError(400, 'value must be a whole number between 0 and 500');
  }

  const [previous, next] = await redis.qAdjust(keys.queue(stallId), action, action === 'set' ? value : 0);
  const payload = await announce(stall, next);
  await safeLog({
    stall_id: stallId, user_id: user.reg_no,
    type: { inc: 'STAFF_INC', dec: 'STAFF_DEC', set: 'STAFF_SET' }[action],
    previous_length: previous, new_length: next, queue_length_after: next,
  });
  return payload;
}
