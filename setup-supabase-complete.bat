@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo    INDI Platform - Supabase Setup
echo ========================================
echo.

echo 🔍 Verificando configuración de Supabase...

REM Verificar que Node.js está disponible
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado
    goto :error
)

REM Verificar archivo de configuración
if not exist "backend\.env.development" (
    echo [ERROR] Archivo backend\.env.development no encontrado
    goto :error
)

echo ✅ Configuración encontrada

echo.
echo 🔌 Probando conexión a Supabase...
cd backend
call npx ts-node verify-supabase.ts
if %errorlevel% neq 0 (
    echo [ERROR] No se puede conectar a Supabase
    cd ..
    goto :error
)
cd ..

echo.
echo ========================================
echo    Configuración de Base de Datos
echo ========================================
echo.
echo Para completar la configuración, necesitas ejecutar el SQL en Supabase:
echo.
echo 1. Ve a: https://supabase.com/dashboard/project/ikrpcaahwyibclvxbgtn
echo 2. Ve al "SQL Editor"
echo 3. Ejecuta el archivo: setup-complete-database.sql
echo.
echo El archivo contiene:
echo   ✅ Tablas: users, cards, sessions, analytics_events
echo   ✅ Índices para optimización
echo   ✅ Políticas de seguridad RLS
echo   ✅ Datos de ejemplo
echo.

REM Mostrar el contenido del archivo SQL
echo ============ CONTENIDO SQL ============
type setup-complete-database.sql
echo ========================================

echo.
echo ⚠️  IMPORTANTE: Ejecuta este SQL en el dashboard de Supabase
echo    para crear todas las tablas necesarias.
echo.

echo 🧪 Después de ejecutar el SQL, prueba la aplicación con:
echo    test-local.bat
echo.

goto :end

:error
echo.
echo [ERROR] Configuración falló
pause
exit /b 1

:end
echo.
echo ✅ Configuración lista. Ejecuta el SQL en Supabase y prueba la aplicación.
pause
exit /b 0