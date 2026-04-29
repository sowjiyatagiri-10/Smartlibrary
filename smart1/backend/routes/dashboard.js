const express = require('express');
const { getPool } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats — Student dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    // Auto-update overdue
    await pool.query(
      "UPDATE borrow_records SET status = 'overdue' WHERE user_id = ? AND status = 'borrowed' AND due_date < DATE('now')",
      [userId]
    );

    const [borrowedResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE user_id = ? AND status IN ('borrowed', 'overdue')",
      [userId]
    );

    const [overdueResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE user_id = ? AND status = 'overdue'",
      [userId]
    );

    const [pendingResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE user_id = ? AND status = 'pending'",
      [userId]
    );

    const [totalBooksResult] = await pool.query(
      'SELECT COUNT(*) AS count FROM books'
    );

    const [availableResult] = await pool.query(
      'SELECT COALESCE(SUM(available_copies), 0) AS count FROM books'
    );

    return res.json({
      borrowed_count: borrowedResult[0].count,
      overdue_count: overdueResult[0].count,
      pending_count: pendingResult[0].count,
      total_books: totalBooksResult[0].count,
      available_books: availableResult[0].count,
      user_name: req.session.user.name
    });

  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/dashboard/recent — Student recent activity
router.get('/recent', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    const [rows] = await pool.query(`
      SELECT
        br.id AS record_id,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.accession_number,
        b.title,
        b.author,
        b.category,
        CASE
          WHEN br.status IN ('borrowed', 'overdue') AND br.due_date IS NOT NULL
            THEN CAST(JULIANDAY(br.due_date) - JULIANDAY(DATE('now')) AS INTEGER)
          ELSE NULL
        END AS days_remaining
      FROM borrow_records br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.id DESC
      LIMIT 5
    `, [userId]);

    return res.json(rows);

  } catch (error) {
    console.error('Dashboard recent error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ═══════════════════════════════════════════
// LIBRARIAN DASHBOARD ENDPOINTS
// ═══════════════════════════════════════════

// GET /api/dashboard/librarian-stats
router.get('/librarian-stats', roleMiddleware('librarian'), async (req, res) => {
  try {
    const pool = getPool();

    // Auto-update overdue
    await pool.query(
      "UPDATE borrow_records SET status = 'overdue' WHERE status = 'borrowed' AND due_date < DATE('now')"
    );

    const [studentsResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
    );

    const [pendingResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE status = 'pending'"
    );

    const [activeResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE status IN ('borrowed', 'overdue')"
    );

    const [overdueResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE status = 'overdue'"
    );

    const [totalBooksResult] = await pool.query(
      'SELECT COUNT(*) AS count FROM books'
    );

    const [returnedTodayResult] = await pool.query(
      "SELECT COUNT(*) AS count FROM borrow_records WHERE status = 'returned' AND return_date = DATE('now')"
    );

    return res.json({
      total_students: studentsResult[0].count,
      pending_requests: pendingResult[0].count,
      active_borrows: activeResult[0].count,
      overdue_count: overdueResult[0].count,
      total_books: totalBooksResult[0].count,
      returned_today: returnedTodayResult[0].count
    });

  } catch (error) {
    console.error('Librarian stats error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/dashboard/all-students — List all students with borrow counts
router.get('/all-students', roleMiddleware('librarian'), async (req, res) => {
  try {
    const pool = getPool();

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.register_id,
        u.name,
        u.email,
        COUNT(CASE WHEN br.status IN ('borrowed', 'overdue') THEN 1 END) AS active_borrows,
        COUNT(CASE WHEN br.status = 'overdue' THEN 1 END) AS overdue_count,
        COUNT(CASE WHEN br.status = 'pending' THEN 1 END) AS pending_count,
        COUNT(br.id) AS total_records
      FROM users u
      LEFT JOIN borrow_records br ON u.id = br.user_id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.name ASC
    `);

    return res.json(rows);

  } catch (error) {
    console.error('All students error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
