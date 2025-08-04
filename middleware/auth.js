import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const result = await pool.query(
        'SELECT id, username, email, first_name, last_name FROM users WHERE id = $1',
        [decoded.userId]
      );

      req.user = result.rows.length > 0 ? result.rows[0] : null;
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  });
}