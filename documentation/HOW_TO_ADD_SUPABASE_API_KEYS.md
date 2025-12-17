# 🔑 How to Add Your Supabase API Keys

## Quick Answer: Where to Store Them

**Store your Supabase API keys in the `.env` file** in the root of your project.

---

## Step-by-Step Instructions

### 1️⃣ Find Your API Keys in Supabase

1. Open https://supabase.com
2. Go to your project
3. Click **Settings** (⚙️ gear icon at bottom left)
4. Click **API** in the left menu
5. You'll see:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co

API Keys
─────────────────────────────────────
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    [Copy]

service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    [Copy]
```

### 2️⃣ Open Your `.env` File

In your project root: `D:\Sam - Thinksolv\File-uploader-pro\.env`

If the file doesn't exist, create it!

### 3️⃣ Add These Lines

Add to your `.env` file (below your existing DATABASE_URL):

```env
# Supabase API Keys (Optional - for Supabase Storage/Auth/Realtime features)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
```

**Replace:**
- `https://xxxxxxxxxxxxx.supabase.co` with your Project URL
- `your_anon_key_here` with your anon/public key

### 4️⃣ Full Example `.env` File

Your complete `.env` should look like this:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Supabase Database Connection (Required)
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# Supabase API Keys (Optional)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 5️⃣ Restart Your Dev Server

```bash
# Stop the server (Ctrl + C)
# Then restart
npm run dev
```

---

## 🤔 Do You Actually Need These API Keys?

### ✅ **You DON'T need them right now because:**
- Your app uses Prisma to connect to the database
- You're already using Google Drive for file storage
- Your current setup works fine without them

### 🔧 **You WOULD need them if you want to:**
- Use Supabase Storage (instead of Google Drive)
- Use Supabase Auth (instead of NextAuth)
- Add real-time features
- Use Supabase Edge Functions

### 💡 **Recommendation:**
**Save the keys in `.env` for future use**, but know that your app will work perfectly fine without them for now!

---

## 🔒 Security Notes

### Safe to Share (Client-side):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Never Share (Server-side only):
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (don't add this unless you specifically need it)
- ❌ `DATABASE_URL`
- ❌ `DIRECT_URL`
- ❌ Never commit `.env` to Git

---

## 📸 Visual Guide

```
Supabase Dashboard
├── Settings ⚙️
│   └── API
│       ├── 📋 Project URL
│       │   └── Copy this → NEXT_PUBLIC_SUPABASE_URL
│       │
│       └── 📋 API Keys
│           ├── anon public
│           │   └── Copy this → NEXT_PUBLIC_SUPABASE_ANON_KEY
│           │
│           └── service_role secret
│               └── DON'T need this yet
```

---

## ❓ Still Have Questions?

**Q: Where exactly is the `.env` file?**  
A: `D:\Sam - Thinksolv\File-uploader-pro\.env` (create it if it doesn't exist)

**Q: My app works without these keys. Why?**  
A: Because you're using Prisma for the database. These keys are for extra Supabase features.

**Q: Should I add the service_role key?**  
A: No, not unless you specifically need it. The anon key is sufficient for most uses.

**Q: Will adding these keys break anything?**  
A: No! They're optional and won't affect your current setup.

---

## ✅ Summary

1. Get keys from: **Supabase Dashboard** → **Settings** → **API**
2. Add to: `.env` file in project root
3. Restart: `npm run dev`
4. That's it! ✨

---

**For more details:** See `documentation/SUPABASE_API_KEYS.md`

