import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init.js';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import embedRoutes from './routes/embed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase().then((success) => {
  if (success) {
    console.log('✅ Database initialized successfully');
  } else {
    console.error('❌ Database initialization failed');
  }
}).catch((error) => {
  console.error('❌ Database initialization error:', error);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/embed', embedRoutes);

// SDK routes
app.get('/sdk/activities.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.sendFile(path.join(__dirname, 'public', 'sdk', 'activities.js'));
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { default: pool } = await import('./config/database.js');
    await pool.query('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      message: 'HTML Activities Designer API is running',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error.message,
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
});

// One-time SSO user migration
app.post('/api/admin/migrate-sso', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== process.env.SSO_CLIENT_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { default: pool } = await import('./config/database.js');

    // Get all local users that haven't been migrated yet
    const { rows: users } = await pool.query(
      'SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE central_user_id IS NULL'
    );

    if (users.length === 0) {
      return res.json({ message: 'No users to migrate', count: 0 });
    }

    // Send to central auth service
    const importRes = await fetch(`${process.env.AUTH_SERVICE_URL}/api/auth/proxy/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SSO_CLIENT_ID,
        client_secret: process.env.SSO_CLIENT_SECRET,
        users: users.map(u => ({
          username: u.username,
          email: u.email,
          password_hash: u.password_hash,
          first_name: u.first_name,
          last_name: u.last_name
        }))
      })
    });

    const data = await importRes.json();
    if (!importRes.ok) {
      return res.status(500).json({ error: 'Import failed', details: data });
    }

    // Update local users with central_user_id
    for (const result of data.results) {
      if (result.central_user_id) {
        await pool.query(
          'UPDATE users SET central_user_id = $1 WHERE username = $2',
          [result.central_user_id, result.local_username]
        );
      }
    }

    res.json({ message: 'Migration complete', results: data.results });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});