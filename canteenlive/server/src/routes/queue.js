import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole, requireStallAccess } from '../middleware/auth.js';
import { getAllLive, getLive, checkIn, checkOut, myQueue, staffAdjust } from '../services/queueService.js';
import { recentEvents } from '../repos/eventsRepo.js';

const router = Router();

// Anyone can look (no login needed to compare stalls)
router.get('/', asyncHandler(async (req, res) => res.json(await getAllLive())));

// Which stall am I currently checked in at?   (must be defined BEFORE '/:stallId')
router.get('/me', requireAuth, asyncHandler(async (req, res) => res.json(await myQueue(req.user))));

// Student leaves the queue (we look up the stall from Redis, so no stall id needed)
router.post('/checkout', requireAuth, requireRole('student', 'admin'),
  asyncHandler(async (req, res) => res.json(await checkOut(req.user))));

router.get('/:stallId', asyncHandler(async (req, res) => res.json(await getLive(req.params.stallId))));

router.post('/:stallId/checkin', requireAuth, requireRole('student', 'admin'),
  asyncHandler(async (req, res) => res.json(await checkIn(req.user, req.params.stallId))));

// Staff: body = { "action": "inc" }  or  { "action": "dec" }  or  { "action": "set", "value": 13 }
router.patch('/:stallId', requireAuth, requireRole('staff', 'admin'), requireStallAccess('stallId'),
  asyncHandler(async (req, res) => {
    const { action, value } = req.body ?? {};
    res.json(await staffAdjust(req.user, req.params.stallId, action, value));
  }));

// Staff: last 10 events of this stall (reads MongoDB, uses the stall_time index)
router.get('/:stallId/history', requireAuth, requireRole('staff', 'admin'), requireStallAccess('stallId'),
  asyncHandler(async (req, res) => res.json(await recentEvents(req.params.stallId, 10))));

export default router;
