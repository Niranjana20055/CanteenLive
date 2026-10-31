export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognises an error handler by its 4 parameters - keep all four.
export function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That record already exists (duplicate value).' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
