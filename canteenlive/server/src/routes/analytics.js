import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { estimateAccuracy, peakHours, dailyFootfall, menuStats, staffCorrections } from '../repos/analyticsRepo.js';

const router = Router();
router.use(requireAuth, requireRole('staff', 'admin'));

router.get('/estimate-accuracy', asyncHandler(async (req, res) => res.json(await estimateAccuracy())));
router.get('/peak-hours', asyncHandler(async (req, res) => res.json(await peakHours())));
router.get('/daily-footfall', asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
  res.json(await dailyFootfall(days));
}));
router.get('/menu-stats', asyncHandler(async (req, res) => res.json(await menuStats())));
router.get('/staff-corrections', asyncHandler(async (req, res) => res.json(await staffCorrections())));

export default router;
