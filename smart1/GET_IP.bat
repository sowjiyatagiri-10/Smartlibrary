@echo off
REM Get Local IP Address Script for Windows
REM Use this to find your IP address for sharing on local network

echo.
echo ======================================
echo 📍 Your Local Network Information
echo ======================================
echo.

REM Get IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set IP=%%a
)

REM Clean up the IP address (remove leading space)
set IP=%IP:~1%

echo Your Local IP Address: %IP%
echo.
echo Share this URL with others on your network:
echo http://%IP%:3000
echo.
echo ======================================
echo.
echo To use:
echo 1. Make sure this server is running: npm run dev
echo 2. Share the URL above with others on the SAME WiFi/Network
echo 3. They can access it from their device!
echo.
echo ======================================
echo.
pause
