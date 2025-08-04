import dotenv from 'dotenv';
import pool from './config/database.js';

dotenv.config();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log('Current time from DB:', result.rows[0].now);
    
    // Test if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log('Number of users in database:', userCount.rows[0].count);
    }
    
    await pool.end();
    console.log('✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabase();