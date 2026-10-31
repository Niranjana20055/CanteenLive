import { Router } from 'express';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { requireAuth, requireRole, requireStallAccess } from '../middleware/auth.js';
import { redis, keys } from '../db/redis.js';
import {
  getStall, listStalls, searchStalls, createStall, updateStall, deleteStall,
  addMenuItem, updateMenuItem, deleteMenuItem,
} from '../repos/stallsRepo.js';

const router = Router();
const staffOrAdmin = [requireAuth, requireStallAccess('id')];

const validServiceTime = (v) => typeof v === 'number' && v > 0 && v <= 60;
const validCounters = (v) => Number.isInteger(v) && v >= 1 && v <= 10;
const validPrice = (v) => typeof v === 'number' && v >= 0 && v <= 10000;

/* ---- READ (public) ---- */
router.get('/', asyncHandler(async (req, res) => res.json(await listStalls())));

// GET /api/stalls/search?q=burger      (define BEFORE '/:id' or "search" would be treated as an id)
router.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) throw new HttpError(400, 'Use ?q=something');
  res.json(await searchStalls(q));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const stall = await getStall(req.params.id);
  if (!stall) throw new HttpError(404, 'Stall not found');
  res.json(stall);
}));

/* ---- CREATE (admin only) ---- */
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, location, avg_service_time, active_counters = 1 } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) throw new HttpError(400, 'name is required');
  if (typeof location !== 'string' || !location.trim()) throw new HttpError(400, 'location is required');
  if (!validServiceTime(avg_service_time)) throw new HttpError(400, 'avg_service_time must be a number between 0 and 60 (minutes)');
  if (!validCounters(active_counters)) throw new HttpError(400, 'active_counters must be a whole number 1-10');
  res.status(201).json(await createStall({ ...req.body, name: name.trim(), location: location.trim(), active_counters }));
}));

/* ---- UPDATE (that stall's staff, or admin) ---- */
router.patch('/:id', ...staffOrAdmin, asyncHandler(async (req, res) => {
  const { avg_service_time, active_counters } = req.body ?? {};
  if (avg_service_time !== undefined && !validServiceTime(avg_service_time)) throw new HttpError(400, 'avg_service_time must be 0-60');
  if (active_counters !== undefined && !validCounters(active_counters)) throw new HttpError(400, 'active_counters must be 1-10');
  await updateStall(req.params.id, req.body ?? {});
  res.json(await getStall(req.params.id));
}));

/* ---- DELETE (admin only). Also wipes that stall's live queue in Redis ---- */
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const removed = await deleteStall(req.params.id);
  if (!removed) throw new HttpError(404, 'Stall not found');
  await redis.del(keys.queue(req.params.id), keys.active(req.params.id));
  res.json({ deleted: req.params.id });
}));

/* ---- MENU (embedded array inside the stall document) ---- */
router.post('/:id/menu', ...staffOrAdmin, asyncHandler(async (req, res) => {
  const { name, price } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'name is required');
  if (!validPrice(price)) throw new HttpError(400, 'price must be a number');
  res.status(201).json(await addMenuItem(req.params.id, { name: name.trim(), price }));
}));

router.patch('/:id/menu/:itemId', ...staffOrAdmin, asyncHandler(async (req, res) => {
  const { available, price, name } = req.body ?? {};
  if (available !== undefined && typeof available !== 'boolean') throw new HttpError(400, 'available must be true or false');
  if (price !== undefined && !validPrice(price)) throw new HttpError(400, 'price must be a number');
  await updateMenuItem(req.params.id, req.params.itemId, { available, price, name });
  res.json(await getStall(req.params.id));
}));

router.delete('/:id/menu/:itemId', ...staffOrAdmin, asyncHandler(async (req, res) => {
  await deleteMenuItem(req.params.id, req.params.itemId);
  res.json(await getStall(req.params.id));
}));

export default router;
