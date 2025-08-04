import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all activities (public ones, or user's own if authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query, params;
    
    if (req.user) {
      // Authenticated user: get public activities + their own activities
      query = `
        SELECT a.*, u.username as author 
        FROM activities a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.is_public = true OR a.user_id = $1 
        ORDER BY a.updated_at DESC
      `;
      params = [req.user.id];
    } else {
      // Unauthenticated: only public activities
      query = `
        SELECT a.*, u.username as author 
        FROM activities a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.is_public = true 
        ORDER BY a.updated_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get single activity by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    
    let query, params;
    
    if (req.user) {
      // Authenticated: can access public activities + their own
      query = `
        SELECT a.*, u.username as author 
        FROM activities a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.slug = $1 AND (a.is_public = true OR a.user_id = $2)
      `;
      params = [slug, req.user.id];
    } else {
      // Unauthenticated: only public activities
      query = `
        SELECT a.*, u.username as author 
        FROM activities a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.slug = $1 AND a.is_public = true
      `;
      params = [slug];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Create new activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, contentType, contentData, slug, isPublic } = req.body;

    if (!title || !contentData || !slug) {
      return res.status(400).json({ error: 'Title, content data, and slug are required' });
    }

    // Check if slug already exists
    const existingSlug = await pool.query('SELECT id FROM activities WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const result = await pool.query(
      `INSERT INTO activities (user_id, title, description, content_type, content_data, slug, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [req.user.id, title, description || null, contentType || 'html', contentData, slug, isPublic || false]
    );

    res.status(201).json({
      message: 'Activity created successfully',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, contentType, contentData, slug, isPublic } = req.body;

    // Check if activity exists and belongs to user
    const existingActivity = await pool.query(
      'SELECT * FROM activities WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingActivity.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    // Check if new slug conflicts with existing activities (excluding current one)
    if (slug && slug !== existingActivity.rows[0].slug) {
      const slugCheck = await pool.query(
        'SELECT id FROM activities WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE activities 
       SET title = $1, description = $2, content_type = $3, content_data = $4, 
           slug = $5, is_public = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 AND user_id = $8 
       RETURNING *`,
      [
        title || existingActivity.rows[0].title,
        description !== undefined ? description : existingActivity.rows[0].description,
        contentType || existingActivity.rows[0].content_type,
        contentData || existingActivity.rows[0].content_data,
        slug || existingActivity.rows[0].slug,
        isPublic !== undefined ? isPublic : existingActivity.rows[0].is_public,
        id,
        req.user.id
      ]
    );

    res.json({
      message: 'Activity updated successfully',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Get activity templates
router.get('/templates/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_templates ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export default router;