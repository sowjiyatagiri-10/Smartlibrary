const express = require('express');
const { getPool, createNotification } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// ═══════════════════════════════════════════
// STUDENT ENDPOINTS
// ═══════════════════════════════════════════

// POST /api/borrow/request — Student submits borrow request via accession number
router.post('/request', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { accession_number, book_id } = req.body;
    const pool = getPool();

    // Support both accession_number flow and legacy book_id flow
    let bookId = book_id;
    let accessionId = null;
    let accNum = accession_number ? accession_number.trim().toUpperCase() : null;

    if (accNum) {
      // Look up book via accession number
      const [accRows] = await pool.query(
        'SELECT an.id, an.book_id, an.is_available, b.title FROM accession_numbers an JOIN books b ON an.book_id = b.id WHERE an.accession_number = ?',
        [accNum]
      );

      if (accRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Accession number not found.' });
      }

      if (!accRows[0].is_available) {
        return res.status(400).json({ success: false, message: 'This copy is currently not available.' });
      }

      bookId = accRows[0].book_id;
      accessionId = accRows[0].id;
    }

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID or Accession Number is required.' });
    }

    // Check book exists
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const book = books[0];

    if (book.available_copies <= 0) {
      return res.status(400).json({ success: false, message: 'Book not available. All copies are currently borrowed.' });
    }

    // Check for existing pending or active borrow
    const [existing] = await pool.query(
      "SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND status IN ('pending', 'approved', 'borrowed', 'overdue')",
      [userId, bookId]
    );

    if (existing.length > 0) {
      const st = existing[0].status;
      if (st === 'pending') return res.status(400).json({ success: false, message: 'You already have a pending request for this book.' });
      return res.status(400).json({ success: false, message: 'You have already borrowed this book.' });
    }

    // If no accession number specified, pick the first available one
    if (!accessionId) {
      const [availAcc] = await pool.query(
        'SELECT id, accession_number FROM accession_numbers WHERE book_id = ? AND is_available = 1 LIMIT 1',
        [bookId]
      );
      if (availAcc.length > 0) {
        accessionId = availAcc[0].id;
        accNum = availAcc[0].accession_number;
      }
    }

    // Create pending borrow request
    await pool.query(
      "INSERT INTO borrow_records (user_id, book_id, accession_id, accession_number, status, created_at) VALUES (?, ?, ?, ?, 'pending', datetime('now'))",
      [userId, bookId, accessionId, accNum]
    );

    // Notify all librarians about new request
    const [librarians] = await pool.query("SELECT id FROM users WHERE role = 'librarian'");
    for (const lib of librarians) {
      await createNotification(
        lib.id,
        'new_request',
        'New Borrow Request',
        `${req.session.user.name} requested "${book.title}" (${accNum || 'No accession'})`,
        null
      );
    }

    return res.json({
      success: true,
      message: 'Borrow request submitted! Waiting for librarian approval.'
    });

  } catch (error) {
    console.error('Borrow request error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/borrow/mybooks — Student's borrow records (all statuses)
router.get('/mybooks', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const pool = getPool();

    // Auto-update overdue status
    await pool.query(
      "UPDATE borrow_records SET status = 'overdue' WHERE user_id = ? AND status = 'borrowed' AND due_date < DATE('now')",
      [userId]
    );

    const [rows] = await pool.query(`
      SELECT
        br.id AS record_id,
        br.book_id,
        br.accession_number,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.created_at AS request_date,
        b.title,
        b.author,
        b.category,
        b.isbn,
        CASE
          WHEN br.status IN ('borrowed', 'overdue') AND br.due_date IS NOT NULL
            THEN CAST(JULIANDAY(br.due_date) - JULIANDAY(DATE('now')) AS INTEGER)
          ELSE NULL
        END AS days_remaining
      FROM borrow_records br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.id DESC
    `, [userId]);

    return res.json(rows);

  } catch (error) {
    console.error('My books error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/borrow/return/:record_id — Student initiates return (still allowed)
router.post('/return/:record_id', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const recordId = req.params.record_id;
    const pool = getPool();

    const [records] = await pool.query(
      'SELECT * FROM borrow_records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Borrow record not found.' });
    }

    const record = records[0];

    if (record.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This book has already been returned.' });
    }

    if (record.status === 'pending') {
      return res.status(400).json({ success: false, message: 'This request is still pending.' });
    }

    const today = new Date().toISOString().split('T')[0];

    await pool.query(
      "UPDATE borrow_records SET return_date = ?, status = 'returned' WHERE id = ?",
      [today, recordId]
    );

    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [record.book_id]
    );

    // Mark accession as available again
    if (record.accession_id) {
      await pool.query(
        'UPDATE accession_numbers SET is_available = 1 WHERE id = ?',
        [record.accession_id]
      );
    }

    return res.json({ success: true, message: 'Book returned successfully!' });

  } catch (error) {
    console.error('Return error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════
// LIBRARIAN ENDPOINTS
// ═══════════════════════════════════════════

// GET /api/borrow/requests — All borrow requests (librarian only)
router.get('/requests', roleMiddleware('librarian'), async (req, res) => {
  try {
    const pool = getPool();
    const status = req.query.status || 'pending';

    let query = `
      SELECT
        br.id AS record_id,
        br.user_id,
        br.book_id,
        br.accession_number,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.created_at AS request_date,
        u.name AS student_name,
        u.register_id AS student_id,
        u.email AS student_email,
        b.title AS book_title,
        b.author AS book_author,
        b.category AS book_category,
        CASE
          WHEN br.status IN ('borrowed', 'overdue') AND br.due_date IS NOT NULL
            THEN CAST(JULIANDAY(br.due_date) - JULIANDAY(DATE('now')) AS INTEGER)
          ELSE NULL
        END AS days_remaining
      FROM borrow_records br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
    `;

    const params = [];
    if (status !== 'all') {
      query += ' WHERE br.status = ?';
      params.push(status);
    }

    query += ' ORDER BY br.id DESC';

    const [rows] = await pool.query(query, params);
    return res.json(rows);

  } catch (error) {
    console.error('Get requests error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/borrow/approve/:record_id — Approve a pending request
router.post('/approve/:record_id', roleMiddleware('librarian'), async (req, res) => {
  try {
    const recordId = req.params.record_id;
    const pool = getPool();

    const [records] = await pool.query(
      'SELECT * FROM borrow_records WHERE id = ? AND status = ?',
      [recordId, 'pending']
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found.' });
    }

    const record = records[0];
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);

    const borrowDate = today.toISOString().split('T')[0];
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Update record to borrowed
    await pool.query(
      "UPDATE borrow_records SET status = 'borrowed', borrow_date = ?, due_date = ? WHERE id = ?",
      [borrowDate, dueDateStr, recordId]
    );

    // Decrement available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [record.book_id]
    );

    // Mark accession as unavailable
    if (record.accession_id) {
      await pool.query(
        'UPDATE accession_numbers SET is_available = 0 WHERE id = ?',
        [record.accession_id]
      );
    }

    // Get book title for notification
    const [bookRows] = await pool.query('SELECT title FROM books WHERE id = ?', [record.book_id]);
    const bookTitle = bookRows.length > 0 ? bookRows[0].title : 'Unknown Book';

    // Notify student
    await createNotification(
      record.user_id,
      'request_approved',
      'Request Approved ✅',
      `Your request for "${bookTitle}" has been approved. Due date: ${dueDateStr}.`,
      recordId
    );

    return res.json({ success: true, message: 'Request approved successfully!' });

  } catch (error) {
    console.error('Approve error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/borrow/reject/:record_id — Reject a pending request
router.post('/reject/:record_id', roleMiddleware('librarian'), async (req, res) => {
  try {
    const recordId = req.params.record_id;
    const pool = getPool();

    const [records] = await pool.query(
      'SELECT * FROM borrow_records WHERE id = ? AND status = ?',
      [recordId, 'pending']
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found.' });
    }

    const record = records[0];

    await pool.query(
      "UPDATE borrow_records SET status = 'rejected' WHERE id = ?",
      [recordId]
    );

    // Get book title
    const [bookRows] = await pool.query('SELECT title FROM books WHERE id = ?', [record.book_id]);
    const bookTitle = bookRows.length > 0 ? bookRows[0].title : 'Unknown Book';

    // Notify student
    await createNotification(
      record.user_id,
      'request_rejected',
      'Request Rejected ❌',
      `Your request for "${bookTitle}" has been rejected. Please contact the librarian for details.`,
      recordId
    );

    return res.json({ success: true, message: 'Request rejected.' });

  } catch (error) {
    console.error('Reject error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/borrow/mark-returned/:record_id — Librarian marks book as returned
router.post('/mark-returned/:record_id', roleMiddleware('librarian'), async (req, res) => {
  try {
    const recordId = req.params.record_id;
    const pool = getPool();

    const [records] = await pool.query(
      "SELECT * FROM borrow_records WHERE id = ? AND status IN ('borrowed', 'overdue')",
      [recordId]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Active borrow record not found.' });
    }

    const record = records[0];
    const today = new Date().toISOString().split('T')[0];

    await pool.query(
      "UPDATE borrow_records SET return_date = ?, status = 'returned' WHERE id = ?",
      [today, recordId]
    );

    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [record.book_id]
    );

    if (record.accession_id) {
      await pool.query(
        'UPDATE accession_numbers SET is_available = 1 WHERE id = ?',
        [record.accession_id]
      );
    }

    // Get book title
    const [bookRows] = await pool.query('SELECT title FROM books WHERE id = ?', [record.book_id]);
    const bookTitle = bookRows.length > 0 ? bookRows[0].title : 'Unknown Book';

    // Notify student
    await createNotification(
      record.user_id,
      'book_returned',
      'Book Returned',
      `"${bookTitle}" has been marked as returned. Thank you!`,
      recordId
    );

    return res.json({ success: true, message: 'Book marked as returned.' });

  } catch (error) {
    console.error('Mark returned error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/borrow/all — All borrow records (librarian)
router.get('/all', roleMiddleware('librarian'), async (req, res) => {
  try {
    const pool = getPool();

    // Auto-update overdue
    await pool.query(
      "UPDATE borrow_records SET status = 'overdue' WHERE status = 'borrowed' AND due_date < DATE('now')"
    );

    const [rows] = await pool.query(`
      SELECT
        br.id AS record_id,
        br.user_id,
        br.book_id,
        br.accession_number,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        br.created_at AS request_date,
        u.name AS student_name,
        u.register_id AS student_id,
        b.title AS book_title,
        b.author AS book_author,
        CASE
          WHEN br.status IN ('borrowed', 'overdue') AND br.due_date IS NOT NULL
            THEN CAST(JULIANDAY(br.due_date) - JULIANDAY(DATE('now')) AS INTEGER)
          ELSE NULL
        END AS days_remaining
      FROM borrow_records br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
      ORDER BY br.id DESC
    `);

    return res.json(rows);

  } catch (error) {
    console.error('Get all borrows error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/borrow/student/:userId — Specific student's history (librarian)
router.get('/student/:userId', roleMiddleware('librarian'), async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.params.userId;

    const [rows] = await pool.query(`
      SELECT
        br.id AS record_id,
        br.accession_number,
        br.borrow_date,
        br.due_date,
        br.return_date,
        br.status,
        b.title AS book_title,
        b.author AS book_author,
        CASE
          WHEN br.status IN ('borrowed', 'overdue') AND br.due_date IS NOT NULL
            THEN CAST(JULIANDAY(br.due_date) - JULIANDAY(DATE('now')) AS INTEGER)
          ELSE NULL
        END AS days_remaining
      FROM borrow_records br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = ?
      ORDER BY br.id DESC
    `, [userId]);

    return res.json(rows);

  } catch (error) {
    console.error('Student history error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
