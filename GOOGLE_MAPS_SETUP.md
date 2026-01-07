# 🗺️ Google Maps Setup - IMPORTANT!

## ⚠️ API Key Required

Your app now uses **Google Maps API** instead of Leaflet/OpenStreetMap.

### Current Status:
- ✅ Leaflet removed
- ✅ OpenStreetMap removed
- ✅ Google Maps API installed
- ⚠️ **PLACEHOLDER API KEY** - needs to be replaced!

---

## 🔑 Get Your Google Maps API Key

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create/Select Project
1. Click "Select a Project" dropdown
2. Click "New Project"
3. Name: "Rudraram Survey"
4. Click "Create"

### Step 3: Enable Google Maps API
1. Go to: https://console.cloud.google.com/apis/library
2. Search for: "Maps JavaScript API"
3. Click on it
4. Click "Enable"

### Step 4: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS"
3. Select "API Key"
4. Copy your new API key

### Step 5: Restrict API Key (Recommended)
1. Click "Edit API key" (pencil icon)
2. Under "Website restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `https://aditya08deole.github.io/Survey-Rudraram/*`
   - Add: `http://localhost:3000/*` (for development)
3. Under "API restrictions":
   - Select "Restrict key"
   - Check "Maps JavaScript API"
4. Click "Save"

---

## 📝 Update Your Code

### File to Edit:
`frontend/src/utils/constants.js`

### Find this line:
```javascript
googleMapsApiKey: 'AIzaSyBZ8Q8xQqYKZ8xZ8xZ8xZ8xZ8xZ8xZ8xZ8x' // Replace with actual API key
```

### Replace with your actual key:
```javascript
googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'
```

---

## 🔄 After Adding API Key

### 1. Build the app:
```bash
cd frontend
npm run build
```

### 2. Commit and push:
```bash
cd ..
git add .
git commit -m "Add Google Maps API key"
git push origin main
```

### 3. Wait 2 minutes for GitHub Pages to update

---

## 💰 Pricing

Google Maps offers **FREE usage**:
- **$200 monthly credit** (enough for most small projects)
- First 28,000 map loads per month = FREE
- Your project should stay well within free tier

### Enable Billing:
You need to add a credit card to enable the API, but won't be charged unless you exceed the free $200/month credit.

---

## 🎨 Map Features Now Available

With Google Maps API you get:
- ✅ **Satellite imagery** (high quality)
- ✅ **Street view** integration
- ✅ **Terrain** views
- ✅ **Custom markers** (working)
- ✅ **Info windows** (popup details)
- ✅ **Better performance** vs OpenStreetMap
- ✅ **Regular updates** to satellite imagery

---

## 🐛 Troubleshooting

### "This page can't load Google Maps correctly"
- Your API key is invalid or missing
- API not enabled in Google Cloud Console
- Domain restrictions blocking your site

### Map shows gray tiles
- API key quota exceeded (unlikely with free tier)
- Network connectivity issue
- Check browser console for errors

### "Google Maps JavaScript API error: RefererNotAllowedMapError"
- API key domain restrictions are too strict
- Add your GitHub Pages URL to allowed referrers
- Add `*` for testing (not recommended for production)

---

## 📞 Support

- Google Maps API Docs: https://developers.google.com/maps/documentation/javascript
- Pricing Calculator: https://mapsplatform.google.com/pricing/
- Support: https://developers.google.com/maps/support

---

## 🚀 Quick Start (Summary)

1. Get API key from Google Cloud Console
2. Edit `frontend/src/utils/constants.js`
3. Replace placeholder key with your actual key
4. Run `npm run build` in frontend folder
5. Commit and push to GitHub
6. Wait 2 minutes - your map will work!

---

**Updated:** January 8, 2026
