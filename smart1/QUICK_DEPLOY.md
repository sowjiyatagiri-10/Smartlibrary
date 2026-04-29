# 🚀 SMART LIBRARY - DEPLOYMENT COMMANDS

## Quick Setup
```bash
# Clone
git clone https://github.com/sowjiyatagiri-10/Smartlibrary.git
cd Smartlibrary

# Install
npm install

# Run locally
npm run dev

# Test at: https://web-production-d5180.up.railway.app
```

---

## 🔧 LOCAL DEVELOPMENT

### Run Development Server
```bash
npm run dev
```
- Auto-reload on file changes
- Shows detailed logs
- https://web-production-d5180.up.railway.app

### Run Production Server
```bash
npm start
```
- Single instance
- No auto-reload
- https://web-production-d5180.up.railway.app

### Seed Test Data (11 users, 20 books)
```bash
npm run seed
```

Test login:
- Register ID: `AN`
- Email: `an@srkr.ac.in`

---

## 📤 DEPLOY TO RENDER (Backend)

### Method 1: GitHub Auto-Deploy (Recommended)
```
1. Go: https://dashboard.render.com
2. Sign in with GitHub (sowjiyatagiri-10)
3. Click: New → Web Service
4. Connect: sowjiyatagiri-10/Smartlibrary
5. Configure:
   Name: smart-library-api
   Build: npm install
   Start: npm start
6. Environment Variables:
   PORT=3000
   NODE_ENV=production
   SESSION_SECRET=[auto]
   FRONTEND_URL=https://[your-vercel-url].vercel.app
7. Deploy
```

Result: `https://smart-library-api.onrender.com`

### Method 2: Manual Deploy
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

---

## 🎨 DEPLOY TO VERCEL (Frontend)

### Method 1: GitHub Auto-Deploy (Recommended)
```
1. Go: https://vercel.com
2. Sign in with GitHub
3. Click: Add New → Project
4. Select: sowjiyatagiri-10/Smartlibrary
5. Configure:
   Framework: Other
   Root: .
   Output: frontend
6. Environment:
   VITE_API_URL=https://smart-library-api.onrender.com
7. Deploy
```

Result: `https://smart-library-frontend.vercel.app`

---

## 🔗 DEPLOY TO HEROKU (Alternative All-in-One)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create smart-library-api

# Set environment
heroku config:set PORT=3000
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_secret_key

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open
heroku open
```

Result: `https://smart-library-api-xxxxx.herokuapp.com`

---

## 📝 DEPLOY TO GITHUB PAGES (Frontend Only)

⚠️ **Note:** GitHub Pages cannot run backend, so API calls will fail.
Only recommended if you have backend deployed elsewhere.

```bash
# Create gh-pages branch
git checkout -b gh-pages

# Copy frontend files
cp -r frontend/* .
git add .
git commit -m "Deploy frontend to GitHub Pages"

# Push
git push origin gh-pages

# Enable in GitHub:
# Settings → Pages → Branch: gh-pages

# Result: https://sowjiyatagiri-10.github.io/Smartlibrary
```

---

## 🧪 VERIFICATION

### Check Backend Health
```bash
curl https://smart-library-api.onrender.com/api/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### Test Login API
```bash
curl -X POST https://smart-library-api.onrender.com/api/auth/verify-identity \
  -H "Content-Type: application/json" \
  -d '{"register_id":"AN","email":"an@srkr.ac.in"}'
```

Expected:
```json
{
  "found": true,
  "is_setup": false,
  "name": "Sahasra",
  "register_id": "AN"
}
```

---

## 📊 ENVIRONMENT VARIABLES

### Development (.env)
```
PORT=3000
NODE_ENV=development
SESSION_SECRET=dev_secret_key
FRONTEND_URL=https://web-production-d5180.up.railway.app
LOG_LEVEL=debug
```

### Production (Render)
```
PORT=3000
NODE_ENV=production
SESSION_SECRET=[auto-generated]
FRONTEND_URL=https://smart-library-frontend.vercel.app
DATABASE_URL=/var/data/smart_library.db
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

---

## 🐛 TROUBLESHOOTING

### Port 3000 in use
```bash
npx kill-port 3000
npm run dev
```

### Modules not found
```bash
npm ci
npm install
npm run dev
```

### Database error
```bash
# Verify .env exists in backend/
type backend\.env

# Reseed database
npm run seed
```

### CORS errors in login
Check `backend/.env`:
```
FRONTEND_URL=https://web-production-d5180.up.railway.app
```

### API not responding
```bash
# Check health endpoint
curl https://web-production-d5180.up.railway.app/api/health

# View logs
npm run dev
```

---

## 📋 TECH STACK

- **Backend:** Node.js + Express.js
- **Database:** SQLite (sql.js)
- **Frontend:** Vanilla HTML5/CSS3/JavaScript
- **Auth:** bcrypt + express-session
- **APIs:** RESTful with CORS
- **Email:** Nodemailer (optional)
- **Scheduling:** node-cron (optional)

---

## 🎯 RECOMMENDED DEPLOYMENT

### Best Approach: Render + Vercel

1. **Backend → Render**
   - Full Node.js support
   - Free tier with database
   - Auto-deploys on git push

2. **Frontend → Vercel**
   - Optimized for frontend
   - Global CDN
   - Auto-deploys on git push

3. **Both update automatically on git push**

### Final URLs
- Frontend: `https://smart-library-frontend.vercel.app`
- Backend: `https://smart-library-api.onrender.com`
- GitHub: `https://github.com/sowjiyatagiri-10/Smartlibrary`

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] Run `npm install`
- [ ] Run `npm run dev` locally
- [ ] Run `npm run seed` to test database
- [ ] Push to GitHub: `git push origin main`
- [ ] Create `.env` in backend/ if missing
- [ ] Test login credentials work
- [ ] Verify `.gitignore` excludes `.env`

---

Generated: April 28, 2026
Status: Production Ready ✅
