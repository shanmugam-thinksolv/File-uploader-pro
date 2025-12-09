# Supabase API Keys Guide

## Where to Find Your API Keys

### Step 1: Go to Your Supabase Project
1. Open https://supabase.com
2. Log in and select your project
3. Click on **Settings** (gear icon in the bottom left)
4. Click on **API** in the settings menu

### Step 2: Copy Your Keys

You'll see three important values:

#### 1. **Project URL**
```
https://[your-project-ref].supabase.co
```
- Add this as: `NEXT_PUBLIC_SUPABASE_URL`
- Safe to expose in client-side code

#### 2. **anon/public Key** (starts with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Add this as: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Safe to expose in client-side code
- Has Row Level Security (RLS) restrictions

#### 3. **service_role Key** (starts with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Add this as: `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **NEVER expose this in client-side code**
- ⚠️ **Has full database access** - bypasses RLS
- Only use in server-side API routes

---

## Do You Need These API Keys?

### ✅ **You DON'T need them if:**
- You're only using Prisma for database operations (current setup)
- You're only storing files in Google Drive
- Your app works fine without them

### 🔧 **You NEED them if you want to:**
- Use Supabase Storage (alternative to Google Drive)
- Use Supabase Authentication (alternative to NextAuth)
- Use Supabase Realtime (live data updates)
- Use Row Level Security policies
- Use Supabase Edge Functions

---

## How to Add Them to Your Project

### Step 1: Copy Keys from Supabase Dashboard

Go to: **Supabase Dashboard** → **Settings** → **API**

### Step 2: Add to Your `.env` File

Open your `.env` file and add:

```env
# Supabase API Keys (Optional)
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Note:** Only uncomment `SUPABASE_SERVICE_ROLE_KEY` if you specifically need it for server-side operations.

### Step 3: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## Usage Examples

### Using Supabase Storage (Alternative to Google Drive)

If you want to store files in Supabase Storage instead of Google Drive:

#### 1. Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 2. Upload File to Supabase Storage

```typescript
import { supabase } from '@/lib/supabase'

async function uploadFile(file: File) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`files/${file.name}`, file)
  
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(data.path)
  
  return publicUrl
}
```

#### 3. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## Security Best Practices

### ✅ DO:
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Use `anon` key for client-side operations
- Use `service_role` key only in API routes (server-side)
- Enable Row Level Security (RLS) on your tables
- Store service_role key in secure environment variables

### ❌ DON'T:
- Never commit `.env` to git
- Never expose `service_role` key in client code
- Never use `NEXT_PUBLIC_` prefix for `service_role` key
- Don't disable RLS unless absolutely necessary

---

## Current File Uploader Pro Setup

**Currently, your app uses:**
- ✅ Supabase PostgreSQL for database (via Prisma)
- ✅ Google Drive for file storage
- ✅ NextAuth for authentication

**You're NOT currently using:**
- ❌ Supabase Storage
- ❌ Supabase Auth
- ❌ Supabase Realtime

**So you DON'T need the API keys** unless you want to add these features in the future.

---

## Environment Variables Summary

### Required (You Already Have These):
```env
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Supabase Database (Required)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Optional (Only if Using Supabase Features):
```env
# Supabase API (Optional)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Testing Your Setup

### Test 1: Database Connection (Required)
```bash
npm run db:test
```
✅ Should pass if DATABASE_URL is correct

### Test 2: Supabase Client (Optional)
If you added the API keys, test them:

```typescript
// Create test-supabase-api.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase
    .from('User')
    .select('count')
  
  console.log('Supabase API works:', !error)
}

test()
```

---

## FAQ

### Q: I only see the database connection working. Do I need the API keys?
**A:** No! Your current setup uses Prisma to connect directly to the PostgreSQL database. The API keys are only needed if you want to use additional Supabase features like Storage or Realtime.

### Q: What's the difference between DATABASE_URL and SUPABASE_URL?
**A:** 
- `DATABASE_URL`: Direct PostgreSQL connection string (used by Prisma)
- `SUPABASE_URL`: REST API endpoint (used by Supabase client library)

They're different ways to access the same Supabase project.

### Q: Can I use both Google Drive AND Supabase Storage?
**A:** Yes! You could give users a choice, or use Google Drive for uploaded files and Supabase Storage for assets like logos.

### Q: I got the keys but the app still works without them. Why?
**A:** Your app currently uses Prisma for database operations, not the Supabase client library. The keys would only be needed if you add Supabase-specific features.

---

## Quick Reference

| Key | Purpose | Expose to Client? | Required? |
|-----|---------|-------------------|-----------|
| `DATABASE_URL` | Prisma database connection | ❌ No | ✅ Yes |
| `DIRECT_URL` | Prisma direct connection | ❌ No | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API endpoint | ✅ Yes | ❌ Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side operations | ✅ Yes | ❌ Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin operations | ❌ No | ❌ Optional |

---

**Need help?** Check the main migration guide: `SUPABASE_MIGRATION.md`

