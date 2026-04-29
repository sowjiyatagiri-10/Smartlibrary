# 🚀 SRKR Smart Library - Complete Deployment Guide

## Overview

This guide will help you deploy the Smart Library Management System so it can be accessed from the internet by others.

### Architecture
- **Backend**: Node.js/Express API with SQLite database
- **Frontend**: Static HTML/CSS/JS files
- **Database**: SQLite (embedded) or MongoDB Atlas (cloud)

---

## 🔧 Part 1: Local Development Setup

### Prerequisites
- Node.js v16+ installed
- npm or yarn package manager
- Git (optional, for version control)

### Steps

1. **Install dependencies**
```bash
cd smart1
npm install
```

2. **Initialize database**
```bash
npm run seed
```

3. **Start development server**
```bash
npm run dev
```

4. **Access the application**
- Open browser: `https://web-production-d5180.up.railway.app`
- Register ID: AN, Email: an@srkr.ac.in

---

## ☁️ Part 2: Deploy Backend to Render

### Why Render?
- Free tier available
- Auto-deploys from GitHub
- Integrated environment variables
- Good for Node.js applications

### Steps

1. **Push code to GitHub**
```bash
# If not already done
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/smart-library.git
git push -u origin main
```

2. **Create Render account**
- Go to https://render.com
- Sign up with GitHub
- Click "Authorize" to connect GitHub account

3. **Create Web Service**
- Click "New +" → "Web Service"
- Connect your repository
- Select the `smart1` branch

4. **Configure service**
- **Name**: `srkr-smart-library-api`
- **Root Directory**: `.`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

5. **Set Environment Variables**
- Click "Environment"
- Add variables:
```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
SESSION_SECRET=your_random_secret_key_here_change_this
LOG_LEVEL=info
```

6. **Deploy**
- Click "Create Web Service"
- Wait for deployment (2-3 minutes)
- Note your URL: `https://srkr-smart-library-api.onrender.com`

---

## 🎨 Part 3: Deploy Frontend to Vercel

### Why Vercel?
- Free tier for static sites
- CDN for fast loading
- Easy integration with GitHub
- Supports environment variables

### Steps

1. **Create Vercel account**
- Go to https://vercel.com
- Sign up with GitHub
- Click "Authorize"

2. **Import project**
- Click "Add New" → "Project"
- Select your GitHub repository
- Select the folder root

3. **Configure Frontend**
- **Framework**: Other (it's static HTML)
- **Root Directory**: `frontend`
- **Build Command**: (leave empty)
- **Output Directory**: `.`

4. **Add Environment Variables**
- In Vercel dashboard, go to Settings → Environment Variables
- Add:
```
VITE_API_URL=https://srkr-smart-library-api.onrender.com
```

5. **Deploy**
- Click "Deploy"
- Wait for deployment (1-2 minutes)
- Note your URL: `https://srkr-smart-library.vercel.app`

6. **Update Backend CORS**
- Go back to Render dashboard
- Update `FRONTEND_URL` environment variable to your Vercel URL
- Redeploy backend

---

## 📱 Part 4: Update Configuration for Deployed URLs

### Backend (.env on Render)
```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://srkr-smart-library.vercel.app
SESSION_SECRET=generate_a_random_string_here
LOG_LEVEL=info
```

### Frontend (config.js)
The frontend automatically detects:
- **Local development**: Uses `https://web-production-d5180.up.railway.app` (production)
- **Production**: Uses relative URLs (works when frontend and backend are on same domain)
- **Separate domains**: Update `API_BASE` in `frontend/config.js`

For separate domains, update `frontend/config.js`:
```javascript
// For production with separate backend URL
API_BASE = 'https://srkr-smart-library-api.onrender.com';
```

---

## ✅ Part 5: Testing After Deployment

1. **Test Backend Health**
```bash
curl https://srkr-smart-library-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

2. **Test Frontend**
- Open https://srkr-smart-library.vercel.app
- Try login with AN / an@srkr.ac.in

3. **Check Network Requests**
- Open Browser DevTools (F12)
- Go to Network tab
- Verify API calls go to correct URL (should see `srkr-smart-library-api.onrender.com`)

4. **Monitor Logs**
- **Render**: Dashboard → service → Logs
- **Vercel**: Deployments → View → Logs

---

## 🔑 Part 6: Database Upgrade (Optional)

### Current: SQLite
- ✅ Works great for single instance
- ✅ No setup required
- ⚠️ Not ideal for multiple servers

### Future: MongoDB Atlas
1. Create free tier cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Update `.env`:
```env
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/srkr_library
```
4. Update `backend/db.js` to use MongoDB instead of SQLite

---

## 🆘 Troubleshooting

### Issue: "Database connection failed" on login
**Solution**: 
- Check backend health: `https://YOUR_BACKEND_URL/api/health`
- Ensure database is initialized on first run
- Check backend logs on Render

### Issue: "Cannot connect to server"
**Solution**:
- Verify `FRONTEND_URL` in backend .env matches your Vercel URL
- Check browser console for actual API URL being called
- Verify CORS is configured correctly

### Issue: Frontend loading but API calls failing
**Solution**:
- Check `VITE_API_URL` in frontend environment
- Verify backend URL in browser Network tab
- Ensure backend CORS includes your frontend domain

### Issue: Render free tier sleeping
**Solution**:
- Render free tier spins down after inactivity
- First request takes 30 seconds to wake up
- Upgrade to paid tier for always-on service

---

## 📊 Sharing with Others

### Share your deployment URLs:
```
Frontend: https://srkr-smart-library.vercel.app
Backend API: https://srkr-smart-library-api.onrender.com

Test Account:
Register ID: AN
Email: an@srkr.ac.in
Password: password123 (or set new password on first login)
```

### For GitHub collaboration:
1. Add collaborators to your GitHub repo
2. They can clone and run locally
3. All environment variables are set in cloud platforms

---

## 📝 Production Checklist

Before sharing with real users:

- [ ] Change `SESSION_SECRET` to random strong string
- [ ] Change `NODE_ENV` to `production` on backend
- [ ] Verify HTTPS is enabled (Vercel/Render do this automatically)
- [ ] Test login flow end-to-end
- [ ] Check error logs for issues
- [ ] Enable HTTPS cookies (already configured)
- [ ] Set up email notifications (update EMAIL_USER/PASSWORD)
- [ ] Create admin user in database
- [ ] Set up database backups

---

## 🔐 Security Tips

1. **Environment Variables**
   - Never commit `.env` files to GitHub
   - Use platform-specific environment variable management
   - Rotate secrets regularly

2. **Database**
   - Keep database file safe on server
   - Regular backups
   - Consider cloud database for production

3. **Frontend**
   - Don't store sensitive data in localStorage
   - Use httpOnly cookies (already configured)
   - Enable HTTPS only

4. **API Security**
   - Rate limit endpoints
   - Validate all inputs
   - Use proper authentication

---

## 🆙 Future Enhancements

1. **Database**: Migrate from SQLite to MongoDB for scalability
2. **Storage**: Move uploaded files to AWS S3 or similar
3. **Email**: Configure automated email reminders
4. **CI/CD**: Set up automated tests and deployments
5. **Monitoring**: Add error tracking (Sentry, LogRocket)
6. **Analytics**: Add usage analytics

---

## 📞 Support

For issues:
1. Check browser console for errors (F12)
2. Check backend logs on Render
3. Review this guide's troubleshooting section
4. Check GitHub issues or documentation

---

**Happy Deploying! 🚀**
