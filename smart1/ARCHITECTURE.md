# 🏗️ Architecture & Setup Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERNET / CLOUD                             │
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │  VERCEL (Frontend)   │         │  RENDER (Backend)    │      │
│  │  ─────────────────   │         │  ──────────────────  │      │
│  │ • Static HTML/CSS/JS │◄───────►│ • Node.js/Express   │      │
│  │ • Responsive design  │ HTTPS   │ • SQLite Database   │      │
│  │ • CDN + Caching      │         │ • Auto-scaling      │      │
│  └──────────────────────┘         └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘

            🌍 Anyone can access from anywhere! 🌍

        ┌────────────────────────────────────────┐
        │   YOUR LOCAL NETWORK (WiFi/LAN)        │
        │                                        │
        │  ┌────────────────┐  ┌────────────┐   │
        │  │ Your PC        │  │Other Device│   │
        │  │ web-production-d5180.up.railway.app │◄►│192.168.1.x │   │
        │  └────────────────┘  └────────────┘   │
        │         ▲                              │
        │         │                              │
        │   http://YOUR-IP:3000                  │
        │                                        │
        └────────────────────────────────────────┘

         💻 Share within office/home! 💻

   ┌──────────────────────────────────────────┐
   │   SINGLE MACHINE (Development)           │
   │   ─────────────────────────────          │
   │  npm run dev                              │
   │  ↓                                        │
  │  Backend: https://web-production-d5180.up.railway.app          │
   │  Frontend: Loads config.js → Connects   │
   │  Database: smart_library.db              │
   │                                          │
   │  ✅ Perfect for testing                  │
   │  ✅ Easy to debug                        │
   │  ⚠️ Only local access                    │
   └──────────────────────────────────────────┘
```

---

## How the Connection Works

### Local Development (npm run dev)

```
User Browser                Backend Server           Database
     │                           │                       │
    │  1. Open https://web-production-d5180.up.railway.app   │                       │
     ├──────────────────────────►│                       │
     │                           │ 2. Check DB ready     │
     │                           ├──────────────────────►│
     │                           │◄──────────────────────┤
     │                           │ 3. Load index.html    │
     │◄──────────────────────────┤                       │
     │                           │                       │
     │ 4. config.js loaded       │                       │
     │    (sets API_BASE = '')   │                       │
     │                           │                       │
     │ 5. Click "Continue"       │                       │
     ├─ /api/auth/verify-identity─►                      │
     │                           │ 6. Query users        │
     │                           ├──────────────────────►│
     │                           │◄──────────────────────┤
     │◄────── JSON response ─────┤                       │
     │                           │                       │
```

### Local Network (Share with IP)

```
Device A (Your PC)          Backend Server         Device B (Phone)
192.168.1.100              192.168.1.100          192.168.1.105
     │                           │                      │
     │ npm run dev               │                      │
     ├──────────────────────────►│                      │
     │ Server listening on       │                      │
     │ 0.0.0.0:3000 ◄───────────►│◄─ Can connect now!  │
     │ (all interfaces)          │                      │
     │                           │                      │
```

### Cloud Deployment (Internet)

```
Global Users               Vercel (Frontend)       Render (Backend)
     │                           │                       │
     │ Access Vercel URL         │                       │
     ├──────────────────────────►│                       │
     │                           │ loads config.js      │
     │                           │ (API_BASE = Render)  │
     │                           │                      │
     │                           │ Fetch from API       │
     │                           ├─────────────────────►│
     │                           │                      │
     │◄────────HTML/JSON─────────┴──────────────────────┤
     │                                                   │
```

---

## Environment Variables Flow

### Backend Configuration

```
.env File (backend/)
├─ PORT=3000
├─ NODE_ENV=development
├─ FRONTEND_URL=http://localhost:5173
├─ SESSION_SECRET=random_key
└─ LOG_LEVEL=debug
        │
        ▼
  server.js reads .env
        │
        ├─ Creates Express app
        ├─ Sets up CORS with FRONTEND_URL
        ├─ Configures session
        ├─ Initializes database
        ├─ Starts listening on 0.0.0.0:PORT
        │
        ▼
  Server Ready! 🚀
```

### Frontend Configuration

```
config.js (frontend/)
├─ Detects localhost? (yes)
  │  └─ API_BASE = https://web-production-d5180.up.railway.app
│
├─ OR Production? (no)
│  └─ API_BASE = relative URLs
│
        │
        ▼
  index.html loads config.js first
        │
        ├─ API calls use correct URL
        ├─ verifyIdentity() → POST /api/auth/verify-identity
        ├─ doLogin() → POST /api/auth/login
        │
        ▼
  Login Works! ✅
```

---

## Database Connection

### Current Setup (SQLite)

```
server.js
    │
    ▼
db.js (initDb)
    │
    ├─ Check if smart_library.db exists
    │
    ├─ YES: Load from file
    │  └─ Uses sql.js (in-memory with file persistence)
    │
    ├─ NO: Create new database
    │  └─ seed.js fills with test data
    │
    ▼
Database Ready
    │
    ├─ Users table (11 test users)
    ├─ Books table (20 sample books)
    ├─ Borrow records table
    │
    ▼
Routes can query:
    ├─ /api/auth/verify-identity ◄─ Queries users table
    ├─ /api/auth/login ◄─ Queries users table
    ├─ /api/books ◄─ Queries books table
    ├─ /api/borrow ◄─ Queries borrow_records table
    │
    ▼
Query Results → JSON Response
```

---

## Request/Response Flow

### Login Request

```
Frontend (HTML/JS)
    │
    │ 1. User enters credentials
    │ 2. Clicks "Continue"
    │ 3. JavaScript: fetch('/api/auth/verify-identity')
    │
    ├─ Sets headers: { 'Content-Type': 'application/json' }
    ├─ Body: { register_id: "AN", email: "an@srkr.ac.in" }
    │
    ▼
Backend (Express Router)
    │
    ├─ CORS middleware: Check origin ✓
    ├─ Auth middleware: Check DB ready ✓
    ├─ Route handler: /api/auth/verify-identity
    │
    ├─ 1. Validate inputs
    ├─ 2. Query database
    ├─ 3. Format response
    │
    ▼ Response
    {
      "found": true,
      "is_setup": false,
      "name": "Sahasra",
      "register_id": "AN"
    }
    
    ▼
Frontend
    │
    ├─ Parse JSON
    ├─ Check response.found
    ├─ If !is_setup: Redirect to setup-password.html
    ├─ Else: Show password form
    │
    ▼
User can now set password! ✅
```

---

## File Dependencies

```
index.html
    │
    ├─ <link> css/style.css
    ├─ <script> config.js ◄─── Sets API_BASE
    │
    └─ <script> (inline functions)
        ├─ verifyIdentity()
        │  └─ fetch(`${API_BASE}/api/auth/verify-identity`)
        │
        ├─ doLogin()
        │  └─ fetch(`${API_BASE}/api/auth/login`)
        │
        └─ Calls API endpoints on backend


server.js
    │
    ├─ Requires: ./db.js
    │  └─ Initializes SQLite database
    │
    ├─ Requires: ./routes/auth.js
    │  └─ Handles: /api/auth/* endpoints
    │
    ├─ Requires: ./.env (via dotenv)
    │  └─ Loads: PORT, NODE_ENV, FRONTEND_URL, etc.
    │
    └─ Listens on 0.0.0.0:PORT
       └─ Accepts connections from any IP
```

---

## Security Architecture

```
Frontend (Browser)
    │
    ├─ No sensitive data stored
    ├─ Passwords sent in HTTPS only (production)
    ├─ Session cookies: HTTPOnly + Secure
    │
    ▼
CORS Layer
    │
    └─ Only allows specified origins
       └─ Prevents cross-site requests


Backend (Node.js)
    │
    ├─ Session middleware
    │  └─ Validates user identity
    │
    ├─ Input validation
    │  └─ Checks register_id, email, password
    │
    ├─ Database queries
    │  └─ Parameterized to prevent SQL injection
    │
    ├─ Password hashing
    │  └─ bcrypt (10 rounds) not plain text
    │
    └─ Error handling
       └─ No sensitive info in responses


Database (SQLite)
    │
    └─ passwords column: hashed values only
       └─ Original passwords never stored
```

---

## Deployment Architecture

### Before (Localhost Only)
```
Your Computer
    │
    └─ npm run dev
      └─ Server: https://web-production-d5180.up.railway.app ✓
       └─ Other computers: ✗ Can't access
       └─ Internet: ✗ Can't reach
```

### After (Production Ready)
```
Cloud Providers
    │
    ├─ Vercel (Frontend)
    │  └─ https://srkr-smart-library.vercel.app
    │  └─ CDN + Caching
    │  └─ Auto-deploys from GitHub
    │
    ├─ Render (Backend)
    │  └─ https://srkr-smart-library-api.onrender.com
    │  └─ Auto-scaling
    │  └─ Auto-deploys from GitHub
    │
    └─ Both connected via CORS
       └─ Frontend → Backend API
       └─ Anyone on internet can use!
```

---

## Configuration by Environment

### Development (npm run dev)
```
backend/.env:
  PORT=3000
  NODE_ENV=development
  FRONTEND_URL=http://localhost:5173
  LOG_LEVEL=debug

frontend/config.js:
  Detects localhost
  API_BASE = 'https://web-production-d5180.up.railway.app'
  
Result:
  ✓ Can develop locally
  ✓ See console logs
  ✓ Can debug easily
```

### Network Sharing (Same WiFi)
```
backend:
  npm run dev
  Listening on: 0.0.0.0:3000
  Find IP: GET_IP.bat
  Share: http://192.168.1.x:3000

frontend/config.js:
  Detects IP address
  Uses same domain
  
Result:
  ✓ Others on WiFi can access
  ✓ Share URL easily
  ✓ No setup needed
```

### Production (Deployed)
```
backend/.env (on Render):
  PORT=3000
  NODE_ENV=production
  FRONTEND_URL=https://your-domain.vercel.app
  LOG_LEVEL=info

frontend/config.js:
  Detects production domain
  API_BASE = '' (relative URLs)
  OR = 'https://api-domain.onrender.com'
  
Result:
  ✓ Global internet access
  ✓ HTTPS by default
  ✓ Auto-scaling
  ✓ Minimal logs (info only)
```

---

## API Endpoint Structure

```
https://web-production-d5180.up.railway.app/api/
├─ auth/
│  ├─ POST /verify-identity
│  │   ├─ Body: { register_id, email }
│  │   └─ Response: { found, is_setup, name, register_id }
│  │
│  ├─ POST /setup-password
│  │   ├─ Body: { register_id, password }
│  │   └─ Response: { success, message }
│  │
│  ├─ POST /login
│  │   ├─ Body: { register_id, password }
│  │   └─ Response: { success, user: { name, register_id } }
│  │
│  ├─ GET /me
│  │   └─ Response: { user: { id, register_id, name, email, role } }
│  │
│  └─ POST /logout
│      └─ Response: { success, message }
│
├─ books/
│  ├─ GET / (list all books)
│  ├─ GET /:id (book details)
│  └─ Search functionality
│
├─ borrow/
│  ├─ GET / (user's borrowed books)
│  ├─ POST / (borrow a book)
│  └─ PUT /:id/return (return a book)
│
├─ dashboard/
│  └─ GET / (user activity overview)
│
└─ health (System status)
   └─ GET / (returns: status, database, environment)
```

---

## Debugging Checklist

### Check Backend
```bash
1. npm run dev in terminal
   ▼
   ✓ "✅ Server running on 0.0.0.0:3000"
   ✓ "✅ Database initialized successfully"
   ✓ "✅ Database connection verified"

2. curl https://web-production-d5180.up.railway.app/api/health
   ▼
   { "status": "healthy", "database": "connected" }
```

### Check Frontend
```javascript
1. Browser Console (F12 → Console)
   ▼
  ✓ "🌐 Development mode - API Base: https://web-production-d5180.up.railway.app"
  ✓ "📍 API Base URL: https://web-production-d5180.up.railway.app"

2. Network Tab (F12 → Network)
   ▼
   ✓ API calls going to correct URL
   ✓ Status: 200 (OK)
   ✓ Response: Valid JSON
```

### Check Database
```bash
1. Database file exists
   ls backend/smart_library.db
   
2. Users seeded
   npm run seed
   
3. Test user exists
   Login: AN / an@srkr.ac.in
```

---

## Summary

✅ **Local Development**: Works perfectly with `npm run dev`
✅ **Network Sharing**: Share IP address with others on same WiFi
✅ **Internet Deployment**: Follow `DEPLOYMENT.md` for cloud platforms
✅ **Database**: SQLite for development, MongoDB for production scale
✅ **Configuration**: Environment variables for flexibility
✅ **Logging**: Comprehensive logs for debugging

---

**Next Step**: Choose your use case and follow the guide:
- Just testing? → `npm run dev`
- Sharing in office? → Run `GET_IP.bat`
- Deploying online? → Read `DEPLOYMENT.md`
