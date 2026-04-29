const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool, initDb, isDbReady } = require('../db');
const router = express.Router();

// POST /api/auth/verify-identity
router.post('/verify-identity', async (req, res) => {
  try {
    await initDb();

    console.log('BODY:', req.body);
    console.log('DB READY:', isDbReady());

    const { regId, register_id, email } = req.body;
    const finalRegId = (regId || register_id || '').trim().toUpperCase();
    const finalEmail = (email || '').trim().toLowerCase();
    console.log('🔎 verify-identity normalized:', { finalRegId, finalEmail });

    if (!finalRegId || !finalEmail) {
      return res.status(400).json({ found: false, message: 'Register ID and email are required.' });
    }

    let rows = [];
    try {
      const pool = getPool();
      const [queryRows] = await pool.query(
        'SELECT * FROM users WHERE register_id = ? AND email = ?',
        [finalRegId, finalEmail]
      );
      rows = queryRows;
    } catch (error) {
      console.error('REAL ERROR:', error);
      throw error;
    }

    console.log('📦 verify-identity query result count:', rows.length);

    if (rows.length === 0) {
      return res.json({ found: false });
    }

    const { password, ...user } = rows[0];
    return res.json({ found: true, user });

  } catch (error) {
    console.error('REAL ERROR:', error);
    return res.status(500).json({ found: false, message: error.message });
  }
});

// POST /api/auth/setup-password
router.post('/setup-password', async (req, res) => {
  try {
    const { register_id, password } = req.body;

    if (!register_id || !password) {
      return res.status(400).json({ success: false, message: 'Register ID and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = getPool();

    const [result] = await pool.query(
      'UPDATE users SET password = ?, is_setup = 1 WHERE register_id = ?',
      [hashedPassword, register_id.trim().toUpperCase()]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: 'Password set successfully.' });

  } catch (error) {
    console.error('Setup password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { register_id, password } = req.body;
    console.log(`🔐 Login attempt: register_id=${register_id}`);

    if (!register_id || !password) {
      return res.status(400).json({ success: false, message: 'Register ID and password are required.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE register_id = ?',
      [register_id.trim().toUpperCase()]
    );

    console.log(`✅ Query executed. Found ${rows.length} user(s) with register_id=${register_id}`);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (!user.password) {
      console.log(`⚠️  User ${register_id} has no password set`);
      return res.status(401).json({ success: false, message: 'Password not set. Please set up your password first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`❌ Password mismatch for user ${register_id}`);
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    req.session.user = {
      id: user.id,
      register_id: user.register_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    console.log(`✅ User ${register_id} logged in successfully (role: ${user.role})`);

    return res.json({
      success: true,
      user: {
        name: user.name,
        register_id: user.register_id,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ error: 'Not authenticated.' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

module.exports = router;
