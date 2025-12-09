# File Form Uploader - Project Handover Documentation

## 1. Project Overview
**File Form Uploader** is a Next.js application designed to create and manage forms with file upload capabilities. It integrates with Google Drive for storage and uses Google OAuth for authentication.

### Key Technologies
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js (Google Provider)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Lucide React, Framer Motion

---

## 2. Prerequisites
Before setting up the project, ensure the following are installed on the machine:
- **Node.js**: Version 20 or higher (Recommended: LTS)
- **npm**: Comes with Node.js
- **Git**: For version control

---

## 3. Installation & Setup

### Step 1: Extract/Clone the Project
If you received this as a folder, place it in your desired workspace.
If cloning from a repository:
```bash
git clone <repository-url>
cd "File form Uploader"
```

### Step 2: Install Dependencies
Open a terminal in the project root and run:
```bash
npm install
```

### Step 3: Environment Configuration
1. Create a file named `.env` in the root directory.
2. Copy the following content into it and fill in your specific values:

```env
# Google OAuth Credentials
# Create credentials at https://console.cloud.google.com/
# APIs to enable: Google Drive API, Google People API
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
# Generate a secret by running: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your_generated_secret_here

# Database Configuration - Supabase PostgreSQL
# Get these from: Supabase Dashboard > Project Settings > Database > Connection String
# Use "Transaction" mode (port 6543) for DATABASE_URL
# Use "Session" mode (port 5432) for DIRECT_URL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Important:** See [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for detailed Supabase setup instructions.

### Step 4: Database Setup

**Option A - Automated Setup (Windows):**
```bash
development-scripts\setup-supabase.bat
```

**Option B - Manual Setup:**
```bash
npm run db:setup
```

Or step by step:
```bash
npx prisma generate
npx prisma db push
```

**Verify Connection:**
```bash
npm run db:test
```

*Note: This creates tables in your Supabase PostgreSQL database.*

---

## 4. Running the Application

### Development Mode
To start the development server:
```bash
npm run dev
```
Access the app at: [http://localhost:3000](http://localhost:3000)

### Production Build
To build and start for production:
```bash
npm run build
npm start
```

---

## 5. Project Structure
- **`app/`**: Main application code (Next.js App Router).
  - **`api/`**: Backend API routes.
  - **`admin/`**: Admin dashboard and editor pages.
- **`components/`**: Reusable UI components.
- **`lib/`**: Utility functions and configurations (Auth, Prisma, Drive).
- **`prisma/`**: Database schema for Supabase PostgreSQL.
- **`development-scripts/`**: Helper scripts for maintenance.
  - `check-env.js`: Verifies environment variables.
  - `fix-prisma.bat`: Fixes common Prisma client issues.

---

## 6. Common Issues & Troubleshooting

### Database Errors
If you encounter errors related to Prisma or the database:
1. Verify your Supabase connection strings in `.env` are correct
2. Check your Supabase project is active (not paused)
3. Run `npx prisma generate` to refresh the client
4. If the schema changed, run `npx prisma db push`
5. Use the helper script: `development-scripts/fix-prisma.bat` (Windows)
6. Test connection: `npm run db:test`

**Common Supabase Issues:**
- **Can't reach database**: Check DATABASE_URL and DIRECT_URL
- **Authentication failed**: Verify your database password
- **Special characters in password**: URL-encode them (e.g., @ → %40)
- **Project paused**: Free tier Supabase projects pause after inactivity

### Google Authentication Issues
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct.
- In Google Cloud Console, ensure the "Authorized redirect URIs" includes:
  - `http://localhost:3000/api/auth/callback/google`
- Ensure the "Google Drive API" is enabled in the Google Cloud project.

### Google Drive Uploads
- The application requires the user to grant Drive permissions.
- Ensure the Google Cloud project has the correct scopes enabled (`https://www.googleapis.com/auth/drive.file`).

---

## 7. Maintenance
- **Updating Dependencies**: Run `npm update` to update packages.
- **Database Backups**: 
  - Supabase Pro plan includes automatic daily backups
  - Free tier: Use Supabase Dashboard > Database > Backups
  - Or export via: `pg_dump` or Supabase CLI
- **Monitoring**: Check Supabase Dashboard for database health and usage

---
*Documentation generated on 2025-12-04*
