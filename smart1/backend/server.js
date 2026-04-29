require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');
const borrowRouter = require('./routes/borrow');
const dashboardRouter = require('./routes/dashboard');
const notificationsRouter = require('./routes/notifications');
const { startReminderScheduler, sendTestReminder } = require('./scheduler/reminderJob');
const { initDb, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
// Auto-detect production: Railway sets RAILWAY_* env vars and a dynamic PORT
const NODE_ENV = process.env.NODE_ENV || (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID ? 'production' : 'development');

// Trust Railway's reverse proxy so secure cookies work
app.set('trust proxy', 1);

console.log(`\n📋 Environment: ${NODE_ENV}`);
console.log(`⚙️  Port: ${PORT}\n`);

// ═══════════════════════════════════════════
// CORS
// ═══════════════════════════════════════════
const FRONTEND_URLS = [
  'https://smartlibrary-frontend.netlify.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (FRONTEND_URLS.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════
// Session Configuration
// ═══════════════════════════════════════════
app.use(session({
  secret: process.env.SESSION_SECRET || 'srkr_library_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none'
  }
}));

// ═══════════════════════════════════════════
// Serve frontend static files
// ═══════════════════════════════════════════
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ═══════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/borrow', borrowRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/notifications', notificationsRouter);

// ═══════════════════════════════════════════
// Health Check Endpoint
// ═══════════════════════════════════════════
app.get('/api/health', async (req, res) => {
  try {
    const dbOk = await testConnection();
    res.json({
      status: dbOk ? 'healthy' : 'degraded',
      database: dbOk ? 'connected' : 'disconnected',
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test reminder route
app.get('/api/test-reminder', async (req, res) => {
  try {
    await sendTestReminder();
    res.json({ success: true, message: 'Test reminder sent. Check console for details.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════
// API 404 Handler - Return JSON for unmatched API routes
// ═══════════════════════════════════════════
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ═══════════════════════════════════════════
// Catch-all: serve index.html for SPA-style routing
// ═══════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ═══════════════════════════════════════════
// Global Error Handler
// ═══════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ═══════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════
async function startServer() {
  try {
    await initDb();
    console.log('✅ Database initialized successfully');

    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    startReminderScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   📚 SRKR Smart Library Management System   ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║   ✅ Server running on port ${PORT}`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
      console.log('\n🚀 Server ready to accept requests!\n');
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

startServer();
