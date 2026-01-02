import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../auth';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/creatornexus"
});

// Get project content overview
router.get('/project/:projectId/overview', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    // Get project details
    const projectQuery = `
      SELECT p.*, 
             COUNT(c.id) as total_content,
             COUNT(c.id) FILTER (WHERE c.content_status = 'draft') as draft_count,
             COUNT(c.id) FILTER (WHERE c.content_status = 'scheduled') as scheduled_count,
             COUNT(c.id) FILTER (WHERE c.content_status = 'published') as published_count,
             COUNT(c.id) FILTER (WHERE c.content_status = 'paused') as paused_count,
             COUNT(c.id) FILTER (WHERE c.content_status = 'deleted') as deleted_count,
             COALESCE(MAX(c.day_number), 0) as total_days
      FROM projects p
      LEFT JOIN content c ON p.id = c.project_id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY p.id
    `;

    const projectResult = await pool.query(projectQuery, [projectId, userId]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get content statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_content,
        COUNT(*) FILTER (WHERE content_status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE content_status = 'scheduled') as scheduled_count,
        COUNT(*) FILTER (WHERE content_status = 'published') as published_count,
        COUNT(*) FILTER (WHERE content_status = 'paused') as paused_count,
        COUNT(*) FILTER (WHERE content_status = 'deleted') as deleted_count,
        COALESCE(MAX(day_number), 0) as total_days,
        COALESCE(AVG((engagement_prediction->>'average')::DECIMAL), 0) as avg_engagement
      FROM content 
      WHERE project_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [projectId]);
    const stats = statsResult.rows[0];

      res.json({
      status: 'success',
      data: {
        project,
        stats
      }
      });
    } catch (error) {
    console.error('Error fetching project overview:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project overview'
      });
    }
  });

// Get all content for a project
router.get('/project/:projectId/content', authenticateToken, async (req, res) => {
    try {
      const { projectId } = req.params;
    const userId = req.user?.id;
    const { status, platform, search } = req.query;

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Build query with filters
    let query = `
      SELECT c.*, 
             p.name as project_name,
             p.platform as project_platform
      FROM content c
      JOIN projects p ON c.project_id = p.id
      WHERE c.project_id = $1 AND c.user_id = $2
    `;
    const queryParams = [projectId, userId];
    let paramCount = 2;

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND c.content_status = $${paramCount}`;
      queryParams.push(status);
    }

    if (platform && platform !== 'all') {
      paramCount++;
      query += ` AND c.platform = $${paramCount}`;
      queryParams.push(platform);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY c.day_number ASC, c.created_at ASC';

    const result = await pool.query(query, queryParams);

      res.json({
      status: 'success',
      data: result.rows
      });
    } catch (error) {
    console.error('Error fetching project content:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project content'
      });
    }
  });

// Get single content item
router.get('/content/:contentId', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?.id;

    const query = `
      SELECT c.*, p.name as project_name
      FROM content c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND c.user_id = $2
    `;

    const result = await pool.query(query, [contentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch content'
    });
  }
});

// Update content item
router.put('/content/:contentId', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Verify content ownership
    const contentCheck = await pool.query(
      'SELECT id FROM content WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentCheck.rows.length === 0) {
        return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'title', 'description', 'script', 'platform', 'content_type',
      'content_status', 'scheduled_time', 'hashtags', 'metadata',
      'engagement_prediction', 'target_audience', 'optimal_posting_time'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(contentId, userId);

    const query = `
      UPDATE content 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

      res.json({
      status: 'success',
      data: result.rows[0],
      message: 'Content updated successfully'
      });
    } catch (error) {
    console.error('Error updating content:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to update content'
      });
    }
  });

// Delete content item
router.delete('/content/:contentId', authenticateToken, async (req, res) => {
    try {
      const { contentId } = req.params;
    const userId = req.user?.id;

    // Verify content ownership
    const contentCheck = await pool.query(
      'SELECT id, content_status FROM content WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    const content = contentCheck.rows[0];

    // Check if content can be deleted
    if (content.content_status === 'published') {
        return res.status(400).json({
        status: 'error',
        message: 'Published content cannot be deleted'
      });
    }

    // Soft delete by updating status
    const result = await pool.query(
      'UPDATE content SET content_status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      ['deleted', contentId, userId]
    );

    res.json({
      status: 'success',
      data: result.rows[0],
      message: 'Content deleted successfully'
    });
    } catch (error) {
    console.error('Error deleting content:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to delete content'
      });
    }
  });

// Update content status
router.patch('/content/:contentId/status', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const validStatuses = ['draft', 'scheduled', 'published', 'paused', 'deleted'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    // Verify content ownership
    const contentCheck = await pool.query(
      'SELECT id, content_status FROM content WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    const currentContent = contentCheck.rows[0];

    // Validate status transition
    if (currentContent.content_status === 'published' && status !== 'published') {
        return res.status(400).json({
        status: 'error',
        message: 'Published content cannot be modified'
      });
    }

    const result = await pool.query(
      'UPDATE content SET content_status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, contentId, userId]
      );

      res.json({
      status: 'success',
      data: result.rows[0],
      message: `Content status updated to ${status}`
      });
    } catch (error) {
    console.error('Error updating content status:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to update content status'
      });
    }
  });

// Extend project with new content
router.post('/project/:projectId/extend', authenticateToken, async (req, res) => {
    try {
      const { projectId } = req.params;
    const { days } = req.body;
    const userId = req.user?.id;

    if (!days || days < 1 || days > 30) {
        return res.status(400).json({
        status: 'error',
        message: 'Days must be between 1 and 30'
      });
    }

    // Verify project ownership
    const projectCheck = await pool.query(
      'SELECT id, name, platform, description FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    const project = projectCheck.rows[0];

    // Get current max day number
    const maxDayResult = await pool.query(
      'SELECT COALESCE(MAX(day_number), 0) as max_day FROM content WHERE project_id = $1',
      [projectId]
    );
    const maxDay = maxDayResult.rows[0].max_day;

    // Generate new content for extended days
    const newContent = [];
    for (let i = 1; i <= days; i++) {
      const dayNumber = maxDay + i;
      const contentData = {
        user_id: userId,
        project_id: projectId,
        title: `${project.name} - Day ${dayNumber}`,
        description: `AI-generated content for day ${dayNumber} of ${project.name}`,
        platform: project.platform,
        content_type: 'post',
        content_status: 'draft',
        day_number: dayNumber,
        is_ai_generated: true,
        hashtags: ['ai-generated', 'day-' + dayNumber],
        engagement_prediction: {
          average: Math.floor(Math.random() * 30) + 50, // Random 50-80%
          platform: project.platform
        },
        target_audience: 'General',
        scheduled_time: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };

      const insertResult = await pool.query(
        `INSERT INTO content (
          user_id, project_id, title, description, platform, content_type,
          content_status, day_number, is_ai_generated, hashtags, 
          engagement_prediction, target_audience, scheduled_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [
          contentData.user_id, contentData.project_id, contentData.title,
          contentData.description, contentData.platform, contentData.content_type,
          contentData.content_status, contentData.day_number, contentData.is_ai_generated,
          contentData.hashtags, JSON.stringify(contentData.engagement_prediction),
          contentData.target_audience, contentData.scheduled_time,
          contentData.created_at, contentData.updated_at
        ]
      );

      newContent.push(insertResult.rows[0]);
    }

    // Record the extension
    await pool.query(
      'INSERT INTO project_extensions (project_id, original_duration, extended_duration, extension_days, extended_by) VALUES ($1, $2, $3, $4, $5)',
      [projectId, maxDay, maxDay + days, days, userId]
      );

      res.json({
      status: 'success',
      data: {
        newContent,
        extensionDays: days,
        totalDays: maxDay + days
      },
      message: `Project extended by ${days} days with ${newContent.length} new content items`
      });
    } catch (error) {
    console.error('Error extending project:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to extend project'
      });
    }
  });

// Regenerate content using AI
router.post('/content/:contentId/regenerate', authenticateToken, async (req, res) => {
    try {
      const { contentId } = req.params;
    const userId = req.user?.id;

    // Verify content ownership
    const contentCheck = await pool.query(
      'SELECT * FROM content WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    const content = contentCheck.rows[0];

    if (content.content_status === 'published') {
        return res.status(400).json({
        status: 'error',
        message: 'Published content cannot be regenerated'
      });
    }

    // Simulate AI regeneration (in real implementation, this would call AI service)
    const regeneratedData = {
      title: `${content.title} (Regenerated)`,
      description: `${content.description}\n\n[AI Regenerated Content - ${new Date().toISOString()}]`,
      hashtags: [...(content.hashtags || []), 'ai-regenerated'],
      engagement_prediction: {
        average: Math.floor(Math.random() * 30) + 50,
        platform: content.platform
      },
      updated_at: new Date()
    };

    const result = await pool.query(
      `UPDATE content 
       SET title = $1, description = $2, hashtags = $3, 
           engagement_prediction = $4, updated_at = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [
        regeneratedData.title, regeneratedData.description, regeneratedData.hashtags,
        JSON.stringify(regeneratedData.engagement_prediction), regeneratedData.updated_at,
        contentId, userId
      ]
    );

      res.json({
      status: 'success',
      data: result.rows[0],
      message: 'Content regenerated successfully'
      });
    } catch (error) {
    console.error('Error regenerating content:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to regenerate content'
      });
    }
  });

// Recreate content variation
router.post('/content/:contentId/recreate', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?.id;

    // Verify content ownership
    const contentCheck = await pool.query(
      'SELECT * FROM content WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found'
      });
    }

    const content = contentCheck.rows[0];

    if (content.content_status === 'published') {
        return res.status(400).json({
        status: 'error',
        message: 'Published content cannot be recreated'
      });
    }

    // Simulate AI recreation (in real implementation, this would call AI service)
    const recreatedData = {
      title: `${content.title} (Variation)`,
      description: `[AI Generated Variation]\n${content.description}\n\nThis is a new variation of the original content.`,
      hashtags: [...(content.hashtags || []), 'ai-variation'],
      engagement_prediction: {
        average: Math.floor(Math.random() * 30) + 50,
        platform: content.platform
      },
      updated_at: new Date()
    };

    const result = await pool.query(
      `UPDATE content 
       SET title = $1, description = $2, hashtags = $3, 
           engagement_prediction = $4, updated_at = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [
        recreatedData.title, recreatedData.description, recreatedData.hashtags,
        JSON.stringify(recreatedData.engagement_prediction), recreatedData.updated_at,
        contentId, userId
      ]
    );

      res.json({
      status: 'success',
      data: result.rows[0],
      message: 'Content recreated successfully'
      });
    } catch (error) {
    console.error('Error recreating content:', error);
      res.status(500).json({
      status: 'error',
      message: 'Failed to recreate content'
      });
    }
  });

// Register content management routes
export function registerContentManagementRoutes(app: express.Application) {
  app.use('/api/content-management', router);
}

export default router;