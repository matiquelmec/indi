@echo off
setlocal EnableDelayedExpansion

REM INDI Platform - Local Testing Script
REM Tests the application locally before deployment

echo ========================================
echo    INDI Platform Local Test
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)
echo [OK] Node.js found

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    exit /b 1
)
cd ..

REM Build backend
echo.
echo Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed
    cd ..
    exit /b 1
)
cd ..

REM Start backend in background
echo.
echo Starting backend server...
start /B cmd /c "cd backend && npm run dev"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Check backend health
echo Checking backend health...
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend is not responding
    echo Please check backend/.env.development configuration
    taskkill /F /IM node.exe >nul 2>&1
    exit /b 1
)
echo [OK] Backend is running

REM Start frontend in background
echo.
echo Starting frontend server...
start /B cmd /c "npm run dev"
echo Waiting for frontend to start...
timeout /t 8 /nobreak >nul

REM Check frontend
echo Checking frontend...
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Frontend is not responding
    taskkill /F /IM node.exe >nul 2>&1
    exit /b 1
)
echo [OK] Frontend is running

echo.
echo ========================================
echo    Local Test Successful!
echo ========================================
echo.
echo Application is running:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000/api
echo.
echo Press any key to stop servers and exit...
pause >nul

REM Clean up
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped.

exit /b 0