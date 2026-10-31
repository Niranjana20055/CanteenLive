import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { signToken } from '../middleware/auth.js';
import { createUser, findByRegNo } from '../repos/usersRepo.js';

const router = Router();
const publicUser = (u) => ({ reg_no: u.reg_no, name: u.name, role: u.role, stall_id: u.stall_id ?? null });

// POST /api/auth/register   { reg_no, name, password }   -> always creates a STUDENT
router.post('/register', asyncHandler(async (req, res) => {
  const reg_no = String(req.body?.reg_no ?? '').trim().toUpperCase();
  const name = String(req.body?.name ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!/^\d{2}[A-Z]{3}\d{4}$/.test(reg_no)) throw new HttpError(400, 'Register number must look like 23BCE0314');
  if (name.length < 2) throw new HttpError(400, 'Please enter your name');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (await findByRegNo(reg_no)) throw new HttpError(409, 'This register number is already registered');

  const user = await createUser({ reg_no, name, role: 'student', password_hash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/login   { reg_no, password }
router.post('/login', asyncHandler(async (req, res) => {
  const reg_no = String(req.body?.reg_no ?? '').trim().toUpperCase();
  const password = String(req.body?.password ?? '');
  const user = await findByRegNo(reg_no);
  // same message for "no such user" and "wrong password" so attackers learn nothing
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, 'Wrong register number or password');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

export default router;
