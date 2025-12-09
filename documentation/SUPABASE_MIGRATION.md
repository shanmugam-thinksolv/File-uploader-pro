# Supabase Migration Guide

This guide will help you migrate from SQLite to Supabase (PostgreSQL).

## Prerequisites

1. A Supabase account (free tier is sufficient for development)
2. Node.js and npm installed
3. Existing File Uploader Pro project

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Project Name**: File Uploader Pro (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project" and wait 1-2 minutes for setup

## Step 2: Get Database Connection Strings

1. In your Supabase project dashboard, go to **Settings** (gear icon at bottom left)
2. Click **Database** in the sidebar
3. Scroll to **Connection String** section
4. You need TWO connection strings:

### Connection String (Transaction Mode) - for DATABASE_URL
- Click on "Transaction" mode
- Copy the connection string that looks like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- Replace `[YOUR-PASSWORD]` with your actual database password

### Connection String (Session Mode) - for DIRECT_URL
- Click on "Session" mode
- Copy the connection string that looks like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```
- Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Update Environment Variables

1. Open your `.env` file (or create one if it doesn't exist)
2. Update or add these lines:

```env
# Database Configuration - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

3. Keep your existing environment variables:
```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Step 4: Clean and Prepare Prisma

Open a terminal and run:

```bash
# Clean Prisma client
npm run prisma:clean

# Or manually:
rm -rf node_modules/.prisma
npm install
```

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

This creates a new Prisma client configured for PostgreSQL.

## Step 6: Push Schema to Supabase

```bash
npx prisma db push
```

This command:
- Creates all tables in your Supabase database
- Sets up relationships and indexes
- Applies the schema without creating migration files

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres"

🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

## Step 7: Verify Database Setup

You can verify the setup in two ways:

### Option A: Via Supabase Dashboard
1. Go to your Supabase project
2. Click **Table Editor** in the left sidebar
3. You should see these tables:
   - Account
   - Form
   - Session
   - Submission
   - User
   - VerificationToken

### Option B: Via Test Script
Run the database test script:
```bash
npx tsx development-scripts/test-db.ts
```

Expected output:
```
Connecting to database...
Current form count: 0
✓ Database verification successful!
```

## Step 8: Start Your Application

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
1. Login with Google
2. Create a new form
3. Test file upload
4. Check submissions

## Troubleshooting

### Error: "Can't reach database server"
- Check your DATABASE_URL is correct
- Verify your Supabase project is running (not paused)
- Check your internet connection
- Verify firewall isn't blocking Supabase

### Error: "P1001: Can't reach database"
- Your password might have special characters that need URL encoding
- Try wrapping password in quotes or URL encode special chars:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`

### Error: "Schema is not empty"
If you see this error, your database has existing tables. Either:
1. Drop all tables in Supabase Table Editor
2. Or use `npx prisma db push --force-reset` (⚠️ deletes all data!)

### Error: "Prisma Client not generated"
Run:
```bash
npx prisma generate
```

### Connection Pooling Issues
If you experience timeouts:
1. Make sure you're using the Transaction mode URL for DATABASE_URL
2. Make sure you're using the Session mode URL for DIRECT_URL
3. Check your Supabase project hasn't reached connection limits

## Data Migration (Optional)

If you have existing data in SQLite that you want to migrate:

### Step 1: Export SQLite Data
```bash
# Install sqlite3 CLI if not installed
# Then export your data
sqlite3 prisma/dev.db .dump > backup.sql
```

### Step 2: Convert SQL Format
SQLite and PostgreSQL have different syntax. You'll need to:
1. Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`
2. Replace `DATETIME` with `TIMESTAMP`
3. Remove SQLite-specific pragmas

### Step 3: Import to Supabase
Use the Supabase SQL Editor to run your converted SQL.

**Note**: For most use cases, starting fresh with Supabase is recommended.

## Production Deployment

### Environment Variables
When deploying to production (Vercel, etc.):
1. Add DATABASE_URL and DIRECT_URL to your platform's environment variables
2. Never commit .env files to git
3. Use production-grade database password

### Connection Limits
- Free tier: 60 concurrent connections
- Pro tier: 200+ concurrent connections
- Use connection pooling (already configured in DATABASE_URL)

## Benefits of Supabase

✅ **Scalability**: Better than SQLite for production
✅ **Real-time**: Can add real-time features later
✅ **Backups**: Automatic backups (Pro plan)
✅ **Dashboard**: Visual database management
✅ **Auth**: Can integrate Supabase Auth in future
✅ **Storage**: Can use Supabase Storage alongside Drive
✅ **Free Tier**: 500MB database, 1GB file storage

## Rollback (if needed)

If you need to go back to SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="file:./dev.db"
```

3. Regenerate and push:
```bash
npx prisma generate
npx prisma db push
```

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Discord](https://discord.supabase.com)

---

**Migration Complete!** 🎉

Your File Uploader Pro is now running on Supabase PostgreSQL!

