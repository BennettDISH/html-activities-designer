import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { centralRegister, centralLogin, exchangeCode } from '../config/sso.js';

const router = express.Router();

const SSO_ENABLED = !!process.env.AUTH_SERVICE_URL;

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Find or create a local user from central auth data
async function findOrCreateLocalUser(centralUser) {
  // Check if we already have this central user linked
  const existing = await pool.query(
    'SELECT * FROM users WHERE central_user_id = $1',
    [centralUser.central_user_id]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Check if there's a local user with matching email (pre-migration)
  const byEmail = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [centralUser.email]
  );

  if (byEmail.rows.length > 0) {
    // Link existing local user to central
    await pool.query(
      'UPDATE users SET central_user_id = $1 WHERE id = $2',
      [centralUser.central_user_id, byEmail.rows[0].id]
    );
    return byEmail.rows[0];
  }

  // Create new local user
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, central_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [centralUser.username, centralUser.email, '', centralUser.first_name || null, centralUser.last_name || null, centralUser.central_user_id]
  );

  return result.rows[0];
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (SSO_ENABLED) {
      // Register through central auth service
      const centralRes = await centralRegister({ username, email, password, first_name: firstName, last_name: lastName });

      if (!centralRes.ok) {
        return res.status(centralRes.status).json(centralRes.data);
      }

      const localUser = await findOrCreateLocalUser(centralRes.data);
      const token = generateToken(localUser);

      return res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: localUser.id,
          username: localUser.username,
          email: localUser.email,
          firstName: localUser.first_name,
          lastName: localUser.last_name
        }
      });
    }

    // Fallback: local auth (if SSO not configured)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, first_name, last_name`,
      [username, email, passwordHash, firstName || null, lastName || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email, firstName: user.first_name, lastName: user.last_name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (SSO_ENABLED) {
      // Login through central auth service
      const centralRes = await centralLogin({ email: username, password });

      if (!centralRes.ok) {
        return res.status(centralRes.status).json(centralRes.data);
      }

      const localUser = await findOrCreateLocalUser(centralRes.data);
      const token = generateToken(localUser);

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: localUser.id,
          username: localUser.username,
          email: localUser.email,
          firstName: localUser.first_name,
          lastName: localUser.last_name
        }
      });
    }

    // Fallback: local auth
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, firstName: user.first_name, lastName: user.last_name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// SSO callback — exchange authorization code for user info
router.post('/sso-callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const result = await exchangeCode(code);

    if (!result.ok) {
      return res.status(result.status).json(result.data);
    }

    const localUser = await findOrCreateLocalUser(result.data);
    const token = generateToken(localUser);

    res.json({
      message: 'SSO login successful',
      token,
      user: {
        id: localUser.id,
        username: localUser.username,
        email: localUser.email,
        firstName: localUser.first_name,
        lastName: localUser.last_name
      }
    });
  } catch (error) {
    console.error('SSO callback error:', error);
    res.status(500).json({ error: 'SSO login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING id, username, email, first_name, last_name`,
      [firstName || null, lastName || null, email, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;