# 🔴 FIX 403 ERROR - Google Picker Not Opening

## ✅ Good News from Your Console:
- ✅ API Key is loaded: `AIzaSyCQom...`
- ✅ Google Picker API script loaded successfully
- ❌ **403 Forbidden** from Google

## 🎯 The Problem:
Google is **rejecting your API key** even though it's loaded. This means:

### Most Likely Causes:

#### 1. **Google Picker API Not Enabled** (90% of cases)
Your API key exists, but Google Picker API isn't enabled in your project.

#### 2. **API Key Restrictions Too Strict**
Your API key might be restricted to wrong domains or APIs.

#### 3. **API Key and OAuth from Different Projects**
Your API key and OAuth credentials are from different Google Cloud projects.

---

## ✅ SOLUTION - Step by Step:

### **Step 1: Enable Google Picker API** ⭐ MOST IMPORTANT

1. Go to: **https://console.cloud.google.com/apis/library**
2. Make sure you're in the **SAME project** where your OAuth credentials are
3. Search for: **"Google Picker API"**
4. Click on **Google Picker API**
5. Click **"ENABLE"** button (big blue button)
6. Wait 1-2 minutes for it to activate

**Verify it's enabled:**
- Go to: **APIs & Services** → **Enabled APIs & services**
- You should see "Google Picker API" in the list

---

### **Step 2: Check API Key Restrictions**

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find your API key (the one starting with `AIzaSyCQom...`)
3. Click on it to edit

**Check "Application restrictions":**
- If set to "HTTP referrers", make sure it includes:
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`
- **OR** for testing, temporarily set to **"None"**

**Check "API restrictions":**
- Should include: ✅ **Google Picker API**
- **OR** for testing, set to **"Don't restrict key"**

4. Click **"SAVE"**

---

### **Step 3: Verify Same Project**

**Check OAuth Credentials:**
1. Go to: **APIs & Services** → **Credentials**
2. Find your **OAuth 2.0 Client ID**
3. Note which **Project** it's in (shown at top of page)

**Check API Key:**
1. Click on your API key
2. Make sure it's in the **SAME project** as OAuth

**If different projects:**
- Create a NEW API key in the same project as OAuth
- Update `.env` with the new key
- Restart dev server

---

### **Step 4: Test with Unrestricted Key (Quick Test)**

**To quickly test if restrictions are the issue:**

1. Go to: **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. **Don't restrict it** (leave as "None" for both restrictions)
4. Copy the new key
5. Update `.env`:
   ```env
   NEXT_PUBLIC_GOOGLE_API_KEY="NEW_UNRESTRICTED_KEY_HERE"
   ```
6. Restart dev server: `npm run dev`
7. Hard refresh browser: **Ctrl + Shift + R**
8. Try picker again

**If this works**, then restrictions were the issue. You can then properly restrict the key.

---

## 🔍 Quick Diagnostic:

### Check 1: Is Google Picker API Enabled?

Go to: **https://console.cloud.google.com/apis/library/picker.googleapis.com**

**Should show:** "API enabled" ✅  
**If shows:** "Enable" button → Click it!

---

### Check 2: Test API Key Directly

**In browser console (F12), run:**

```javascript
// Replace with your actual API key
const API_KEY = 'AIzaSyCQom...';

// Test if key can access Picker API
fetch(`https://www.googleapis.com/discovery/v1/apis/picker/v1/rest?key=${API_KEY}`)
    .then(r => {
        console.log('Status:', r.status);
        return r.json();
    })
    .then(data => {
        console.log('✅ API Key works!', data);
    })
    .catch(err => {
        console.error('❌ API Key error:', err);
    });
```

**Expected:**
- Status 200 = ✅ Key works
- Status 403 = ❌ API not enabled or key restricted

---

## 📋 Complete Checklist:

- [ ] Google Picker API **ENABLED** in Cloud Console
- [ ] API key and OAuth from **SAME project**
- [ ] API key restrictions allow `localhost:3000`
- [ ] Dev server **restarted** after any changes
- [ ] Browser **hard refreshed** (Ctrl + Shift + R)
- [ ] Signed in with Google OAuth

---

## 🚀 Most Likely Fix (Try This First):

**90% chance this will fix it:**

1. **Enable Google Picker API:**
   - https://console.cloud.google.com/apis/library
   - Search "Google Picker API"
   - Click **ENABLE**

2. **Wait 2 minutes**

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Hard refresh browser:** Ctrl + Shift + R

5. **Try picker again**

---

## 🆘 Still Not Working?

**Check these in Google Cloud Console:**

### Screenshot 1: Enabled APIs
- Go to: **APIs & Services** → **Enabled APIs & services**
- Take screenshot showing if "Google Picker API" is listed

### Screenshot 2: API Key Details
- Go to: **APIs & Services** → **Credentials**
- Click your API key
- Take screenshot of restrictions

### Screenshot 3: OAuth Project
- Go to: **APIs & Services** → **Credentials**
- Click your OAuth client
- Note the project name at top

**Then verify:**
- ✅ All three are in the same project
- ✅ Google Picker API is enabled
- ✅ API key restrictions allow localhost

---

## 💡 Pro Tip:

**Create a completely new, unrestricted API key for testing:**

1. Create new API key (no restrictions)
2. Add to `.env`
3. Restart server
4. Test

**If it works**, then gradually add restrictions:
1. First: Restrict to Google Picker API only
2. Then: Add HTTP referrer restrictions
3. Test after each step

---

**The 403 error means Google is rejecting your request. Most likely: Google Picker API isn't enabled!** 🎯

