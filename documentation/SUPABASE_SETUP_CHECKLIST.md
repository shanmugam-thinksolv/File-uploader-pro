# Supabase Setup Checklist

Use this checklist to ensure you've completed all migration steps.

## ☐ Step 1: Create Supabase Account & Project
- [ ] Go to https://supabase.com and sign up (if you haven't already)
- [ ] Create a new project
  - Project name: `File Uploader Pro` (or your choice)
  - Database password: *(save this securely!)*
  - Region: *(choose closest to your users)*
- [ ] Wait 1-2 minutes for project initialization

## ☐ Step 2: Get Connection Strings
- [ ] In Supabase dashboard, go to: **Settings** → **Database**
- [ ] Scroll to **Connection String** section
- [ ] Copy **Transaction mode** string (port 6543) for `DATABASE_URL`
  ```
  postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- [ ] Copy **Session mode** string (port 5432) for `DIRECT_URL`
  ```
  postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:5432/postgres
  ```
- [ ] Replace `[YOUR-PASSWORD]` with your actual database password in both strings

## ☐ Step 3: Update Environment Variables
- [ ] Create/open `.env` file in project root
- [ ] Add or update these lines:
  ```env
  DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:5432/postgres"
  ```
- [ ] Keep existing Google OAuth and NextAuth variables
- [ ] Save the file

## ☐ Step 4: Install Dependencies (if not done)
```bash
npm install
```

## ☐ Step 5: Setup Database

**Option A - Windows Automated:**
```bash
development-scripts\setup-supabase.bat
```

**Option B - Manual:**
```bash
npm run db:setup
```

**Option C - Step by Step:**
```bash
npx prisma generate
npx prisma db push
```

## ☐ Step 6: Verify Setup
- [ ] Run connection test:
  ```bash
  npm run db:test
  ```
  or
  ```bash
  npx tsx development-scripts/test-supabase-connection.ts
  ```

- [ ] Expected output should show:
  - ✅ Database connection successful
  - ✅ PostgreSQL detected
  - ✅ All 6 tables found
  - ✅ CRUD operations work

## ☐ Step 7: Verify in Supabase Dashboard
- [ ] Go to Supabase dashboard
- [ ] Click **Table Editor** in left sidebar
- [ ] Verify these tables exist:
  - `User`
  - `Account`
  - `Session`
  - `VerificationToken`
  - `Form`
  - `Submission`

## ☐ Step 8: Start Application
```bash
npm run dev
```

## ☐ Step 9: Test Full Flow
- [ ] Open http://localhost:3000
- [ ] Login with Google
- [ ] Create a new form
- [ ] Configure Google Drive folder
- [ ] Publish the form
- [ ] Test file upload
- [ ] Check submission appears in dashboard
- [ ] Verify file appears in Google Drive

## ☐ Step 10: Check Supabase Data
- [ ] In Supabase dashboard → **Table Editor**
- [ ] Open `Form` table → verify your form is there
- [ ] Open `Submission` table → verify test submission is there
- [ ] Open `User` table → verify your user account is there

---

## 🎉 Migration Complete!

Your application is now running on Supabase PostgreSQL!

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run db:test` | Test database connection |
| `npm run prisma:studio` | Open Prisma Studio (visual DB editor) |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:push` | Push schema changes to database |
| `npx prisma db push --force-reset` | ⚠️ Reset database (deletes all data) |

## Troubleshooting

### ❌ "Can't reach database server"
- Verify DATABASE_URL and DIRECT_URL are correct
- Check Supabase project is not paused (free tier auto-pauses)
- Verify internet connection

### ❌ "Password authentication failed"
- Check password in connection string is correct
- URL-encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`

### ❌ "Relation does not exist"
- Schema not pushed yet
- Run: `npx prisma db push`

### ❌ "Prisma Client not generated"
- Run: `npx prisma generate`

### ℹ️ Need to start fresh?
1. In Supabase dashboard → SQL Editor
2. Run: 
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Then run: `npx prisma db push`

---

**Need Help?**
- 📖 [Full Migration Guide](./SUPABASE_MIGRATION.md)
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 📖 [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

