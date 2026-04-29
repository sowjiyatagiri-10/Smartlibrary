# 📚 SRKR Smart Library Management System

A complete full-stack Smart Library Management System built for **SRKR Engineering College**.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)

## ✨ Features

- **Two-Step Authentication** — Identity verification + password login
- **First-Time Password Setup** — New users set their own password with strength indicator
- **Dashboard** — Personal library stats, recent activity, quick actions
- **Book Catalog** — Browse, search, and filter books by category
- **Borrow System** — Borrow books with 14-day due dates
- **Return System** — Return books with status tracking
- **Overdue Detection** — Automatic overdue status updates
- **Email Reminders** — Daily automated reminders for due/overdue books via Gmail SMTP
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Glass Morphism UI** — Modern dark theme with frosted glass cards

## 🛠️ Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | HTML + CSS + Vanilla JavaScript |
| Backend   | Node.js + Express.js          |
| Database  | MySQL                         |
| Auth      | express-session + bcrypt      |
| Email     | Nodemailer (Gmail SMTP)       |
| Scheduler | node-cron                     |

## 🚀 Setup Instructions

### 1. Clone the Project

```bash
git clone <repo-url>
cd smart-library
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create MySQL Database

Open MySQL and run:

```sql
CREATE DATABASE smart_library;
```

### 4. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_library
SESSION_SECRET=srkr_library_secret_2024
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=3000
```

### 5. Seed the Database

This creates all tables and inserts sample data (11 users + 20 books):

```bash
npm run seed
```

### 6. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### 7. Open the Application

Navigate to: [https://web-production-d5180.up.railway.app](https://web-production-d5180.up.railway.app)

### 8. Login

Use any of the pre-seeded users:

| Register ID | Email          |
|-------------|----------------|
| AN          | an@srkr.ac.in  |
| AP          | ap@srkr.ac.in  |
| AQ          | aq@srkr.ac.in  |
| AR          | ar@srkr.ac.in  |
| AS          | as@srkr.ac.in  |
| AT          | at@srkr.ac.in  |
| AU          | au@srkr.ac.in  |
| AV          | av@srkr.ac.in  |
| AW          | aw@srkr.ac.in  |
| AX          | ax@srkr.ac.in  |
| AY          | ay@srkr.ac.in  |

### 9. First Login

On first login, you'll be prompted to set a password. After that, use your Register ID and password to log in.

### 10. Email Reminders Setup

To enable email reminders for due/overdue books:

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification**
3. Go to **App Passwords** → Generate a new app password
4. Copy the 16-character password into `EMAIL_PASS` in your `.env` file

Reminders run automatically every day at 9:00 AM. To test manually:

```
GET https://web-production-d5180.up.railway.app/api/test-reminder
```

## 📁 Project Structure

```
smart-library/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── db.js                  # MySQL connection pool
│   ├── seed.js                # Database seeder
│   ├── .env                   # Environment variables
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── books.js           # Book catalog routes
│   │   ├── borrow.js          # Borrow/return routes
│   │   └── dashboard.js       # Dashboard stats routes
│   ├── middleware/
│   │   └── authMiddleware.js  # Session auth middleware
│   └── scheduler/
│       └── reminderJob.js     # Daily email reminder cron job
├── frontend/
│   ├── index.html             # Login page (two-step)
│   ├── setup-password.html    # First-time password setup
│   ├── dashboard.html         # User dashboard
│   ├── catalog.html           # Book catalog with search/filter
│   ├── mybooks.html           # Borrowed books tracker
│   ├── css/
│   │   └── style.css          # Complete design system
│   └── js/
│       ├── auth.js            # Shared auth & utility functions
│       ├── setup-password.js  # Password setup logic
│       ├── dashboard.js       # Dashboard page logic
│       ├── catalog.js         # Catalog page logic
│       └── mybooks.js         # My books page logic
├── package.json
└── README.md
```

## 📝 API Endpoints

### Authentication
| Method | Endpoint                  | Description            |
|--------|---------------------------|------------------------|
| POST   | `/api/auth/verify-identity` | Verify register ID + email |
| POST   | `/api/auth/setup-password`  | Set password (first time) |
| POST   | `/api/auth/login`           | Login with credentials |
| GET    | `/api/auth/me`              | Get current session user |
| POST   | `/api/auth/logout`          | Logout                 |

### Books
| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/api/books`     | List all books (with filters)  |
| GET    | `/api/books/:id` | Get book details               |

### Borrow
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | `/api/borrow/request`       | Borrow a book        |
| GET    | `/api/borrow/mybooks`       | Get user's borrows   |
| POST   | `/api/borrow/return/:id`    | Return a book        |

### Dashboard
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | `/api/dashboard/stats`  | Get user stats       |
| GET    | `/api/dashboard/recent` | Get recent activity  |

### Testing
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/test-reminder`  | Trigger email reminders  |

## 📄 License

This project is built for educational purposes at SRKR Engineering College.
