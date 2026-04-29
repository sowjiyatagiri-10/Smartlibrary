const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'smart_library.db');

let db = null;
let dbReady = null;

/**
 * Check if database is ready
 */
function isDbReady() {
  return db !== null;
}

function loadDatabase(SQL) {
  if (fs.existsSync(DB_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log(`📂 Loaded existing SQLite database: ${DB_PATH}`);
      return;
    } catch (error) {
      console.warn(`⚠️  Failed to load database file, creating a fresh DB: ${error.message}`);
    }
  }

  db = new SQL.Database();
  console.log(`📂 Created new SQLite database: ${DB_PATH}`);
}

function ensureSchema() {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT DEFAULT NULL,
      role TEXT DEFAULT 'student' CHECK(role IN ('student','librarian')),
      is_setup INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE,
      category TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accession_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      accession_number TEXT UNIQUE NOT NULL,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      accession_id INTEGER,
      accession_number TEXT,
      borrow_date TEXT,
      due_date TEXT,
      return_date TEXT DEFAULT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','borrowed','overdue','returned','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (accession_id) REFERENCES accession_numbers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      related_record_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

function getTableCount(tableName) {
  const stmt = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`);
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  return row.count || 0;
}

function seedSampleDataIfNeeded() {
  if (getTableCount('users') === 0) {
    console.log('👤 Seeding default users...');

    const insertUser = db.prepare(
      'INSERT INTO users (register_id, name, email, password, role, is_setup) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const users = [
      ['AS', 'Sowji', 'as@srkr.ac.in', null, 'student', 0],
      ['AN', 'Sahasra', 'an@srkr.ac.in', null, 'student', 0],
      ['LIB01', 'Dr. Ramesh', 'lib01@srkr.ac.in', null, 'librarian', 0]
    ];

    for (const [registerId, name, email, password, role, isSetup] of users) {
      insertUser.bind([registerId, name, email, password, role, isSetup]);
      insertUser.step();
      insertUser.reset();
    }

    insertUser.free();
  }

  if (getTableCount('books') === 0) {
    console.log('📚 Seeding default books...');

    const insertBook = db.prepare(
      'INSERT INTO books (title, author, isbn, category, total_copies, available_copies, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const books = [
      ['The Pragmatic Programmer', 'David Thomas', 'ISBN-001', 'Technology', 3, 3, 'A classic guide to software craftsmanship and pragmatic development practices.'],
      ['Clean Code', 'Robert C. Martin', 'ISBN-002', 'Technology', 2, 2, 'A handbook of agile software craftsmanship focusing on writing clean, readable code.'],
      ['Introduction to Algorithms', 'Thomas H. Cormen', 'ISBN-003', 'Technology', 4, 4, 'Comprehensive textbook covering a broad range of algorithms in depth.'],
      ['Computer Networks', 'Andrew Tanenbaum', 'ISBN-004', 'Technology', 3, 3, 'The definitive guide to computer networking fundamentals and protocols.'],
      ['Operating System Concepts', 'Abraham Silberschatz', 'ISBN-005', 'Technology', 3, 3, 'Essential textbook on operating system design and implementation.']
    ];

    for (const [title, author, isbn, category, totalCopies, availableCopies, description] of books) {
      insertBook.bind([title, author, isbn, category, totalCopies, availableCopies, description]);
      insertBook.step();
      insertBook.reset();
    }

    insertBook.free();
  }

  // Seed accession numbers if empty
  if (getTableCount('accession_numbers') === 0 && getTableCount('books') > 0) {
    console.log('🏷️  Seeding accession numbers...');
    const booksResult = db.exec('SELECT id, total_copies FROM books');
    if (booksResult.length > 0) {
      const insertAcc = db.prepare(
        'INSERT INTO accession_numbers (book_id, accession_number, is_available) VALUES (?, ?, 1)'
      );
      let accCounter = 1;
      for (const row of booksResult[0].values) {
        const [bookId, totalCopies] = row;
        for (let c = 0; c < totalCopies; c++) {
          const accNum = `ACC-${String(accCounter).padStart(3, '0')}`;
          insertAcc.bind([bookId, accNum]);
          insertAcc.step();
          insertAcc.reset();
          accCounter++;
        }
      }
      insertAcc.free();
    }
  }
}

function persistDatabase() {
  if (!db) {
    return;
  }

  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (error) {
    console.warn(`⚠️  Unable to persist database to disk: ${error.message}`);
  }
}

/**
 * Initialize the SQLite database (loads from file or creates new).
 * Returns a promise that resolves when the DB is ready.
 */
function initDb() {
  if (db) {
    return Promise.resolve(db);
  }

  if (dbReady) {
    return dbReady;
  }

  console.log('DB PATH:', DB_PATH);
  console.log('DB EXISTS:', fs.existsSync(DB_PATH));

  dbReady = initSqlJs()
    .then((SQL) => {
      loadDatabase(SQL);
      ensureSchema();

      const test = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('TABLES:', test);

      let usersCount = 0;
      try {
        const usersCheck = db.exec('SELECT COUNT(*) as count FROM users');
        console.log('USER COUNT:', usersCheck);
        usersCount = usersCheck?.[0]?.values?.[0]?.[0] || 0;
      } catch (error) {
        console.warn('⚠️  users table check failed:', error.message);
      }

      seedSampleDataIfNeeded();
      persistDatabase();
      return db;
    })
    .catch((error) => {
      db = null;
      dbReady = null;
      console.error('❌ Failed to init DB:', error.message);
      throw error;
    });

  return dbReady;
}

/**
 * Save database to disk. Call after any write operation.
 */
function saveDb() {
  persistDatabase();
}

/**
 * Returns a pool-like object with a query() method that mimics mysql2/promise.
 * All route files can keep using:  const [rows] = await pool.query(sql, params)
 */
function getPool() {
  return {
    query: async (sql, params = []) => {
      await initDb();

      if (!db) {
        throw new Error('Database not ready after initialization. initDb() failed.');
      }

      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];

        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }

        stmt.free();
        return [rows];
      }

      db.run(sql, params);
      const changes = db.getRowsModified();
      saveDb();
      return [{ affectedRows: changes, insertId: 0 }];
    }
  };
}

/**
 * Create notification helper — callable from any route
 */
async function createNotification(userId, type, title, message, relatedRecordId = null) {
  const pool = getPool();
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, related_record_id) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, relatedRecordId]
  );
}

async function testConnection() {
  try {
    await initDb();
    db.exec('SELECT 1');
    console.log('✅ SQLite connected successfully');
    return true;
  } catch (err) {
    console.error('❌ SQLite connection failed:', err.message);
    return false;
  }
}

module.exports = { getPool, initDb, saveDb, testConnection, isDbReady, DB_PATH, createNotification };
