@echo off
REM 🚀 SMART LIBRARY - DEPLOYMENT SCRIPT FOR WINDOWS
REM Framework: Node.js + Express.js
REM Database: SQLite (sql.js)
REM Frontend: Vanilla HTML5/CSS/JS

setlocal enabledelayedexpansion

set PROJECT_NAME=Smart Library Management System
set REPO_URL=https://github.com/sowjiyatagiri-10/Smartlibrary
set GITHUB_USER=sowjiyatagiri-10
set GITHUB_REPO=Smartlibrary

REM ============================================================
REM MENU
REM ============================================================
:menu
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║        🚀 SMART LIBRARY - DEPLOYMENT MENU                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 1. Setup - Install dependencies
echo 2. Test - Run locally
echo 3. Verify - Check setup
echo 4. Deploy - To Render (Backend)
echo 5. Deploy - To Vercel (Frontend)
echo 6. Deploy - To Heroku (All-in-one)
echo 7. Deploy - To GitHub Pages
echo 8. Full Setup - All steps
echo 9. Git Cleanup - Prepare for production
echo 0. Exit
echo.
set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto test
if "%choice%"=="3" goto verify
if "%choice%"=="4" goto render
if "%choice%"=="5" goto vercel
if "%choice%"=="6" goto heroku
if "%choice%"=="7" goto github_pages
if "%choice%"=="8" goto fullsetup
if "%choice%"=="9" goto git_cleanup
if "%choice%"=="0" exit /b
goto menu

REM ============================================================
REM SETUP - Install dependencies
REM ============================================================
:setup
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  SETUP - Installing Dependencies                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    goto menu
)

echo [✓] Checking Node.js...
node --version

echo [✓] Checking npm...
npm --version

echo.
echo [INFO] Installing dependencies...
call npm install

if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    goto menu
)

echo [✓] Dependencies installed successfully!
pause
goto menu

REM ============================================================
REM VERIFY - Check setup
REM ============================================================
:verify
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  VERIFY - Checking Configuration                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

if exist "backend\.env" (
    echo [✓] backend\.env exists
    echo.
    echo Contents:
    type backend\.env
) else (
    echo [!] backend\.env NOT found
    if exist "backend\.env.example" (
        echo [INFO] Creating from template...
        copy backend\.env.example backend\.env
        echo [✓] Created backend\.env
    )
)

echo.
echo [✓] Checking node_modules...
if exist "node_modules" (
    echo [✓] node_modules exists
) else (
    echo [!] node_modules NOT found - run Setup first
)

echo.
pause
goto menu

REM ============================================================
REM TEST - Run locally
REM ============================================================
:test
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  TEST - Running Locally (Press Ctrl+C to stop)                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Starting development server...
echo [INFO] Visit: https://web-production-d5180.up.railway.app
echo [INFO] Press Ctrl+C to stop
echo.

call npm run dev

if errorlevel 1 (
    echo [ERROR] Server failed to start
    pause
)
goto menu

REM ============================================================
REM RENDER - Deploy to Render
REM ============================================================
:render
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  DEPLOY TO RENDER - Backend Deployment                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Steps to deploy to Render:
echo.
echo 1. Go to: https://dashboard.render.com
echo 2. Sign in with GitHub (%GITHUB_USER%)
echo 3. Click: New ^> Web Service
echo 4. Connect repository: %GITHUB_USER%/%GITHUB_REPO%
echo 5. Configure:
echo    - Name: smart-library-api
echo    - Build Command: npm install
echo    - Start Command: npm start
echo 6. Set Environment Variables:
echo    PORT=3000
echo    NODE_ENV=production
echo    SESSION_SECRET=[auto-generated]
echo    FRONTEND_URL=https://smart-library-frontend.vercel.app
echo 7. Click: Create Web Service
echo.
echo Result: https://smart-library-api.onrender.com
echo.

echo [✓] Manual deployment in Render dashboard
pause
goto menu

REM ============================================================
REM VERCEL - Deploy to Vercel
REM ============================================================
:vercel
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  DEPLOY TO VERCEL - Frontend Deployment                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Steps to deploy to Vercel:
echo.
echo 1. Go to: https://vercel.com
echo 2. Sign in with GitHub (%GITHUB_USER%)
echo 3. Click: Add New ^> Project
echo 4. Select: %GITHUB_USER%/%GITHUB_REPO%
echo 5. Configure:
echo    - Framework: Other
echo    - Root Directory: .
echo    - Output Directory: frontend
echo 6. Set Environment Variable:
echo    VITE_API_URL=https://smart-library-api.onrender.com
echo 7. Click: Deploy
echo.
echo Result: https://smart-library-frontend.vercel.app
echo.

echo [✓] Manual deployment in Vercel dashboard
pause
goto menu

REM ============================================================
REM HEROKU - Deploy to Heroku
REM ============================================================
:heroku
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  DEPLOY TO HEROKU - All-in-One Deployment                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

where heroku >nul 2>nul
if errorlevel 1 (
    echo [INFO] Installing Heroku CLI...
    call npm install -g heroku
)

echo [INFO] Logging into Heroku...
call heroku login

if errorlevel 1 (
    echo [ERROR] Heroku login failed
    pause
    goto menu
)

echo [INFO] Creating Heroku app...
for /f "tokens=*" %%A in ('powershell -Command "Get-Random"') do set RANDOM_NUM=%%A
set APP_NAME=smart-library-api-%RANDOM_NUM%
call heroku create %APP_NAME%

echo [INFO] Setting environment variables...
call heroku config:set PORT=3000
call heroku config:set NODE_ENV=production
call heroku config:set SESSION_SECRET=your_secret_key_here

echo [INFO] Deploying...
call git push heroku main

if errorlevel 1 (
    echo [ERROR] Deployment failed
    pause
    goto menu
)

echo.
echo [✓] Deployed to Heroku!
echo URL: https://%APP_NAME%.herokuapp.com
echo.
pause
goto menu

REM ============================================================
REM GITHUB PAGES - Deploy frontend only
REM ============================================================
:github_pages
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  DEPLOY TO GITHUB PAGES - Frontend Only                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [!] WARNING: GitHub Pages will NOT work properly
echo    because it cannot run the backend API.
echo    Use Render + Vercel instead.
echo.
echo [INFO] If you still want to proceed:
echo.
echo 1. Create gh-pages branch:
echo    git checkout -b gh-pages
echo 2. Copy frontend files:
echo    xcopy frontend\*.* . /Y
echo 3. Commit:
echo    git add .
echo    git commit -m "Deploy frontend to GitHub Pages"
echo 4. Push:
echo    git push origin gh-pages
echo.
echo Result: https://%GITHUB_USER%.github.io/%GITHUB_REPO%
echo.
pause
goto menu

REM ============================================================
REM FULL SETUP - All steps
REM ============================================================
:fullsetup
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  FULL SETUP - Complete Installation                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [STEP 1] Installing dependencies...
call npm install

if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    goto menu
)

echo [✓] Dependencies installed

echo.
echo [STEP 2] Checking environment...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env
        echo [✓] Created backend\.env
    )
)

echo.
echo [STEP 3] Seeding database...
call npm run seed

if errorlevel 1 (
    echo [!] Seed failed (non-critical)
)

echo.
echo [✓] Setup complete!
echo.
echo Next steps:
echo 1. Run locally: npm run dev
echo 2. Open: https://web-production-d5180.up.railway.app
echo 3. Test login with Register ID = AN
echo.
pause
goto menu

REM ============================================================
REM GIT CLEANUP - Prepare for production
REM ============================================================
:git_cleanup
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  GIT CLEANUP - Prepare for Production                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Cleaning npm cache...
call npm prune --production

echo [✓] Cleaned dependencies

echo.
echo [INFO] Committing changes...
call git add .
call git commit -m "Clean up dependencies and prepare for production" 2>nul

echo [✓] Committed changes

echo.
echo [INFO] Pushing to GitHub...
call git push origin main

if errorlevel 1 (
    echo [!] Git push had issues (check manually)
)

echo [✓] Repository updated!
echo.
pause
goto menu

REM ============================================================
REM SUMMARY
REM ============================================================
:summary
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    DEPLOYMENT SUMMARY                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Project: %PROJECT_NAME%
echo Repository: %REPO_URL%
echo Tech Stack: Node.js + Express.js + SQLite
echo.
echo RECOMMENDED DEPLOYMENT:
echo  ✓ Backend: Render     → https://smart-library-api.onrender.com
echo  ✓ Frontend: Vercel    → https://smart-library-frontend.vercel.app
echo  ✓ GitHub: Repository  → %REPO_URL%
echo.
pause
goto menu
