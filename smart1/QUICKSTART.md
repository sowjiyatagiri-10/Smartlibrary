# 📚 SRKR Smart Library Management System

A modern, full-stack library management system for SRKR Engineering College.

## ✨ Features

- **User Authentication**: Secure login with password management
- **Book Catalog**: Browse all library books with detailed information
- **Book Borrowing**: Borrow and track books with due dates
- **Overdues Tracking**: Get notified of overdue books
- **Dashboard**: Overview of borrowing activity
- **Responsive Design**: Works on desktop and mobile

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v16 or higher
- npm (comes with Node.js)

### Installation

1. **Clone or download the project**
```bash
cd smart1
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize the database**
```bash
npm run seed
```

This creates sample data:
- 11 test users (AN through AY)
- 20 books across 5 categories

4. **Start the server**
```bash
npm run dev
```

5. **Open in browser**
```
https://web-production-d5180.up.railway.app
```

## 🔐 Test Login Credentials

| Register ID | Email | Password |
|---|---|---|
| AN | an@srkr.ac.in | Set on first login |
| AP | ap@srkr.ac.in | Set on first login |
| AQ | aq@srkr.ac.in | Set on first login |

**First time login flow:**
1. Enter Register ID and Email
2. You'll be redirected to set a password (min 8 characters)
3. Password is saved securely
4. Next time, just login with password

## 🌐 Deploy to Internet

### For Quick Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Deploying backend to Render (free tier)
- Deploying frontend to Vercel (free tier)
- Complete step-by-step instructions
- Troubleshooting guide

### TL;DR
1. Push code to GitHub
2. Connect to Render (backend)
3. Connect to Vercel (frontend)
4. Update environment variables
5. Done! Share your URL with others

**Deployed URLs look like:**
- Frontend: `https://srkr-smart-library.vercel.app`
- Backend: `https://srkr-smart-library-api.onrender.com`

## 📁 Project Structure

```
smart1/
├── backend/
│   ├── .env                 # Environment variables
│   ├── server.js            # Express server
│   ├── db.js                # SQLite database
│   ├── seed.js              # Sample data
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # API routes (auth, books, etc)
│   └── scheduler/           # Scheduled tasks
├── frontend/
│   ├── index.html           # Login page
│   ├── dashboard.html       # Main dashboard
│   ├── catalog.html         # Book catalog
│   ├── mybooks.html         # Borrowed books
│   ├── config.js            # API configuration
│   ├── css/                 # Stylesheets
│   └── js/                  # Frontend JavaScript
└── DEPLOYMENT.md            # Deployment guide
```

## 🛠️ Technology Stack

**Backend**
- Node.js with Express.js
- SQLite database with sql.js
- bcrypt for password hashing
- express-session for authentication
- node-cron for scheduled tasks

**Frontend**
- Vanilla HTML5/CSS3/JavaScript
- Responsive design with CSS Grid/Flexbox
- Fetch API for HTTP requests
- LocalStorage for client state

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your_secret_key
LOG_LEVEL=debug
```

### Frontend (.env)
```env
VITE_API_URL=https://web-production-d5180.up.railway.app
```

See `.env.example` files for all options.

## 🔑 Key APIs

| Method | Endpoint | Description |
|--------|----------|---|
| POST | /api/auth/verify-identity | Check user exists |
| POST | /api/auth/setup-password | Set initial password |
| POST | /api/auth/login | Authenticate user |
| POST | /api/auth/logout | End session |
| GET | /api/health | Check server status |

## 🐛 Troubleshooting

### "Database not found" error
```bash
npm run seed
```

### "Cannot connect to server"
- Check if backend is running: `npm run dev`
- Verify port 3000 is not in use
- Check firewall settings

### Port 3000 already in use
```bash
# Windows - Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### CORS errors on API calls
- Ensure backend is running
- Check `FRONTEND_URL` in backend `.env`
- Verify both are on same domain or CORS is configured

## 📊 Admin/Database Management

### Access database
Database is stored at `backend/smart_library.db`

### Reseed database
```bash
rm backend/smart_library.db
npm run seed
```

### View/Edit data
Use tools like:
- [SQLiteOnline](https://sqliteonline.com/)
- [DB Browser for SQLite](https://sqlitebrowser.org/)

## 🚀 Production Deployment

Before deploying:
1. Generate strong `SESSION_SECRET`
2. Set `NODE_ENV=production`
3. Update `FRONTEND_URL` to production domain
4. Enable HTTPS (automatic on Render/Vercel)
5. Consider migrating to MongoDB Atlas for scalability

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

## 🔒 Security Features

✅ Password hashing with bcrypt
✅ Secure session management
✅ CORS protection
✅ HTTPS support
✅ HTTPOnly cookies
✅ Input validation
✅ Error handling

## 💡 Tips for Contributors

1. **Local Development**
   ```bash
   npm install
   npm run seed
   npm run dev
   ```

2. **Before committing**
   - Test login flow
   - Check browser console for errors (F12)
   - Review `.gitignore` - don't commit `.env` files

3. **Making changes**
   - Backend: Update `backend/` files and restart server
   - Frontend: Changes auto-reload in browser

## 📞 Support & Issues

1. Check browser console (F12 → Console tab)
2. Check backend logs in terminal
3. Review [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting
4. Check if database is initialized: `npm run seed`

## 📄 License

This project is for SRKR Engineering College.

## 👨‍💻 Contributors

- Developed for SRKR Smart Library Management System

---

**Ready to deploy? → Read [DEPLOYMENT.md](DEPLOYMENT.md)**

**Need help? → Check troubleshooting section above**
