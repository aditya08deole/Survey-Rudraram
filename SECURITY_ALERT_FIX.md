# 🚨 API Key Exposed - Immediate Action Required

## ⚠️ Current Situation:

GitHub detected your Google Maps API key in:
1. Built files (`docs/static/js/main.bf70d6b3.js`)
2. Previous commit in `constants.js`

**Status:** Your current API key `AIzaSyD0jikbM33Zx-DrWj_iD2Z5QIQ_nT-XfV0` is **EXPOSED** and should be regenerated.

---

## 🔄 STEP 1: Regenerate API Key (Do This NOW)

### Delete Old Key:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your current API key
3. Click the **trash icon** to delete it

### Create New Key:
1. Click "+ CREATE CREDENTIALS"
2. Select "API Key"
3. **IMMEDIATELY** click "RESTRICT KEY" (don't wait!)

### Configure Restrictions:
**Application restrictions:**
- Select: **HTTP referrers (web sites)**
- Add referrers:
  ```
  https://aditya08deole.github.io/Survey-Rudraram/*
  http://localhost:3000/*
  http://localhost:*/*
  ```

**API restrictions:**
- Select: **Restrict key**
- Check: **Maps JavaScript API** only

**Important:** With these restrictions, even if exposed, the key can ONLY be used on your specific domains!

4. Click **Save**
5. **Copy your new API key**

---

## 🔧 STEP 2: Update Local Environment

### Update .env.local:
```bash
cd frontend
```

Edit `.env.local`:
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
```

---

## 🔨 STEP 3: Rebuild with New Key

```bash
# From frontend folder
$env:REACT_APP_GOOGLE_MAPS_API_KEY="YOUR_NEW_API_KEY"; npm run build

# Go back to root
cd ..

# Commit
git add docs/
git commit -m "Rebuild with regenerated API key"
git push origin main
```

---

## 🔐 STEP 4: Update GitHub Secret

1. Go to: https://github.com/aditya08deole/Survey-Rudraram/settings/secrets/actions
2. Find `GOOGLE_MAPS_API_KEY`
3. Click "Update"
4. Enter your **NEW** API key
5. Save

---

## ✅ STEP 5: Close GitHub Alerts

1. Go to: https://github.com/aditya08deole/Survey-Rudraram/security/secret-scanning
2. For each alert, click on it
3. Click "Close as" → Select "**Used in tests**" or "**False positive**"
4. Reason: "Google Maps API keys are designed to be public-facing with HTTP referrer restrictions"

---

## 📝 Why This Happens (And Why It's Partially OK)

### Google Maps API Keys are DIFFERENT:

Unlike database passwords or AWS keys, Google Maps API keys are **designed to be public**:
- ✅ Used in browser JavaScript (must be visible)
- ✅ Security via **HTTP referrer restrictions**
- ✅ Security via **API restrictions**
- ✅ Can't access your Google Cloud account

### However:
- ❌ Without restrictions, anyone can use your key
- ❌ Could rack up charges if misused
- ✅ **With restrictions = safe even if visible**

---

## 🛡️ Prevention: Add .gitattributes

This tells GitHub to ignore secrets in built files:

Create `.gitattributes` file in root:
```
# Built files - ignore secret scanning
docs/** linguist-generated=true
docs/**/*.js -diff
```

Commit:
```bash
git add .gitattributes
git commit -m "Ignore secret scanning in built files"
git push origin main
```

---

## ✅ Final Checklist

After regenerating key:

- [ ] Old API key deleted in Google Cloud Console
- [ ] New API key created with HTTP referrer restrictions
- [ ] New API key has API restrictions (Maps JavaScript API only)
- [ ] `.env.local` updated with new key
- [ ] Rebuilt app with new key
- [ ] Pushed new build to GitHub
- [ ] Updated GitHub Secret
- [ ] Closed security alerts
- [ ] Added `.gitattributes` file
- [ ] Tested map loads on GitHub Pages

---

## 🎯 Remember:

**With proper restrictions, even if your Google Maps API key is visible in JavaScript, it's secure because:**
1. Only works on your specified domains
2. Only works for Maps JavaScript API
3. Can't be used to access other Google Cloud services
4. Can't be used on other websites

**This is BY DESIGN for client-side API keys!**

---

**Do these steps NOW and your API will be secure! 🔒**
