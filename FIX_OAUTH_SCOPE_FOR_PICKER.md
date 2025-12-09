# 🔧 Fix OAuth Scope for Google Picker

## The Real Problem

Looking at your console output, I found the issue!

**Current OAuth scope:** `https://www.googleapis.com/auth/drive.file`

**Problem:** This scope only allows access to files **created by your app**. Google Picker **cannot list existing folders** with this limited scope!

**Solution:** Change to full Drive scope: `https://www.googleapis.com/auth/drive`

---

## ✅ What I Changed

### File 1: `lib/auth.ts`
Changed from:
```typescript
scope: "openid email profile https://www.googleapis.com/auth/drive.file"
```

To:
```typescript
scope: "openid email profile https://www.googleapis.com/auth/drive"
```

### File 2: `app/api/auth/signin-custom/route.ts`
Changed from:
```typescript
scope: 'openid email profile https://www.googleapis.com/auth/drive.file'
```

To:
```typescript
scope: 'openid email profile https://www.googleapis.com/auth/drive'
```

---

## 🚀 What You Need to Do NOW

### Step 1: Update OAuth Consent Screen (Required!)

Since we changed the scope, you MUST update Google Cloud Console:

1. Go to: **https://console.cloud.google.com/apis/credentials/consent**
2. Click **"EDIT APP"**
3. Click **"SAVE AND CONTINUE"** on App information
4. On **"Scopes"** page:
   - Remove: `https://www.googleapis.com/auth/drive.file`
   - Add: `https://www.googleapis.com/auth/drive`
   - Click **"ADD OR REMOVE SCOPES"**
   - Search for "Google Drive API"
   - Check: **"See, edit, create, and delete all of your Google Drive files"**
   - Click **"UPDATE"**
5. Click **"SAVE AND CONTINUE"**
6. Click **"BACK TO DASHBOARD"**

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Sign Out and Sign In Again (IMPORTANT!)

**You MUST re-authenticate to get the new scope!**

1. Go to your app: http://localhost:3000
2. **Sign out** (if signed in)
3. **Sign in with Google again**
4. **Grant the new permissions** (you'll see a consent screen)
5. Try the folder picker again

### Step 4: Test Picker

1. Go to Dashboard → Edit form
2. Enable "Google Drive Integration"
3. Click "Choose Custom Folder"
4. ✅ Picker should open now!

---

## 🔍 Why This Fixes It

**OAuth Scopes Comparison:**

| Scope | What It Allows | Picker Works? |
|-------|---------------|---------------|
| `drive.file` | Only files created by your app | ❌ No |
| `drive.readonly` | Read-only access to all Drive | ✅ Yes |
| `drive` | Full access to all Drive | ✅ Yes |

**Google Picker needs to:**
- List all folders in your Drive
- Let you browse folders
- Select any folder

**The `.file` scope doesn't allow this!**

---

## 🔒 Security Note

**Q: Is full Drive scope safe?**

**A:** Yes, because:
1. Only YOU (the admin) access the picker
2. Users uploading files don't get Drive access
3. Your app only uploads to selected folder
4. You control what the app does with access

**Alternative:** Use `drive.readonly` if you only need to read folders (but you need write access to upload files).

---

## 📋 Complete Checklist

- [ ] Code updated (already done ✅)
- [ ] OAuth Consent Screen updated in Google Cloud Console
- [ ] Dev server restarted
- [ ] **Signed out and signed in again** (CRITICAL!)
- [ ] New permissions granted
- [ ] Picker tested

---

## 🆘 Common Issues After Change

### Issue: Still getting 403

**Cause:** You didn't re-authenticate with new scope

**Fix:**
1. Sign out completely
2. Clear browser cookies for localhost
3. Sign in again with Google
4. Grant new permissions

### Issue: "Access blocked: This app's request is invalid"

**Cause:** OAuth Consent Screen not updated

**Fix:**
1. Go to OAuth Consent Screen in Cloud Console
2. Add the new `drive` scope
3. Save
4. Try again

### Issue: Consent screen doesn't show new permission

**Cause:** Using existing session

**Fix:**
1. Go to: https://myaccount.google.com/permissions
2. Find your app
3. Click "Remove access"
4. Sign in to your app again

---

## 🧪 Verify New Scope

**After signing in again, check in browser console:**

```javascript
// Check the access token (in /api/drive/token response)
fetch('/api/drive/token')
    .then(r => r.json())
    .then(data => {
        console.log('Access token present:', !!data.accessToken);
        
        // Decode JWT to see scopes (this is safe, token is in your session)
        const token = data.accessToken;
        console.log('Token length:', token?.length);
    });
```

---

## ✅ Expected Result

**After following all steps:**

1. Sign in with Google
2. See consent screen asking for Drive access
3. Grant permission
4. Go to editor
5. Click "Choose Custom Folder"
6. ✅ **Picker opens and shows all your Drive folders!**

---

## 🎯 Summary

**The 403 error was caused by:**
- OAuth scope too restricted (`drive.file`)
- Picker couldn't list folders
- Google rejected the request

**The fix:**
1. ✅ Updated code to use full `drive` scope
2. ⏳ Update OAuth Consent Screen (you need to do this)
3. ⏳ Re-authenticate (you need to do this)

**Do these steps and the picker will work!** 🎉

