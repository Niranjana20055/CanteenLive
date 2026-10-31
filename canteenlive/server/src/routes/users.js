import { Router } from 'express';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, findByRegNo, updateUserName, deleteUser } from '../repos/usersRepo.js';

const router = Router();
router.use(requireAuth);

const adminOrSelf = (req, res, next) =>
  req.user.role === 'admin' || req.user.reg_no === req.params.regNo.toUpperCase()
    ? next()
    : res.status(403).json({ error: 'You can only access your own profile.' });

// READ all (admin)         GET /api/users?role=student
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const filter = req.query.role ? { role: String(req.query.role) } : {};
  res.json(await listUsers(filter));
}));

// READ one
router.get('/:regNo', adminOrSelf, asyncHandler(async (req, res) => {
  const user = await findByRegNo(req.params.regNo.toUpperCase());
  if (!user) throw new HttpError(404, 'User not found');
  const { password_hash, ...safe } = user; // never send the hash out
  res.json(safe);
}));

// UPDATE name
router.patch('/:regNo', adminOrSelf, asyncHandler(async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (name.length < 2) throw new HttpError(400, 'name is too short');
  const r = await updateUserName(req.params.regNo.toUpperCase(), name);
  if (r.matchedCount === 0) throw new HttpError(404, 'User not found');
  res.json({ reg_no: req.params.regNo.toUpperCase(), name });
}));

// DELETE (admin)
router.delete('/:regNo', requireRole('admin'), asyncHandler(async (req, res) => {
  if (!(await deleteUser(req.params.regNo.toUpperCase()))) throw new HttpError(404, 'User not found');
  res.json({ deleted: req.params.regNo.toUpperCase() });
}));

export default router;
