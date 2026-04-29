#!/usr/bin/env node

/**
 * SMART LIBRARY DEPLOYMENT GUIDE
 * Framework: Node.js + Express.js
 * Database: SQLite (sql.js)
 * Frontend: Vanilla HTML5/CSS/JS
 * 
 * This script provides all necessary commands for local development
 * and production deployment across multiple platforms.
 */

const os = require('os');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        🚀 SMART LIBRARY - COMPLETE DEPLOYMENT GUIDE           ║
║                                                                ║
║        Framework: Node.js + Express.js                        ║
║        Database: SQLite (sql.js)                              ║
║        Frontend: Vanilla HTML5/CSS/JS                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log(`
📋 PROJECT STRUCTURE:
  ├── backend/           → Express.js API
  ├── frontend/          → Vanilla HTML/CSS/JS
  ├── package.json       → Node.js dependencies
  ├── .env               → Environment variables
  ├── vercel.json        → Vercel deployment
  ├── render.yaml        → Render deployment
  ├── Procfile           → Heroku deployment
  └── .gitignore         → Git ignore rules

🛠️  TECH STACK:
  ├── Express.js (4.22.1)
  ├── SQLite via sql.js (1.14.1)
  ├── bcrypt (5.1.1) - Password hashing
  ├── express-session (1.19.0) - Session management
  ├── CORS (2.8.6) - Cross-origin requests
  ├── nodemailer (6.10.1) - Email service
  ├── node-cron (3.0.3) - Job scheduling
  └── dotenv (16.6.1) - Environment config

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  1️⃣  LOCAL DEVELOPMENT SETUP                                  ║
╚════════════════════════════════════════════════════════════════╝

Step 1: Navigate to project
  cd c:\\Users\\sowji\\OneDrive\\Desktop\\smart1

Step 2: Install dependencies (already done, but to reinstall):
  npm install

Step 3: Create .env file in backend/ (copy from .env.example):
  backend\.env:
    PORT=3000
    NODE_ENV=development
    SESSION_SECRET=srkr_library_secret_2024
    FRONTEND_URL=https://web-production-d5180.up.railway.app

Step 4: Seed database with test data (optional):
  npm run seed

Step 5: Run development server:
  npm run dev
  
  Output should show:
    ✅ Server running on 0.0.0.0:3000
    ✅ Database initialized successfully
    ✅ Database connection verified
    🚀 Server ready to accept requests!

Step 6: Open browser:
  https://web-production-d5180.up.railway.app

Test login credentials:
  Register ID: AN
  Email: an@srkr.ac.in

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  2️⃣  DEPLOYMENT OPTION A: RENDER (Recommended)               ║
╚════════════════════════════════════════════════════════════════╝

Render is perfect for full-stack Node.js apps.
Provides free tier with database support.

OPTION A1: Using GitHub (Auto-deploy on push)
═════════════════════════════════════════════

1. Go to: https://dashboard.render.com

2. Sign in with GitHub (sowjiyatagiri-10)

3. Click "New +" → "Web Service"

4. Choose repository:
   Repository: sowjiyatagiri-10/Smartlibrary
   Branch: main

5. Configure service:
   Name: smart-library-api
   Environment: Node
   Region: (choose closest to you)
   Build Command: npm install
   Start Command: npm start

6. Environment Variables (add these):
   ┌─────────────────────────────────────────┐
   │ PORT                    = 3000           │
   │ NODE_ENV                = production    │
   │ SESSION_SECRET          = [Auto-gen]    │
   │ FRONTEND_URL            = [Your-URL]    │
   │ DATABASE_URL            = /var/data/db  │
   │ CORS_ORIGIN             = *             │
   │ CORS_CREDENTIALS        = true          │
   └─────────────────────────────────────────┘

7. Click "Create Web Service"

8. Wait 2-3 minutes for deployment

9. Your backend URL: https://smart-library-api.onrender.com

Verification:
  curl https://smart-library-api.onrender.com/api/health

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  3️⃣  DEPLOYMENT OPTION B: VERCEL (Frontend Focus)            ║
╚════════════════════════════════════════════════════════════════╝

Vercel is optimized for frontend deployment.
Works seamlessly with GitHub.

IMPORTANT: Use Render for backend (from Option A).
Vercel here is ONLY for frontend serving.

OPTION B1: Using GitHub (Auto-deploy)
═════════════════════════════════════

1. Go to: https://vercel.com

2. Sign in with GitHub (sowjiyatagiri-10)

3. Click "Add New" → "Project"

4. Select repository:
   Repository: sowjiyatagiri-10/Smartlibrary

5. Configure project:
   Framework: Other (since it's vanilla HTML)
   Root Directory: . (root)
   Build Command: (leave empty - no build needed)
   Output Directory: frontend
   Install Command: npm install

6. Environment Variables:
   ┌──────────────────────────────────────────────────┐
   │ VITE_API_URL = https://smart-library-api.onrender.com │
   └──────────────────────────────────────────────────┘

7. Click "Deploy"

8. Wait 1-2 minutes

9. Your frontend URL: https://smart-library-frontend.vercel.app

Auto-deployment: Every push to main triggers deployment

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  4️⃣  DEPLOYMENT OPTION C: HEROKU (Alternative)               ║
╚════════════════════════════════════════════════════════════════╝

Heroku is simpler one-command deployment.

OPTION C1: Using Heroku CLI
═════════════════════════════

Terminal commands:

# 1. Install Heroku CLI:
  npm install -g heroku

# 2. Login to Heroku:
  heroku login

# 3. Create app:
  heroku create smart-library-api-[random-suffix]

# 4. Set environment variables:
  heroku config:set PORT=3000
  heroku config:set NODE_ENV=production
  heroku config:set SESSION_SECRET=your_secret_key
  heroku config:set FRONTEND_URL=https://your-frontend-url

# 5. Deploy:
  git push heroku main

# 6. View logs:
  heroku logs --tail

# 7. Get URL:
  heroku open

Your URL will be: https://smart-library-api-xxxxx.herokuapp.com

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  5️⃣  DEPLOYMENT OPTION D: GITHUB PAGES (Frontend Only)      ║
╚════════════════════════════════════════════════════════════════╝

GitHub Pages can host the static frontend files.
⚠️  LIMITED: Will not work without backend API.

If you want static hosting:

1. Create gh-pages branch:
  git checkout -b gh-pages

2. Copy frontend files:
  cp -r frontend/* ./
  git add .
  git commit -m "Deploy frontend to GitHub Pages"

3. Push to GitHub:
  git push origin gh-pages

4. Enable GitHub Pages:
  - Go to: https://github.com/sowjiyatagiri-10/Smartlibrary
  - Settings → Pages
  - Select "gh-pages" branch
  - Save

5. Your static frontend URL:
  https://sowjiyatagiri-10.github.io/Smartlibrary

⚠️  NOTE: This will NOT work properly because:
  - No backend API endpoint available
  - Login will fail (API calls won't work)
  - Only for static file hosting

RECOMMENDED: Use Render + Vercel (Options A + B)

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  6️⃣  QUICK START - COPY/PASTE COMMANDS                       ║
╚════════════════════════════════════════════════════════════════╝

CLONE & SETUP:
───────────────
git clone https://github.com/sowjiyatagiri-10/Smartlibrary.git
cd Smartlibrary
npm install

RUN LOCALLY:
────────────
npm run dev
→ Visit: https://web-production-d5180.up.railway.app

RUN PRODUCTION LOCALLY:
──────────────────────
npm start

SEED DATABASE:
──────────────
npm run seed

PUSH TO GITHUB (after changes):
───────────────────────────────
git add .
git commit -m "Your message"
git push origin main

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  7️⃣  ENVIRONMENT VARIABLES REFERENCE                          ║
╚════════════════════════════════════════════════════════════════╝

DEVELOPMENT (.env):
  PORT=3000
  NODE_ENV=development
  SESSION_SECRET=your_secret_key
  FRONTEND_URL=https://web-production-d5180.up.railway.app
  LOG_LEVEL=debug

PRODUCTION (Render):
  PORT=3000
  NODE_ENV=production
  SESSION_SECRET=<auto-generated by Render>
  FRONTEND_URL=https://your-vercel-url.vercel.app
  DATABASE_URL=/var/data/smart_library.db
  CORS_ORIGIN=*
  CORS_CREDENTIALS=true

FRONTEND CONFIG (frontend/config.js):
  Automatically detects environment
  localhost → uses relative URLs
  production → uses absolute API_BASE

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  8️⃣  VERIFICATION & TESTING                                   ║
╚════════════════════════════════════════════════════════════════╝

HEALTH CHECK (Backend):
───────────────────────
curl https://web-production-d5180.up.railway.app/api/health

Expected response:
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}

TEST LOGIN (Backend):
─────────────────────
curl -X POST https://web-production-d5180.up.railway.app/api/auth/verify-identity \\
  -H "Content-Type: application/json" \\
  -d '{"register_id":"AN","email":"an@srkr.ac.in"}'

Expected response:
{
  "found": true,
  "is_setup": false,
  "name": "Sahasra",
  "register_id": "AN"
}

FRONTEND TEST:
──────────────
1. Open: https://web-production-d5180.up.railway.app
2. Enter: Register ID = AN
3. Enter: Email = an@srkr.ac.in
4. Click: Continue
5. Check browser console (F12) for logs

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  9️⃣  TROUBLESHOOTING                                          ║
╚════════════════════════════════════════════════════════════════╝

ERROR: "Port 3000 already in use"
──────────────────────────────────
Solution 1: Kill process on port 3000
  npx kill-port 3000

Solution 2: Use different port
  set PORT=3001
  npm start

ERROR: "Cannot find module 'express'"
──────────────────────────────────────
Solution: Reinstall dependencies
  npm install
  npm ci  # Clears cache and reinstalls

ERROR: "Database initialization failed"
───────────────────────────────────────
Solution: Verify backend/.env exists
  type backend\\.env
  # Should show PORT, NODE_ENV, etc.

ERROR: "CORS Error" in frontend
───────────────────────────────
Solution: Check FRONTEND_URL in .env
  backend\\.env should have:
    FRONTEND_URL=https://web-production-d5180.up.railway.app

ERROR: Login not working
──────────────────────
Solution:
  1. Check browser console (F12) for errors
  2. Check backend logs (npm run dev output)
  3. Verify database seeded: npm run seed
  4. Check test user exists: Register ID = AN

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🔟  RECOMMENDED DEPLOYMENT PATH                              ║
╚════════════════════════════════════════════════════════════════╝

BEST OPTION: Render + Vercel
════════════════════════════

1. Deploy Backend to Render (5 minutes):
   ✅ Full-stack Node.js support
   ✅ Free tier with database persistence
   ✅ Auto-deploys on git push
   ✅ Built-in SSL/HTTPS
   Result: https://smart-library-api.onrender.com

2. Deploy Frontend to Vercel (3 minutes):
   ✅ Optimized for frontend
   ✅ Global CDN
   ✅ Automatic SSL
   ✅ Preview deployments
   Result: https://smart-library-frontend.vercel.app

3. Both automatically update on git push to main

FINAL URLs:
  Frontend: https://smart-library-frontend.vercel.app
  Backend: https://smart-library-api.onrender.com
  GitHub: https://github.com/sowjiyatagiri-10/Smartlibrary

`);

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ✅  DEPLOYMENT CHECKLIST                                     ║
╚════════════════════════════════════════════════════════════════╝

Before deploying:
  ☐ npm install ← dependencies
  ☐ npm run dev ← test locally
  ☐ npm run seed ← test database
  ☐ git push ← code on GitHub
  ☐ backend/.env ← environment setup

Render deployment:
  ☐ GitHub connected
  ☐ Build command: npm install
  ☐ Start command: npm start
  ☐ Environment variables set
  ☐ Deployment successful

Vercel deployment:
  ☐ GitHub connected
  ☐ Root directory: .
  ☐ Output directory: frontend
  ☐ VITE_API_URL set to Render backend
  ☐ Deployment successful

Final testing:
  ☐ Backend health: /api/health
  ☐ Frontend loads
  ☐ Login works
  ☐ Database queries work

`);

console.log(`
📞 SUPPORT & RESOURCES
══════════════════════

Documentation:
  - Render Docs: https://render.com/docs
  - Vercel Docs: https://vercel.com/docs
  - Express.js: https://expressjs.com
  - sql.js: https://sql.js.org

GitHub Repository:
  https://github.com/sowjiyatagiri-10/Smartlibrary

Created: April 2026
Status: Production Ready ✅

═══════════════════════════════════════════════════════════════════

Press ENTER to continue...
`);
