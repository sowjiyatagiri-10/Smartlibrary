const express = require('express');
const { getPool } = require('../db');
const router = express.Router();

// GET /api/books
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const pool = getPool();
    let query = 'SELECT * FROM books';
    const params = [];
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(title LIKE ? OR author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id ASC';

    const [rows] = await pool.query(query, params);
    return res.json(rows);

  } catch (error) {
    console.error('Get books error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    return res.json(rows[0]);

  } catch (error) {
    console.error('Get book error:', error.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
