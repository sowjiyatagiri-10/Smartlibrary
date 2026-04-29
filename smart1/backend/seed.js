const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'smart_library.db');

async function seed() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');

  try {
    console.log('🔧 Setting up SQLite database...');
    console.log('📋 Creating tables...');

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

    // ═══════════════════════════════════════════
    // Insert users
    // ═══════════════════════════════════════════
    console.log('👤 Inserting users...');
    const libPassword = await bcrypt.hash('Library@123', 10);
    const studentPassword = await bcrypt.hash('Student@123', 10);

    const insertUser = db.prepare(
      'INSERT INTO users (register_id, name, email, password, role, is_setup) VALUES (?, ?, ?, ?, ?, ?)'
    );

    const users = [
      ['LIB01', 'Dr. Ramesh', 'lib01@srkr.ac.in', libPassword, 'librarian', 1],
      ['AN', 'Sahasra', 'an@srkr.ac.in', studentPassword, 'student', 1],
      ['AP', 'Jahavnavi', 'ap@srkr.ac.in', studentPassword, 'student', 1],
      ['AQ', 'Meghana', 'aq@srkr.ac.in', studentPassword, 'student', 1],
      ['AR', 'Raghava', 'ar@srkr.ac.in', studentPassword, 'student', 1],
      ['AS', 'Sowji', 'as@srkr.ac.in', studentPassword, 'student', 1],
      ['AT', 'Kailash', 'at@srkr.ac.in', null, 'student', 0],
      ['AU', 'Santhosh', 'au@srkr.ac.in', null, 'student', 0],
      ['AV', 'Chetan', 'av@srkr.ac.in', null, 'student', 0],
      ['AW', 'Sathwik', 'aw@srkr.ac.in', null, 'student', 0],
      ['AX', 'Akshaya', 'ax@srkr.ac.in', null, 'student', 0],
      ['AY', 'Sanjith', 'ay@srkr.ac.in', null, 'student', 0]
    ];

    for (const [register_id, name, email, password, role, isSetup] of users) {
      insertUser.bind([register_id, name, email, password, role, isSetup]);
      insertUser.step();
      insertUser.reset();
    }
    insertUser.free();

    // ═══════════════════════════════════════════
    // Insert books
    // ═══════════════════════════════════════════
    console.log('📚 Inserting books...');
    const insertBook = db.prepare(
      'INSERT INTO books (title, author, isbn, category, total_copies, available_copies, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const books = [
      ['The Pragmatic Programmer', 'David Thomas', 'ISBN-001', 'Technology', 3, 2, 'A classic guide to software craftsmanship and pragmatic development practices.'],
      ['Clean Code', 'Robert C. Martin', 'ISBN-002', 'Technology', 2, 1, 'A handbook of agile software craftsmanship focusing on writing clean, readable code.'],
      ['Introduction to Algorithms', 'Thomas H. Cormen', 'ISBN-003', 'Technology', 4, 3, 'Comprehensive textbook covering a broad range of algorithms in depth.'],
      ['Computer Networks', 'Andrew Tanenbaum', 'ISBN-004', 'Technology', 3, 3, 'The definitive guide to computer networking fundamentals and protocols.'],
      ['Operating System Concepts', 'Abraham Silberschatz', 'ISBN-005', 'Technology', 3, 3, 'Essential textbook on operating system design and implementation.'],
      ['Higher Engineering Mathematics', 'B.S. Grewal', 'ISBN-006', 'Mathematics', 5, 5, 'Comprehensive mathematics reference for engineering students.'],
      ['Discrete Mathematics', 'Kenneth Rosen', 'ISBN-007', 'Mathematics', 4, 4, 'Introduction to discrete mathematical structures used in computer science.'],
      ['Linear Algebra', 'Gilbert Strang', 'ISBN-008', 'Mathematics', 2, 2, 'Clear and insightful introduction to linear algebra concepts.'],
      ['Calculus', 'James Stewart', 'ISBN-009', 'Mathematics', 3, 3, 'A widely used calculus textbook with comprehensive coverage.'],
      ['Probability and Statistics', 'Sheldon Ross', 'ISBN-010', 'Mathematics', 3, 3, 'Introduction to probability theory and statistical methods.'],
      ['A Brief History of Time', 'Stephen Hawking', 'ISBN-011', 'Science', 2, 2, 'A landmark exploration of cosmology for the general reader.'],
      ['The Selfish Gene', 'Richard Dawkins', 'ISBN-012', 'Science', 2, 2, 'Groundbreaking work on evolutionary biology and gene-centered evolution.'],
      ['Cosmos', 'Carl Sagan', 'ISBN-013', 'Science', 2, 1, 'A journey through the universe exploring the vastness of space.'],
      ['Physics of the Future', 'Michio Kaku', 'ISBN-014', 'Science', 2, 2, 'Predictions about how science will shape human destiny.'],
      ['The Double Helix', 'James Watson', 'ISBN-015', 'Science', 1, 1, 'Personal account of the discovery of DNA structure.'],
      ['Wings of Fire', 'A.P.J. Abdul Kalam', 'ISBN-016', 'Biography', 4, 4, 'Autobiography of India\'s missile man and former president.'],
      ['My Experiments with Truth', 'Mahatma Gandhi', 'ISBN-017', 'Biography', 3, 3, 'The autobiography of Mahatma Gandhi covering his life and philosophy.'],
      ['Long Walk to Freedom', 'Nelson Mandela', 'ISBN-018', 'Biography', 2, 2, 'Nelson Mandela\'s journey from prisoner to president.'],
      ['To Kill a Mockingbird', 'Harper Lee', 'ISBN-019', 'Fiction', 2, 2, 'A classic novel about racial injustice in the American South.'],
      ['The Alchemist', 'Paulo Coelho', 'ISBN-020', 'Fiction', 3, 3, 'A philosophical novel about following your dreams and personal legend.']
    ];

    for (const [title, author, isbn, category, total, available, description] of books) {
      insertBook.bind([title, author, isbn, category, total, available, description]);
      insertBook.step();
      insertBook.reset();
    }
    insertBook.free();

    // ═══════════════════════════════════════════
    // Insert accession numbers
    // ═══════════════════════════════════════════
    console.log('🏷️  Generating accession numbers...');
    const insertAcc = db.prepare(
      'INSERT INTO accession_numbers (book_id, accession_number, is_available) VALUES (?, ?, ?)'
    );

    let accCounter = 1;
    // book_id maps: 1=Pragmatic, 2=Clean Code, 3=Algorithms, ..., 13=Cosmos, ..., 16=Wings of Fire
    for (let bookId = 1; bookId <= books.length; bookId++) {
      const totalCopies = books[bookId - 1][4]; // total_copies
      for (let c = 0; c < totalCopies; c++) {
        const accNum = `ACC-${String(accCounter).padStart(3, '0')}`;
        // Mark as unavailable for borrowed copies (will set below)
        insertAcc.bind([bookId, accNum, 1]);
        insertAcc.step();
        insertAcc.reset();
        accCounter++;
      }
    }
    insertAcc.free();

    // ═══════════════════════════════════════════
    // Insert 5 realistic borrow records
    // ═══════════════════════════════════════════
    console.log('📝 Creating sample borrow records...');

    const today = new Date();
    const dateStr = (d) => d.toISOString().split('T')[0];

    // Helper to calculate dates
    const addDays = (base, days) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const insertBorrow = db.prepare(
      'INSERT INTO borrow_records (user_id, book_id, accession_id, accession_number, borrow_date, due_date, return_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // Record 1: AS (Sowji, id=6) borrowed Clean Code — Due in 2 days (due soon)
    const borrow1Date = addDays(today, -12);
    const due1Date = addDays(today, 2);
    insertBorrow.bind([6, 2, 4, 'ACC-004', dateStr(borrow1Date), dateStr(due1Date), null, 'borrowed', dateStr(borrow1Date)]);
    insertBorrow.step(); insertBorrow.reset();
    // Mark ACC-004 as unavailable
    db.run('UPDATE accession_numbers SET is_available = 0 WHERE accession_number = ?', ['ACC-004']);

    // Record 2: AN (Sahasra, id=2) borrowed Algorithms — Due in 10 days (active)
    const borrow2Date = addDays(today, -4);
    const due2Date = addDays(today, 10);
    insertBorrow.bind([2, 3, 6, 'ACC-006', dateStr(borrow2Date), dateStr(due2Date), null, 'borrowed', dateStr(borrow2Date)]);
    insertBorrow.step(); insertBorrow.reset();
    db.run('UPDATE accession_numbers SET is_available = 0 WHERE accession_number = ?', ['ACC-006']);

    // Record 3: AP (Jahavnavi, id=3) borrowed Cosmos — Overdue by 5 days
    const borrow3Date = addDays(today, -19);
    const due3Date = addDays(today, -5);
    insertBorrow.bind([3, 13, null, 'ACC-041', dateStr(borrow3Date), dateStr(due3Date), null, 'overdue', dateStr(borrow3Date)]);
    insertBorrow.step(); insertBorrow.reset();
    // Find accession for Cosmos and mark unavailable
    db.run("UPDATE accession_numbers SET is_available = 0 WHERE accession_number = 'ACC-041'");

    // Record 4: AQ (Meghana, id=4) — Pending request for Wings of Fire
    insertBorrow.bind([4, 16, null, 'ACC-048', null, null, null, 'pending', dateStr(today)]);
    insertBorrow.step(); insertBorrow.reset();

    // Record 5: AR (Raghava, id=5) — Returned Pragmatic Programmer 3 days ago
    const borrow5Date = addDays(today, -17);
    const due5Date = addDays(today, -3);
    const return5Date = addDays(today, -3);
    insertBorrow.bind([5, 1, 1, 'ACC-001', dateStr(borrow5Date), dateStr(due5Date), dateStr(return5Date), 'returned', dateStr(borrow5Date)]);
    insertBorrow.step(); insertBorrow.reset();

    insertBorrow.free();

    // ═══════════════════════════════════════════
    // Insert sample notifications
    // ═══════════════════════════════════════════
    console.log('🔔 Creating sample notifications...');

    const insertNotif = db.prepare(
      'INSERT INTO notifications (user_id, type, title, message, is_read, related_record_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    // Notification for Sowji — due soon warning
    insertNotif.bind([6, 'due_soon', '📚 Due Soon', '"Clean Code" is due in 2 days. Please return it on time.', 0, 1, dateStr(today)]);
    insertNotif.step(); insertNotif.reset();

    // Notification for Jahavnavi — overdue alert
    insertNotif.bind([3, 'overdue', '⚠️ Book Overdue', '"Cosmos" is overdue by 5 days. Please return it immediately.', 0, 3, dateStr(today)]);
    insertNotif.step(); insertNotif.reset();

    // Notification for Raghava — book returned confirmation
    insertNotif.bind([5, 'book_returned', 'Book Returned', '"The Pragmatic Programmer" has been returned successfully.', 1, 5, dateStr(return5Date)]);
    insertNotif.step(); insertNotif.reset();

    // Notification for librarian — new pending request
    insertNotif.bind([1, 'new_request', 'New Borrow Request', 'Meghana requested "Wings of Fire" (ACC-048)', 0, 4, dateStr(today)]);
    insertNotif.step(); insertNotif.reset();

    insertNotif.free();

    // ═══════════════════════════════════════════
    // Save to disk
    // ═══════════════════════════════════════════
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('   → 12 users (1 librarian + 11 students)');
    console.log('   → 20 books across 5 categories');
    console.log(`   → ${accCounter - 1} accession numbers generated`);
    console.log('   → 5 sample borrow records');
    console.log('   → 4 sample notifications');
    console.log(`   → Database file: ${DB_PATH}`);
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Librarian: LIB01 / Library@123');
    console.log('   Students:  AS, AN, AP, AQ, AR / Student@123');
    console.log('   (Other students need to set up passwords first)');
    console.log('');
    console.log('🚀 Run "npm run dev" to start the server');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

seed();
