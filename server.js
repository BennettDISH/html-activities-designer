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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});