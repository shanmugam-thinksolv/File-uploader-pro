@echo off
pushd "%~dp0.."
cls
echo ========================================
echo Supabase Database Setup Script
echo ========================================
echo.
echo This script will:
echo 1. Generate Prisma Client for PostgreSQL
echo 2. Push schema to Supabase
echo 3. Test database connection
echo ========================================
echo.
echo Prerequisites:
echo - Supabase project created
echo - DATABASE_URL set in .env file
echo - DIRECT_URL set in .env file
echo.
pause
echo.

echo Step 1: Checking .env file...
if not exist ".env" (
    echo   [ERROR] .env file not found!
    echo   Please create .env file with your Supabase connection strings.
    echo   See documentation/SUPABASE_MIGRATION.md for details.
    pause
    exit /b 1
)
echo   [SUCCESS] .env file found
echo.

echo Step 2: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo   [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo   [SUCCESS] Dependencies installed
echo.

echo Step 3: Cleaning old Prisma client...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma" 2>nul
)
echo   [SUCCESS] Old client cleaned
echo.

echo Step 4: Generating Prisma Client for PostgreSQL...
call npx prisma generate
if %errorlevel% neq 0 (
    echo   [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)
echo   [SUCCESS] Prisma client generated
echo.

echo Step 5: Pushing schema to Supabase...
echo This will create all tables in your Supabase database.
call npx prisma db push
if %errorlevel% neq 0 (
    echo   [ERROR] Failed to push schema
    echo   Check your connection strings in .env file
    pause
    exit /b 1
)
echo   [SUCCESS] Schema pushed to Supabase
echo.

echo Step 6: Testing database connection...
call npx tsx development-scripts/test-supabase-connection.ts
if %errorlevel% neq 0 (
    echo   [WARNING] Database test failed
    echo   But schema might be set up correctly
    echo.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now:
echo - Run "npm run dev" to start the application
echo - Run "npx prisma studio" to view your database
echo - Check Supabase dashboard for your tables
echo.
echo Useful commands:
echo - npm run prisma:studio  : Open Prisma Studio
echo - npm run db:test         : Test database connection
echo - npx prisma db push      : Sync schema changes
echo.
pause
popd

