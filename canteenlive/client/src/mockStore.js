// In-browser mock store & real-time simulation engine
// Provides instant zero-backend demo support when localhost:5000 is not running.

const STORAGE_KEY = 'canteenlive_ref_state_v1';
const CHANNEL_NAME = 'canteenlive_ref_channel';

const INITIAL_STALLS = [
  {
    _id: 'stall_001',
    stall_id: 'stall_001',
    name: 'Burger Point',
    location: 'VIT Main Food Court - Counter 1',
    avg_service_time: 3,
    active_counters: 1,
    is_open: true,
    queue_length: 4,
    hours: {
      Monday: { open: '08:00', close: '20:00' },
      Tuesday: { open: '08:00', close: '20:00' },
      Wednesday: { open: '08:00', close: '20:00' },
      Thursday: { open: '08:00', close: '20:00' },
      Friday: { open: '08:00', close: '20:00' },
      Saturday: { open: '09:00', close: '18:00' },
      Sunday: { open: '09:00', close: '18:00' },
    },
    menu: [
      { item_id: 'item_001', name: 'Veg Burger', price: 80, available: true },
      { item_id: 'item_002', name: 'French Fries', price: 60, available: true },
      { item_id: 'item_003', name: 'Cold Coffee', price: 50, available: true },
      { item_id: 'item_004', name: 'Paneer Wrap', price: 90, available: false },
    ],
  },
  {
    _id: 'stall_002',
    stall_id: 'stall_002',
    name: 'South Indian Corner',
    location: 'VIT Main Food Court - Counter 2',
    avg_service_time: 2,
    active_counters: 2,
    is_open: true,
    queue_length: 6,
    hours: {
      Monday: { open: '07:30', close: '20:30' },
      Tuesday: { open: '07:30', close: '20:30' },
      Wednesday: { open: '07:30', close: '20:30' },
      Thursday: { open: '07:30', close: '20:30' },
      Friday: { open: '07:30', close: '20:30' },
      Saturday: { open: '08:00', close: '19:00' },
      Sunday: { open: '08:00', close: '19:00' },
    },
    menu: [
      { item_id: 'item_005', name: 'Masala Dosa', price: 70, available: true },
      { item_id: 'item_006', name: 'Idli (3 pcs)', price: 40, available: true },
      { item_id: 'item_007', name: 'Medu Vada', price: 30, available: true },
      { item_id: 'item_008', name: 'Filter Coffee', price: 20, available: true },
    ],
  },
  {
    _id: 'stall_003',
    stall_id: 'stall_003',
    name: 'Chinese Wok',
    location: 'VIT Main Food Court - Counter 3',
    avg_service_time: 4,
    active_counters: 1,
    is_open: true,
    queue_length: 7,
    hours: {
      Monday: { open: '11:00', close: '21:00' },
      Tuesday: { open: '11:00', close: '21:00' },
      Wednesday: { open: '11:00', close: '21:00' },
      Thursday: { open: '11:00', close: '21:00' },
      Friday: { open: '11:00', close: '21:00' },
      Saturday: { open: '11:00', close: '20:00' },
      Sunday: { open: '11:00', close: '20:00' },
    },
    menu: [
      { item_id: 'item_009', name: 'Veg Fried Rice', price: 90, available: true },
      { item_id: 'item_010', name: 'Veg Noodles', price: 90, available: true },
      { item_id: 'item_011', name: 'Gobi Manchurian', price: 80, available: true },
      { item_id: 'item_012', name: 'Spring Roll', price: 60, available: false },
    ],
  },
  {
    _id: 'stall_004',
    stall_id: 'stall_004',
    name: 'Chaat and Rolls',
    location: 'VIT Main Food Court - Counter 4',
    avg_service_time: 2,
    active_counters: 1,
    is_open: true,
    queue_length: 5,
    hours: {
      Monday: { open: '10:00', close: '20:00' },
      Tuesday: { open: '10:00', close: '20:00' },
      Wednesday: { open: '10:00', close: '20:00' },
      Thursday: { open: '10:00', close: '20:00' },
      Friday: { open: '10:00', close: '20:00' },
      Saturday: { open: '10:00', close: '19:00' },
      Sunday: { open: '10:00', close: '19:00' },
    },
    menu: [
      { item_id: 'item_013', name: 'Pani Puri', price: 40, available: true },
      { item_id: 'item_014', name: 'Samosa Chaat', price: 50, available: true },
      { item_id: 'item_015', name: 'Kathi Roll', price: 80, available: true },
    ],
  },
  {
    _id: 'stall_005',
    stall_id: 'stall_005',
    name: 'Juice and Shakes',
    location: 'VIT Main Food Court - Counter 5',
    avg_service_time: 2,
    active_counters: 1,
    is_open: true,
    queue_length: 3,
    hours: {
      Monday: { open: '09:00', close: '20:00' },
      Tuesday: { open: '09:00', close: '20:00' },
      Wednesday: { open: '09:00', close: '20:00' },
      Thursday: { open: '09:00', close: '20:00' },
      Friday: { open: '09:00', close: '20:00' },
      Saturday: { open: '09:00', close: '19:00' },
      Sunday: { open: '09:00', close: '19:00' },
    },
    menu: [
      { item_id: 'item_016', name: 'Mango Shake', price: 60, available: true },
      { item_id: 'item_017', name: 'Watermelon Juice', price: 40, available: true },
      { item_id: 'item_018', name: 'Oreo Shake', price: 80, available: true },
    ],
  },
];

const INITIAL_HISTORY = [
  { _id: 'h_01', stall_id: 'stall_001', type: 'STAFF_SET', previous_length: 2, new_length: 4, timestamp: new Date(Date.now() - 40000).toISOString() },
  { _id: 'h_02', stall_id: 'stall_002', type: 'CHECK_IN', previous_length: 5, new_length: 6, timestamp: new Date(Date.now() - 95000).toISOString() },
  { _id: 'h_03', stall_id: 'stall_003', type: 'CHECK_OUT', previous_length: 8, new_length: 7, timestamp: new Date(Date.now() - 150000).toISOString() },
  { _id: 'h_04', stall_id: 'stall_004', type: 'CHECK_IN', previous_length: 4, new_length: 5, timestamp: new Date(Date.now() - 210000).toISOString() },
];

export const DEMO_USERS = [
  { reg_no: '23BCE0314', name: 'Kashish', role: 'student', password: 'canteen123' },
  { reg_no: '23BCE0780', name: 'Niranjana', role: 'student', password: 'canteen123' },
  { reg_no: 'STAFF001', name: 'Burger Point Staff', role: 'staff', stall_id: 'stall_001', password: 'canteen123' },
  { reg_no: 'STAFF002', name: 'South Indian Staff', role: 'staff', stall_id: 'stall_002', password: 'canteen123' },
  { reg_no: 'STAFF003', name: 'Chinese Wok Staff', role: 'staff', stall_id: 'stall_003', password: 'canteen123' },
  { reg_no: 'STAFF004', name: 'Chaat & Rolls Staff', role: 'staff', stall_id: 'stall_004', password: 'canteen123' },
  { reg_no: 'STAFF005', name: 'Juice & Shakes Staff', role: 'staff', stall_id: 'stall_005', password: 'canteen123' },
  { reg_no: 'ADMIN001', name: 'Canteen Admin', role: 'admin', password: 'canteen123' },
];

export function calcWait(length, avgService, counters) {
  if (!counters || counters <= 0) return 0;
  return Math.round((length * avgService) / counters);
}

// Storage helpers
export function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  const fresh = {
    stalls: JSON.parse(JSON.stringify(INITIAL_STALLS)),
    history: INITIAL_HISTORY,
    userQueues: {}, // { '23BCE0314': 'stall_002' }
    lastTick: Date.now(),
  };
  saveStore(fresh);
  return fresh;
}

export function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

// Cross-tab broadcast channel
let bc = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    bc = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {}

const socketListeners = new Set();

export function onSocketUpdate(fn) {
  socketListeners.add(fn);
  return () => socketListeners.delete(fn);
}

export function offSocketUpdate(fn) {
  socketListeners.delete(fn);
}

function broadcastUpdate(payload) {
  socketListeners.forEach((fn) => fn(payload));
  if (bc) {
    try {
      bc.postMessage({ type: 'QUEUE_UPDATE', payload });
    } catch (e) {}
  }
}

if (typeof window !== 'undefined') {
  if (bc) {
    bc.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'QUEUE_UPDATE' && ev.data.payload) {
        socketListeners.forEach((fn) => fn(ev.data.payload));
      }
    };
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY) {
      // sync triggered by another tab
      const store = getStore();
      store.stalls.forEach((s) => {
        const est = calcWait(s.queue_length, s.avg_service_time, s.active_counters);
        socketListeners.forEach((fn) =>
          fn({ stall_id: s.stall_id || s._id, queue_length: s.queue_length, estimated_wait_minutes: est })
        );
      });
    }
  });
}

// Simulated real-time queue nudge (every 4-7 seconds across tabs)
let nextDelay = 4500;
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = getStore();
    const now = Date.now();
    if (now - (store.lastTick || 0) < nextDelay) return;

    store.lastTick = now;
    nextDelay = 4000 + Math.random() * 3000;

    const openStalls = store.stalls.filter((s) => s.is_open);
    if (!openStalls.length) return;

    const target = openStalls[Math.floor(Math.random() * openStalls.length)];
    let delta = Math.random() > 0.45 ? 1 : -1;
    if (target.queue_length <= 1) delta = 1;
    if (target.queue_length >= 20) delta = -1;

    target.queue_length = Math.max(0, target.queue_length + delta);
    saveStore(store);

    const est = calcWait(target.queue_length, target.avg_service_time, target.active_counters);
    broadcastUpdate({
      stall_id: target.stall_id || target._id,
      queue_length: target.queue_length,
      estimated_wait_minutes: est,
    });
  }, 1500);
}

// Mock API Handler for all client requests
export function handleMockApi(method, url, data) {
  const store = getStore();
  const cleanUrl = url.split('?')[0];

  // 1. Auth: /auth/login
  if (cleanUrl === '/auth/login' && method === 'POST') {
    const reg = (data.reg_no || '').trim().toUpperCase();
    const found = DEMO_USERS.find((u) => u.reg_no.toUpperCase() === reg) || {
      reg_no: reg,
      name: reg,
      role: 'student',
    };
    return { token: 'mock-token-' + Date.now(), user: found };
  }

  // 2. Auth: /auth/register
  if (cleanUrl === '/auth/register' && method === 'POST') {
    const reg = (data.reg_no || '').trim().toUpperCase();
    const name = data.name || reg;
    return { token: 'mock-token-' + Date.now(), user: { reg_no: reg, name, role: 'student' } };
  }

  // 3. Queue List: GET /queue
  if (cleanUrl === '/queue' && method === 'GET') {
    return store.stalls.map((s) => ({
      stall_id: s.stall_id || s._id,
      _id: s._id,
      name: s.name,
      location: s.location,
      is_open: s.is_open,
      queue_length: s.queue_length,
      estimated_wait_minutes: calcWait(s.queue_length, s.avg_service_time, s.active_counters),
      active_counters: s.active_counters,
      avg_service_time: s.avg_service_time,
    }));
  }

  // 4. Queue Current Student: GET /queue/me
  if (cleanUrl === '/queue/me' && method === 'GET') {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}
    const stall_id = user ? store.userQueues[user.reg_no] || null : null;
    return { stall_id };
  }

  // 5. Single Queue: GET /queue/:id
  const matchQueueId = cleanUrl.match(/^\/queue\/([a-zA-Z0-9_\-]+)$/);
  if (matchQueueId && method === 'GET') {
    const id = matchQueueId[1];
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    return {
      stall_id: s.stall_id || s._id,
      _id: s._id,
      name: s.name,
      location: s.location,
      is_open: s.is_open,
      queue_length: s.queue_length,
      estimated_wait_minutes: calcWait(s.queue_length, s.avg_service_time, s.active_counters),
      active_counters: s.active_counters,
      avg_service_time: s.avg_service_time,
    };
  }

  // 6. Single Queue History: GET /queue/:id/history
  const matchHistory = cleanUrl.match(/^\/queue\/([a-zA-Z0-9_\-]+)\/history$/);
  if (matchHistory && method === 'GET') {
    const id = matchHistory[1];
    return store.history.filter((h) => h.stall_id === id);
  }

  // 7. Student Check-in: POST /queue/:id/checkin
  const matchCheckin = cleanUrl.match(/^\/queue\/([a-zA-Z0-9_\-]+)\/checkin$/);
  if (matchCheckin && method === 'POST') {
    const id = matchCheckin[1];
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');

    s.queue_length += 1;
    if (user) {
      store.userQueues[user.reg_no] = id;
    }
    const newHist = {
      _id: 'h_' + Date.now(),
      stall_id: id,
      type: 'CHECK_IN',
      previous_length: s.queue_length - 1,
      new_length: s.queue_length,
      timestamp: new Date().toISOString(),
    };
    store.history.unshift(newHist);
    saveStore(store);

    const est = calcWait(s.queue_length, s.avg_service_time, s.active_counters);
    broadcastUpdate({ stall_id: id, queue_length: s.queue_length, estimated_wait_minutes: est });
    return { ok: true, queue_length: s.queue_length, estimated_wait_minutes: est };
  }

  // 8. Student Checkout: POST /queue/checkout
  if (cleanUrl === '/queue/checkout' && method === 'POST') {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}
    const id = user ? store.userQueues[user.reg_no] : null;
    if (id) {
      delete store.userQueues[user.reg_no];
      const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
      if (s && s.queue_length > 0) {
        s.queue_length -= 1;
        store.history.unshift({
          _id: 'h_' + Date.now(),
          stall_id: id,
          type: 'CHECK_OUT',
          previous_length: s.queue_length + 1,
          new_length: s.queue_length,
          timestamp: new Date().toISOString(),
        });
        saveStore(store);
        const est = calcWait(s.queue_length, s.avg_service_time, s.active_counters);
        broadcastUpdate({ stall_id: id, queue_length: s.queue_length, estimated_wait_minutes: est });
      }
    }
    return { ok: true };
  }

  // 9. Staff Counter Adjustment: PATCH /queue/:id
  if (matchQueueId && method === 'PATCH') {
    const id = matchQueueId[1];
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');

    const oldLen = s.queue_length;
    if (data.action === 'inc') s.queue_length += 1;
    else if (data.action === 'dec') s.queue_length = Math.max(0, s.queue_length - 1);
    else if (data.action === 'set') s.queue_length = Math.max(0, parseInt(data.value, 10) || 0);

    store.history.unshift({
      _id: 'h_' + Date.now(),
      stall_id: id,
      type: data.action === 'set' ? 'STAFF_SET' : data.action === 'inc' ? 'STAFF_INC' : 'STAFF_DEC',
      previous_length: oldLen,
      new_length: s.queue_length,
      timestamp: new Date().toISOString(),
    });
    saveStore(store);

    const est = calcWait(s.queue_length, s.avg_service_time, s.active_counters);
    broadcastUpdate({ stall_id: id, queue_length: s.queue_length, estimated_wait_minutes: est });
    return { ok: true, queue_length: s.queue_length, estimated_wait_minutes: est };
  }

  // 10. Stalls List: GET /stalls
  if (cleanUrl === '/stalls' && method === 'GET') {
    return store.stalls;
  }

  // 11. Stalls Create: POST /stalls
  if (cleanUrl === '/stalls' && method === 'POST') {
    const newStall = {
      _id: 'stall_' + Date.now(),
      stall_id: 'stall_' + Date.now(),
      name: data.name,
      location: data.location,
      avg_service_time: data.avg_service_time || 3,
      active_counters: 1,
      is_open: true,
      queue_length: 0,
      hours: { Monday: { open: '08:00', close: '20:00' } },
      menu: [{ item_id: 'item_' + Date.now(), name: 'Combo Meal', price: 100, available: true }],
    };
    store.stalls.push(newStall);
    saveStore(store);
    return newStall;
  }

  // 12. Single Stall Details: GET /stalls/:id
  const matchStallId = cleanUrl.match(/^\/stalls\/([a-zA-Z0-9_\-]+)$/);
  if (matchStallId && method === 'GET') {
    const id = matchStallId[1];
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    return s;
  }

  // 13. Update Stall Settings: PATCH /stalls/:id
  if (matchStallId && method === 'PATCH') {
    const id = matchStallId[1];
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    if (data.avg_service_time !== undefined) s.avg_service_time = data.avg_service_time;
    if (data.active_counters !== undefined) s.active_counters = data.active_counters;
    saveStore(store);
    const est = calcWait(s.queue_length, s.avg_service_time, s.active_counters);
    broadcastUpdate({ stall_id: id, queue_length: s.queue_length, estimated_wait_minutes: est });
    return s;
  }

  // 14. Delete Stall: DELETE /stalls/:id
  if (matchStallId && method === 'DELETE') {
    const id = matchStallId[1];
    store.stalls = store.stalls.filter((st) => st.stall_id !== id && st._id !== id);
    saveStore(store);
    return { ok: true };
  }

  // 15. Menu Item Add: POST /stalls/:id/menu
  const matchMenuAdd = cleanUrl.match(/^\/stalls\/([a-zA-Z0-9_\-]+)\/menu$/);
  if (matchMenuAdd && method === 'POST') {
    const id = matchMenuAdd[1];
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    const item = { item_id: 'item_' + Date.now(), name: data.name, price: data.price, available: true };
    s.menu.push(item);
    saveStore(store);
    return s;
  }

  // 16. Menu Item Update: PATCH /stalls/:id/menu/:itemId
  const matchMenuEdit = cleanUrl.match(/^\/stalls\/([a-zA-Z0-9_\-]+)\/menu\/([a-zA-Z0-9_\-]+)$/);
  if (matchMenuEdit && method === 'PATCH') {
    const [, id, itemId] = matchMenuEdit;
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    const it = s.menu.find((m) => m.item_id === itemId);
    if (it) {
      if (data.available !== undefined) it.available = data.available;
      if (data.price !== undefined) it.price = data.price;
      saveStore(store);
    }
    return s;
  }

  // 17. Menu Item Delete: DELETE /stalls/:id/menu/:itemId
  if (matchMenuEdit && method === 'DELETE') {
    const [, id, itemId] = matchMenuEdit;
    const s = store.stalls.find((st) => st.stall_id === id || st._id === id);
    if (!s) throw new Error('Stall not found');
    s.menu = s.menu.filter((m) => m.item_id !== itemId);
    saveStore(store);
    return s;
  }

  // 18. Analytics: /analytics/estimate-accuracy
  if (cleanUrl === '/analytics/estimate-accuracy') {
    return [
      { stall_id: 'stall_001', stall_name: 'Burger Point', check_ins: 284, configured_service_time: 3, avg_estimated_wait: 12.0, avg_actual_time: 13.2 },
      { stall_id: 'stall_002', stall_name: 'South Indian Corner', check_ins: 512, configured_service_time: 2, avg_estimated_wait: 6.0, avg_actual_time: 6.4 },
      { stall_id: 'stall_003', stall_name: 'Chinese Wok', check_ins: 320, configured_service_time: 4, avg_estimated_wait: 28.0, avg_actual_time: 25.8 },
      { stall_id: 'stall_004', stall_name: 'Chaat and Rolls', check_ins: 405, configured_service_time: 2, avg_estimated_wait: 10.0, avg_actual_time: 11.1 },
      { stall_id: 'stall_005', stall_name: 'Juice and Shakes', check_ins: 388, configured_service_time: 2, avg_estimated_wait: 6.0, avg_actual_time: 5.8 },
    ];
  }

  // 19. Analytics: /analytics/peak-hours
  if (cleanUrl === '/analytics/peak-hours') {
    return [
      { stall_id: 'stall_001', stall_name: 'Burger Point', peak_hour: 13, check_ins_in_that_hour: 86 },
      { stall_id: 'stall_002', stall_name: 'South Indian Corner', peak_hour: 8, check_ins_in_that_hour: 142 },
      { stall_id: 'stall_003', stall_name: 'Chinese Wok', peak_hour: 19, check_ins_in_that_hour: 98 },
      { stall_id: 'stall_004', stall_name: 'Chaat and Rolls', peak_hour: 17, check_ins_in_that_hour: 110 },
      { stall_id: 'stall_005', stall_name: 'Juice and Shakes', peak_hour: 15, check_ins_in_that_hour: 94 },
    ];
  }

  // 20. Analytics: /analytics/daily-footfall
  if (cleanUrl === '/analytics/daily-footfall') {
    return [
      { day: '2026-10-30', stall_id: 'stall_001', check_ins: 410 },
      { day: '2026-10-30', stall_id: 'stall_002', check_ins: 540 },
      { day: '2026-10-30', stall_id: 'stall_003', check_ins: 390 },
      { day: '2026-10-30', stall_id: 'stall_004', check_ins: 440 },
      { day: '2026-10-30', stall_id: 'stall_005', check_ins: 480 },
    ];
  }

  // 21. Analytics: /analytics/menu-stats
  if (cleanUrl === '/analytics/menu-stats') {
    return [
      { stall_id: 'stall_001', stall_name: 'Burger Point', total_items: 4, available_items: 3, avg_price: 70.0, max_price: 90 },
      { stall_id: 'stall_002', stall_name: 'South Indian Corner', total_items: 4, available_items: 4, avg_price: 40.0, max_price: 70 },
      { stall_id: 'stall_003', stall_name: 'Chinese Wok', total_items: 4, available_items: 3, avg_price: 80.0, max_price: 90 },
      { stall_id: 'stall_004', stall_name: 'Chaat and Rolls', total_items: 3, available_items: 3, avg_price: 56.7, max_price: 80 },
      { stall_id: 'stall_005', stall_name: 'Juice and Shakes', total_items: 3, available_items: 3, avg_price: 60.0, max_price: 80 },
    ];
  }

  // 22. Analytics: /analytics/staff-corrections
  if (cleanUrl === '/analytics/staff-corrections') {
    return [
      { stall_id: 'stall_001', stall_name: 'Burger Point', corrections: 8, avg_drift: 1.4, max_drift: 3 },
      { stall_id: 'stall_002', stall_name: 'South Indian Corner', corrections: 14, avg_drift: 1.8, max_drift: 4 },
      { stall_id: 'stall_003', stall_name: 'Chinese Wok', corrections: 6, avg_drift: 2.1, max_drift: 5 },
      { stall_id: 'stall_004', stall_name: 'Chaat and Rolls', corrections: 11, avg_drift: 1.1, max_drift: 3 },
      { stall_id: 'stall_005', stall_name: 'Juice and Shakes', corrections: 5, avg_drift: 1.0, max_drift: 2 },
    ];
  }

  throw new Error(`Endpoint not implemented in mock store: ${method} ${url}`);
}
