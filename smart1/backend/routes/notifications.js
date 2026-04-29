const express = require('express');
const { getPool } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// GET /api/notifications — Get user's notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Get notifications error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({ count: rows[0]?.count || 0 });
  } catch (error) {
    console.error('Unread count error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/notifications/:id/read — Mark one as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const notifId = req.params.id;
    const pool = getPool();

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/notifications/read-all — Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
