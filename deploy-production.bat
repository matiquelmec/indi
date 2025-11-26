@echo off
setlocal EnableDelayedExpansion

REM INDI Platform - Production Deployment Script for Windows
REM Usage: deploy-production.bat [staging|production]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=staging
set COMPOSE_FILE=docker-compose.production.yml

echo ========================================
echo    INDI Platform Deployment Script
echo    Environment: %ENVIRONMENT%
echo ========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed
    goto :error
)
echo [OK] Docker found

REM Check Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed
    goto :error
)
echo [OK] Docker Compose found

REM Check environment files
if "%ENVIRONMENT%"=="production" (
    if not exist ".env.production" (
        echo [ERROR] .env.production not found
        echo Create it from .env.production.example
        goto :error
    )
    if not exist "backend\.env.production" (
        echo [ERROR] backend\.env.production not found
        echo Create it from backend\.env.production.example
        goto :error
    )
)
echo [OK] Environment files found
echo.

REM Confirm deployment
echo WARNING: You are about to deploy to %ENVIRONMENT%
set /p CONFIRM="Are you sure? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled
    goto :end
)

REM Backup current state
echo Creating backup...
docker-compose -f %COMPOSE_FILE% ps > deployment_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt

REM Build images
echo Building Docker images...
docker-compose -f %COMPOSE_FILE% build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build images
    goto :error
)
echo [OK] Images built successfully
echo.

REM Deploy
echo Starting deployment...

REM Stop existing containers
echo Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down

REM Start new containers
echo Starting new containers...
docker-compose -f %COMPOSE_FILE% up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers
    goto :rollback
)

REM Wait for services
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check container status
docker-compose -f %COMPOSE_FILE% ps

echo [OK] Deployment completed
echo.

REM Health checks
echo Running health checks...

REM Check backend
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is healthy
) else (
    echo [WARNING] Backend health check failed
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is accessible
) else (
    echo [WARNING] Frontend not accessible
)

echo.
echo ========================================
echo    Deployment Successful!
echo ========================================
echo.
echo Access your application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000/api
echo.
echo To view logs: docker-compose -f %COMPOSE_FILE% logs -f
goto :end

:rollback
echo Rolling back deployment...
docker-compose -f %COMPOSE_FILE% down
echo Rollback completed. Previous version should be restored manually.
goto :error

:error
echo.
echo [ERROR] Deployment failed!
exit /b 1

:end
exit /b 0