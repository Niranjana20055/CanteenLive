import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const signToken = (user) =>
  jwt.sign(
    { reg_no: user.reg_no, name: user.name, role: user.role, stall_id: user.stall_id ?? null },
    config.jwtSecret,
    { expiresIn: '12h' }
  );

// 1) Must be logged in.  Puts the decoded token on req.user
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first (missing token).' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

// 2) Must have one of the listed roles: requireRole('staff', 'admin')
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: `Allowed roles: ${roles.join(', ')}` });

// 3) Admin, or the staff member who owns THIS stall (the stall id comes from the URL)
export const requireStallAccess = (param = 'id') => (req, res, next) => {
  const stallId = req.params[param];
  const ok =
    req.user?.role === 'admin' || (req.user?.role === 'staff' && req.user.stall_id === stallId);
  ok ? next() : res.status(403).json({ error: 'You can only manage your own stall.' });
};
