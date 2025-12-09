@echo off
pushd "%~dp0.."
echo ============================================
echo Prisma Client Regeneration Script
echo (PostgreSQL/Supabase Compatible)
echo ============================================
echo.
echo This script will:
echo 1. Check if dev server is running
echo 2. Attempt to stop it
echo 3. Regenerate Prisma client
echo 4. Push schema to database
echo ============================================
echo.

echo Step 1: Attempting to kill Next.js dev server...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo   [SUCCESS] Node processes terminated
    timeout /t 2 >nul
) else (
    echo   [INFO] No Node processes were running
)
echo.

echo Step 2: Removing old Prisma client...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma" 2>nul
    if %errorlevel% equ 0 (
        echo   [SUCCESS] Old Prisma client removed
    ) else (
        echo   [WARNING] Could not remove old Prisma client - may be locked
        echo   Please manually stop the dev server and try again
        pause
        exit /b 1
    )
) else (
    echo   [INFO] No old Prisma client found
)
echo.

echo Step 3: Generating new Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo   [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)
echo   [SUCCESS] Prisma client generated
echo.

echo Step 4: Pushing schema to database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo   [ERROR] Failed to push schema to database
    pause
    exit /b 1
)
echo   [SUCCESS] Schema pushed to database
echo.

echo ============================================
echo All steps completed successfully!
echo You can now run: npm run dev
echo ============================================
pause
popd
