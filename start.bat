@echo off
echo 🚀 Starting Full-Stack Web App...
echo.

echo 📦 Installing dependencies...
call npm run install:all

echo.
echo 🔥 Starting development servers...
echo Client: http://localhost:5173
echo Server: http://localhost:3001
echo.

call npm run dev

pause
