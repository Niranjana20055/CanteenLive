import { redis } from '../db/redis.js';

/*
  Why Lua?  Redis runs a Lua script as ONE uninterruptible step.
  Two students tapping "Check In" at the same instant can never both slip through,
  and the counter can never go below zero.
*/

// KEYS: user:queue:{uid}, active_checkins:{sid}, queue:{sid}     ARGV: uid, sid
// returns [1, newLength]  = joined      |  [0, "stall_id"] = already in a queue
redis.defineCommand('qCheckIn', {
  numberOfKeys: 3,
  lua: `
    if redis.call('EXISTS', KEYS[1]) == 1 then
      return {0, redis.call('GET', KEYS[1])}
    end
    redis.call('SET', KEYS[1], ARGV[2])
    redis.call('SADD', KEYS[2], ARGV[1])
    local len = redis.call('INCR', KEYS[3])
    return {1, len}
  `,
});

// KEYS: user:queue:{uid}, active_checkins:{sid}, queue:{sid}     ARGV: uid, sid
// returns [1, newLength]  = left   |  [0, -1] = was not in that queue
redis.defineCommand('qCheckOut', {
  numberOfKeys: 3,
  lua: `
    if redis.call('GET', KEYS[1]) ~= ARGV[2] then
      return {0, -1}
    end
    redis.call('DEL', KEYS[1])
    redis.call('SREM', KEYS[2], ARGV[1])
    local len = tonumber(redis.call('GET', KEYS[3]) or '0')
    if len > 0 then
      len = redis.call('DECR', KEYS[3])
    end
    return {1, len}
  `,
});

// KEYS: queue:{sid}     ARGV: mode ('inc' | 'dec' | 'set'), value
// returns [previousLength, newLength]
redis.defineCommand('qAdjust', {
  numberOfKeys: 1,
  lua: `
    local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
    local nxt
    if ARGV[1] == 'inc' then
      nxt = cur + 1
    elseif ARGV[1] == 'dec' then
      nxt = math.max(cur - 1, 0)
    else
      nxt = math.max(tonumber(ARGV[2]), 0)
    end
    redis.call('SET', KEYS[1], nxt)
    return {cur, nxt}
  `,
});
