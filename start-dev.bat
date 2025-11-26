@echo off
echo =========================================
echo INDI - Starting Development Environment
echo =========================================

echo.
echo Step 1: Installing frontend dependencies...
call npm install

echo.
echo Step 2: Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Step 3: Starting backend server...
cd backend
start "INDI Backend" cmd /k "npm run dev"
cd ..

echo.
echo Waiting for backend to start...
timeout /t 3

echo.
echo Step 4: Starting frontend development server...
start "INDI Frontend" cmd /k "npm run dev"

echo.
echo =========================================
echo Development environment started!
echo =========================================
echo Frontend: http://localhost:3000
echo Backend:   http://localhost:5000
echo.
echo Press any key to close this window...
pause > nul