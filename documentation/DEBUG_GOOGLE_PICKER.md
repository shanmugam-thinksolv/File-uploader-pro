# 🔍 Debug Google Picker Not Opening

## Quick Diagnostic Steps

### Step 1: Check Browser Console

1. Open your app: http://localhost:3000
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try clicking "Choose Custom Folder"
5. Look for error messages

**Common errors you might see:**

#### ❌ "Google API Key is missing"
**Solution:** Add `NEXT_PUBLIC_GOOGLE_API_KEY` to `.env` and restart server

#### ❌ "Google Picker API not available"
**Solution:** The Google API script failed to load. Check your internet connection.

#### ❌ "Failed to get access token"
**Solution:** Sign out and sign in again with Google

#### ❌ "403 Forbidden" or "API key not valid"
**Solution:** 
- Enable Google Picker API in Google Cloud Console
- Check API key restrictions
- Make sure API key is from the same project as OAuth credentials

---

### Step 2: Verify Environment Variable

**In Browser Console, run this:**

```javascript
// Check if API key is available (it won't show the actual key for security)
console.log('API Key present:', !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
```

**Or check in Network tab:**
1. Open **Network** tab in DevTools
2. Filter by "picker"
3. Click "Choose Custom Folder"
4. Look for failed requests

---

### Step 3: Check API Key Configuration

**Verify in `.env` file:**

```env
NEXT_PUBLIC_GOOGLE_API_KEY="AIzaSyB..."  # Must have quotes!
```

**Common mistakes:**
- ❌ `NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyB...` (no quotes - breaks if key has special chars)
- ❌ Missing `NEXT_PUBLIC_` prefix
- ❌ Wrong variable name
- ❌ Forgot to restart dev server after adding

---

### Step 4: Test API Key Directly

**Create a test file:** `test-picker.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Google Picker Test</title>
</head>
<body>
    <button onclick="testPicker()">Test Picker</button>
    <script>
        function testPicker() {
            // Replace with your actual API key
            const API_KEY = 'YOUR_API_KEY_HERE';
            
            // Load Google API
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('picker', () => {
                    const picker = new window.google.picker.PickerBuilder()
                        .addView(window.google.picker.ViewId.FOLDERS)
                        .setDeveloperKey(API_KEY)
                        .setCallback((data) => {
                            console.log('Picker result:', data);
                        })
                        .build();
                    picker.setVisible(true);
                });
            };
            document.body.appendChild(script);
        }
    </script>
</body>
</html>
```

Open this file in browser and test. If it works here but not in your app, the issue is with Next.js environment variables.

---

### Step 5: Verify Google Cloud Console Setup

**Check these in Google Cloud Console:**

1. **APIs Enabled:**
   - ✅ Google Drive API
   - ✅ Google Picker API
   - ✅ Google People API

2. **API Key Restrictions:**
   - HTTP referrers: `http://localhost:3000/*`
   - API restrictions: Only Google Picker API

3. **OAuth Credentials:**
   - Same project as API key
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

---

### Step 6: Check Network Requests

**In Browser DevTools → Network tab:**

1. Click "Choose Custom Folder"
2. Look for these requests:

**✅ Should see:**
- `https://apis.google.com/js/api.js` - Status 200
- `https://accounts.google.com/...` - OAuth flow
- `https://docs.google.com/picker?...` - Picker window

**❌ If you see:**
- `403 Forbidden` on picker URL → API key issue
- `CORS error` → API key restrictions wrong
- `404 Not Found` → API not enabled

---

## 🔧 Common Fixes

### Fix 1: API Key Not Loading

**Problem:** `process.env.NEXT_PUBLIC_GOOGLE_API_KEY` is undefined

**Solution:**
1. Check `.env` file exists in project root
2. Variable name is exactly: `NEXT_PUBLIC_GOOGLE_API_KEY`
3. Value is in quotes: `"AIzaSyB..."`
4. **Restart dev server** after adding
5. Clear browser cache (Ctrl + Shift + R)

### Fix 2: Google Picker API Not Enabled

**Problem:** 403 error when opening picker

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library
2. Search "Google Picker API"
3. Click **ENABLE**
4. Wait 1-2 minutes
5. Try again

### Fix 3: API Key Restrictions Too Strict

**Problem:** Works in test file but not in app

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Change to "None" (for testing)
   - Or add: `http://localhost:3000/*` and `http://127.0.0.1:3000/*`
4. Save and try again

### Fix 4: Access Token Invalid

**Problem:** "Failed to get access token"

**Solution:**
1. Sign out of your app
2. Clear browser cookies for localhost
3. Sign in again with Google
4. Grant Drive permissions
5. Try picker again

### Fix 5: Wrong Project

**Problem:** API key and OAuth from different projects

**Solution:**
1. Check which project your OAuth credentials are in
2. Create API key in the **same** project
3. Update `.env` with new key

---

## 🧪 Step-by-Step Debugging

### Test 1: Is API Key in Environment?

**In terminal (where dev server is running):**
```bash
# Windows PowerShell
$env:NEXT_PUBLIC_GOOGLE_API_KEY

# Should show your API key
```

**If empty:** Add to `.env` and restart

### Test 2: Is Google API Loading?

**In browser console:**
```javascript
// Check if Google API loaded
console.log('gapi:', window.gapi);
console.log('google:', window.google);

// Should show objects, not undefined
```

### Test 3: Is Picker Ready?

**In browser console:**
```javascript
// After page loads, check picker
window.gapi.load('picker', () => {
    console.log('Picker loaded!');
    console.log('Picker available:', !!window.google.picker);
});
```

### Test 4: Test API Key Directly

**In browser console:**
```javascript
// Replace with your actual API key
const API_KEY = 'YOUR_API_KEY_HERE';

// Test if key works
fetch(`https://www.googleapis.com/picker/v1/views?key=${API_KEY}`)
    .then(r => r.json())
    .then(data => console.log('API Key test:', data))
    .catch(err => console.error('API Key error:', err));
```

---

## 📋 Complete Checklist

Before reporting an issue, verify:

- [ ] `.env` file exists in project root
- [ ] `NEXT_PUBLIC_GOOGLE_API_KEY` is set (with quotes)
- [ ] Dev server restarted after adding API key
- [ ] Google Picker API enabled in Cloud Console
- [ ] API key created in same project as OAuth
- [ ] API key restrictions allow `localhost:3000`
- [ ] Signed in with Google OAuth
- [ ] Browser console checked for errors
- [ ] Network tab checked for failed requests
- [ ] Tried clearing browser cache

---

## 🆘 Still Not Working?

**Collect this information:**

1. **Browser Console Errors** (screenshot)
2. **Network Tab** - Failed requests (screenshot)
3. **`.env` file** (hide actual API key, just show variable name)
4. **Google Cloud Console** - Enabled APIs (screenshot)
5. **Google Cloud Console** - API Key restrictions (screenshot)

**Then check:**
- Is the API key visible in browser? (it shouldn't be, but check console)
- Does the picker window appear at all?
- Any popup blockers?
- Incognito mode (to rule out extensions)?

---

## ✅ Expected Behavior

**When working correctly:**

1. Click "Choose Custom Folder"
2. Button shows "Loading..." briefly
3. Google Picker popup window opens
4. Shows your Google Drive folders
5. Select a folder
6. Folder name appears in the form
7. No errors in console

**If any step fails, check the error message in console!**

---

## 🎯 Quick Fix Commands

```bash
# 1. Verify .env file
cat .env | grep GOOGLE_API_KEY

# 2. Restart dev server
npm run dev

# 3. Clear Next.js cache
rm -rf .next
npm run dev

# 4. Check if API key is accessible
node -e "console.log(process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Key found' : 'Key missing')"
```

---

**Most common issue:** Forgot to restart dev server after adding API key! 🔄

