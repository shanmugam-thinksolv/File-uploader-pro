@echo off
pushd "%~dp0.."
REM DATABASE_URL should be set in .env file (for PostgreSQL/Supabase)
REM No need to override it here anymore
npx prisma generate
npx prisma db push
popd
