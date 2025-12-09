# 🔧 Fix API Key Restrictions - 403 Error

## The Problem

Even though:
- ✅ Google Picker API is enabled
- ✅ API key exists (`AIzaSyCQom...`)
- ✅ Same project as OAuth
- ❌ Still getting **403 Forbidden**

**This means:** Your API key **restrictions** are blocking the request!

---

## 🎯 Solution: Check API Key Restrictions

### Step 1: Open Your API Key Settings

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Find your API key (starts with `AIzaSyCQom...`)
3. **Click on it** to edit

---

### Step 2: Check "API Restrictions"

**Look for this section:** "API restrictions"

**You'll see one of these:**

#### Option A: "Don't restrict key" ✅
- This is fine! Skip to Step 3.

#### Option B: "Restrict key" ❌
- **Check the list below**
- **Is "Google Picker API" in the list?**
  - ✅ **YES** → Skip to Step 3
  - ❌ **NO** → **This is your problem!**

**If Google Picker API is NOT in the list:**
1. Click **"Select APIs"** or **"Edit"**
2. Check the box for: ✅ **Google Picker API**
3. Click **"Save"**
4. Wait 1-2 minutes
5. Try picker again

---

### Step 3: Check "Application Restrictions"

**Look for this section:** "Application restrictions"

**You'll see one of these:**

#### Option A: "None" ✅
- This is fine! Skip to Step 4.

#### Option B: "HTTP referrers (web sites)" ⚠️
- **Check the list below**
- **Do you see these URLs?**
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`

**If NOT present:**
1. Click **"Add an item"**
2. Add: `http://localhost:3000/*`
3. Add: `http://127.0.0.1:3000/*`
4. Click **"Save"**
5. Wait 1-2 minutes
6. Try picker again

#### Option C: "IP addresses" ❌
- **This won't work for localhost!**
- Change to "HTTP referrers" or "None"

---

## 🚀 Quick Fix: Create Unrestricted Test Key

**To quickly test if restrictions are the issue:**

1. Go to: **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. **Don't restrict anything** (leave both as "None")
4. Copy the new key
5. Update `.env`:
   ```env
   NEXT_PUBLIC_GOOGLE_API_KEY="NEW_UNRESTRICTED_KEY_HERE"
   ```
6. Restart dev server: `npm run dev`
7. Hard refresh browser: **Ctrl + Shift + R**
8. Try picker again

**If this works:**
- Restrictions were the problem!
- Now properly configure restrictions:
  1. API restrictions: Only Google Picker API
  2. Application restrictions: `http://localhost:3000/*`

---

## 📋 Complete Checklist

Check your API key has:

- [ ] **API Restrictions:**
  - ✅ "Don't restrict key" OR
  - ✅ "Restrict key" with **Google Picker API** included

- [ ] **Application Restrictions:**
  - ✅ "None" OR
  - ✅ "HTTP referrers" with `http://localhost:3000/*` included

---

## 🔍 Visual Guide

**Correct API Key Configuration:**

```
API restrictions
☑ Restrict key
  └─ ☑ Google Picker API

Application restrictions  
☑ HTTP referrers (web sites)
  └─ http://localhost:3000/*
  └─ http://127.0.0.1:3000/*
```

**OR for testing:**

```
API restrictions
☑ Don't restrict key

Application restrictions
☑ None
```

---

## 🧪 Test Your API Key

**In browser console (F12), run:**

```javascript
// Replace with your actual API key
const API_KEY = 'AIzaSyCQom...';

// Test API key with Google Picker
fetch(`https://www.googleapis.com/discovery/v1/apis/picker/v1/rest?key=${API_KEY}`)
    .then(r => {
        console.log('Status:', r.status);
        if (r.status === 200) {
            console.log('✅ API Key works!');
        } else if (r.status === 403) {
            console.log('❌ 403 - Check API restrictions!');
        }
        return r.json();
    })
    .then(data => console.log('Response:', data))
    .catch(err => console.error('Error:', err));
```

**Expected:**
- Status 200 = ✅ Key works
- Status 403 = ❌ Restrictions blocking it

---

## 💡 Most Common Issue

**90% of the time:** API key is restricted to specific APIs, but **Google Picker API is NOT included**.

**Fix:** Add Google Picker API to the restrictions list!

---

## 🎯 Action Steps

1. **Go to API key settings**
2. **Check "API restrictions"** - Add Google Picker API if missing
3. **Check "Application restrictions"** - Add localhost if missing
4. **Save changes**
5. **Wait 2 minutes**
6. **Restart dev server**
7. **Try picker again**

---

**The 403 error is almost certainly API key restrictions!** Check them now! 🎯

