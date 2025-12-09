# 🚀 Quick Fix: Google Picker Not Working

## ✅ What I Just Fixed

1. **Automatic Token Refresh** - Tokens now refresh automatically if expired
2. **Better Error Messages** - Clear instructions when re-authentication is needed
3. **Improved Token Handling** - Checks database for refresh tokens

---

## 🔧 If Picker Still Doesn't Work - Do This:

### Step 1: Sign Out and Sign In Again (MOST IMPORTANT!)

**This is required to get the new `drive` scope permissions:**

1. Go to your app: http://localhost:3000
2. **Sign out** completely
3. **Clear browser cookies** for localhost (optional but recommended)
4. **Sign in with Google** again
5. **Grant Drive permissions** when Google asks
6. Try the picker again

---

### Step 2: Verify OAuth Consent Screen

1. Go to: **https://console.cloud.google.com/apis/credentials/consent**
2. Click **"EDIT APP"**
3. Go to **"Scopes"** page
4. Make sure you have: **`https://www.googleapis.com/auth/drive`**
5. If missing, add it and save

---

### Step 3: Check API Key

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find your API key
3. Click on it
4. Check:
   - **API restrictions**: Should include Google Picker API
   - **Application restrictions**: Should allow `http://localhost:3000/*`

---

### Step 4: Verify Google Picker API is Enabled

1. Go to: **https://console.cloud.google.com/apis/library**
2. Search **"Google Picker API"**
3. Should show **"API enabled"** ✅
4. If not, click **"ENABLE"**

---

## 🧪 Test the Fix

After signing out and signing in again:

1. Go to form editor
2. Enable "Google Drive Integration"
3. Click "Choose Custom Folder"
4. ✅ Picker should open!

---

## 📋 Quick Checklist

- [ ] Signed out and signed in again
- [ ] Granted Drive permissions
- [ ] Google Picker API enabled
- [ ] API key configured correctly
- [ ] OAuth Consent Screen has `drive` scope

---

## 🆘 Still Not Working?

**Check browser console (F12) for errors:**

- **403 Forbidden** → API key or OAuth scope issue
- **401 Unauthorized** → Need to re-authenticate
- **Token expired** → Sign out and sign in again

**The improved code will now:**
- ✅ Automatically refresh expired tokens
- ✅ Show clear error messages
- ✅ Guide you to re-authenticate if needed

---

**Most likely fix: Sign out and sign in again!** 🔄

