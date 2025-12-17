# 🔧 Fix Google Picker 403 Error

## The Problem
You're getting a **403 Forbidden** error when trying to select a Google Drive folder. This means:
- ❌ Google Picker API is not enabled
- ❌ Google API Key is missing

## ✅ Solution (5 minutes)

### Step 1: Enable Google Picker API

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Make sure you're in the **same project** where you created OAuth credentials
3. Click **APIs & Services** → **Library**
4. Search for **"Google Picker API"**
5. Click on **Google Picker API**
6. Click **ENABLE** button

✅ Wait 1-2 minutes for the API to activate

---

### Step 2: Create an API Key

1. Still in Google Cloud Console
2. Go to **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** at the top
4. Select **API Key**
5. A popup appears with your new API key - **Copy it!**

Example: `AIzaSyB1234567890abcdefghijklmnopqrstuvwx`

---

### Step 3: (Recommended) Restrict the API Key

For security, restrict what this key can do:

1. Click on the API key you just created (or click **RESTRICT KEY** in the popup)
2. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Click **ADD AN ITEM**
   - Add: `http://localhost:3000/*` (for development)
   - Add: `https://yourdomain.com/*` (for production, when you deploy)
3. Under **API restrictions**:
   - Select **Restrict key**
   - Check only: ✅ **Google Picker API**
4. Click **SAVE**

---

### Step 4: Add API Key to Your `.env` File

Open your `.env` file and add:

```env
# Google Picker API Key
NEXT_PUBLIC_GOOGLE_API_KEY="AIzaSyB1234567890abcdefghijklmnopqrstuvwx"
```

**Your complete `.env` should include:**

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Google Picker API Key (NEW - Add this!)
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyB...

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Supabase Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

---

### Step 5: Restart Your Dev Server

**Important:** You MUST restart for the new environment variable to load!

```bash
# Stop the server (Ctrl + C in terminal)
# Then restart
npm run dev
```

Or use the terminals view in your IDE and restart the dev server.

---

### Step 6: Test It

1. Go to http://localhost:3000
2. Login with Google
3. Go to **Dashboard** → **Create/Edit Form**
4. Enable **"Google Drive Integration"**
5. Click **"Select Folder"** button
6. ✅ Google Picker should open without 403 error!

---

## 🔍 Verify Setup Checklist

Make sure you have:

- [ ] ✅ Google Picker API enabled in Google Cloud Console
- [ ] ✅ API Key created
- [ ] ✅ API Key restricted to Google Picker API (recommended)
- [ ] ✅ `NEXT_PUBLIC_GOOGLE_API_KEY` added to `.env` file
- [ ] ✅ Dev server restarted

---

## 🎯 Quick Reference: APIs You Need

In **Google Cloud Console** → **APIs & Services** → **Library**, make sure these are **ENABLED**:

| API | Status | Purpose |
|-----|--------|---------|
| **Google Drive API** | ✅ Enabled | Upload files to Drive |
| **Google People API** | ✅ Enabled | Get user info |
| **Google Picker API** | ✅ Enabled | Select folders |

---

## ❌ Common Errors & Solutions

### Error: "Failed to load resource: 403"
**Solution:** Enable Google Picker API in Google Cloud Console

### Error: "Invalid API key"
**Solution:** 
- Check the API key in `.env` is correct
- Make sure it's not restricted to wrong APIs
- Try creating a new unrestricted key for testing

### Error: "API key not valid. Please pass a valid API key."
**Solution:**
- API key might be restricted to wrong HTTP referrers
- In Cloud Console, edit the key and add `http://localhost:3000/*`

### Picker still doesn't work after adding key
**Solution:**
- Make sure you **restarted the dev server**
- Clear browser cache (Ctrl + Shift + R)
- Check browser console for other errors

### Error: "The API key and the authentication credential are from different projects"
**Solution:**
- Make sure your API key and OAuth credentials are from the **same** Google Cloud project
- Check which project you're in at the top of Google Cloud Console

---

## 🔒 Security Best Practices

### ✅ DO:
- Restrict API key to only Google Picker API
- Add HTTP referrer restrictions
- Use different keys for dev and production
- Don't commit `.env` to git

### ❌ DON'T:
- Share your API key publicly
- Use unrestricted keys in production
- Hardcode the key in your source code

---

## 📸 Visual Guide

### Where to Find APIs:
```
Google Cloud Console
└── APIs & Services
    ├── Library            ← Enable APIs here
    ├── Credentials        ← Create API Key here
    └── Enabled APIs & services  ← Verify what's enabled
```

### What Your Credentials Page Should Look Like:
```
Credentials

API Keys
├── 🔑 API Key 1
│   Name: Browser key
│   Restrictions: HTTP referrers, Google Picker API

OAuth 2.0 Client IDs
├── 🔐 OAuth 2.0 Client
│   Name: Web client
│   Type: Web application
```

---

## 🚀 After Setup

Once the 403 error is fixed, you'll be able to:
- ✅ Click "Select Folder" button
- ✅ See Google Drive folder picker
- ✅ Browse your Drive folders
- ✅ Select a destination folder
- ✅ Uploaded files will go to that folder

---

## 📞 Still Having Issues?

1. Check browser console for detailed error messages
2. Verify all three Google APIs are enabled
3. Try creating a brand new API key (unrestricted for testing)
4. Make sure you're using the same Google account that owns the Cloud project
5. Check the detailed guide: `documentation/GOOGLE_PICKER_SETUP.md`

---

**Need the API key ASAP?**

Quick steps:
1. https://console.cloud.google.com/apis/credentials
2. Create Credentials → API Key
3. Copy it
4. Add to `.env`: `NEXT_PUBLIC_GOOGLE_API_KEY="your_key"`
5. Restart dev server

✅ Done! The 403 error should be gone!

