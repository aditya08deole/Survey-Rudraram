# 🚀 Rudraram Survey - GitHub Pages Deployment Guide

## ✅ Repository Setup Complete!

**New Repository:** https://github.com/aditya08deole/Survey-Rudraram
**Live URL (after setup):** https://aditya08deole.github.io/Survey-Rudraram/

---

## 📋 DEPLOYMENT STEPS (Using Main Branch `/docs` folder)

### Step 1: Enable GitHub Pages
1. Go to: https://github.com/aditya08deole/Survey-Rudraram/settings/pages
2. Under **"Source"**, select:
   - Branch: **main**
   - Folder: **/docs**
3. Click **Save**
4. **DO NOT** add a custom domain (leave it empty)
5. Wait 1-2 minutes for deployment

### Step 2: Verify Deployment
1. Visit: https://aditya08deole.github.io/Survey-Rudraram/
2. You should see the dashboard load
3. Check browser console (F12) for any errors

---

## 📁 How It Works

### Architecture:
```
GitHub Repository
├── backend/data/rudraram_survey.xlsx  ← Excel data source
├── frontend/                           ← React source code
└── docs/                               ← Built app (deployed to GitHub Pages)
```

### Data Flow:
1. **Excel File** stored at: `backend/data/rudraram_survey.xlsx`
2. **Browser fetches** from: `https://raw.githubusercontent.com/aditya08deole/Survey-Rudraram/main/backend/data/rudraram_survey.xlsx`
3. **Client-side parsing** using SheetJS (xlsx library)
4. **No backend server** required - 100% static site!

---

## 🔄 How to Update Data

### Update Excel File:
```bash
# Option 1: Direct GitHub Upload
1. Go to: https://github.com/aditya08deole/Survey-Rudraram/tree/main/backend/data
2. Click on rudraram_survey.xlsx
3. Click "Replace file" or upload new version
4. Commit changes
5. Wait 1-2 minutes - website updates automatically!

# Option 2: Local Update
1. Edit backend/data/rudraram_survey.xlsx locally
2. Save changes
3. Run:
   git add backend/data/rudraram_survey.xlsx
   git commit -m "Update survey data"
   git push origin main
4. Wait 1-2 minutes for update
```

---

## 🛠️ How to Update Code & Redeploy

### Full Update Process:
```bash
# 1. Make code changes in frontend/src/

# 2. Build production files
cd frontend
npm run build

# This automatically:
# - Creates optimized build in frontend/build/
# - Copies everything to /docs folder
# - Ready for GitHub Pages!

# 3. Commit and push
cd ..
git add .
git commit -m "Your update message"
git push origin main

# 4. Wait 1-2 minutes
# GitHub Pages automatically detects /docs changes and redeploys!
```

---

## 📊 Excel File Requirements

### Required Columns:
- `Survey Code (ID)` - Unique identifier
- `Zone` - SC Colony / Village / Waddera
- `Device Type` - Borewell / Sump / OHT
- `Status` - Working / Not Work / Failed

### Optional Columns (for full features):
- `Lat` - Latitude (for map display)
- `Long` - Longitude (for map display)
- `Street Name / Landmark`
- `Houses Conn.` - Number of houses
- `Pipe Size (inch)`
- `Motor HP / Cc`
- `Notes / Maintenance Issue`
- `Images` - Comma-separated image URLs

### Important:
- Sheet name must be: **"All"**
- Format: `.xlsx` (Excel Workbook)
- Current status: 60 devices, 0 with GPS coordinates

---

## 🗺️ Adding GPS Coordinates

To enable map visualization:
1. Visit each device location
2. Note GPS coordinates (use Google Maps or phone GPS)
3. Open Excel file
4. Add latitude to `Lat` column
5. Add longitude to `Long` column
6. Save and push Excel file
7. Map markers appear automatically!

---

## 🔧 Configuration Files

### 1. Repository Config
**File:** `frontend/src/services/excelReader.js`
```javascript
const GITHUB_CONFIG = {
  username: 'aditya08deole',
  repository: 'Survey-Rudraram',    // ✓ Updated
  branch: 'main',
  excelPath: 'backend/data/rudraram_survey.xlsx'
};
```

### 2. GitHub Pages URL
**File:** `frontend/package.json`
```json
{
  "homepage": "https://aditya08deole.github.io/Survey-Rudraram"
}
```

---

## ⚠️ Important Notes

### Custom Domain:
- **DO NOT** add custom domain unless you own a real domain
- Invalid domains like "rudraram" or "survey.rudra.ram.com" will break deployment
- If you want custom domain:
  1. Buy domain (e.g., rudraram.com)
  2. Configure DNS with provider
  3. Add to GitHub Pages settings
  4. GitHub creates CNAME file automatically

### CNAME File:
- **REMOVED** from /docs folder
- GitHub Pages will NOT try to use custom domain
- Site works on: https://aditya08deole.github.io/Survey-Rudraram/

---

## 🎯 Quick Commands Reference

```bash
# Check current repository
git remote -v

# Build and deploy
cd frontend
npm run build
cd ..
git add .
git commit -m "Deploy updates"
git push origin main

# Check deployment status
# Visit: https://github.com/aditya08deole/Survey-Rudraram/actions
```

---

## 🐛 Troubleshooting

### "Error Loading Data":
1. Check Excel exists: `backend/data/rudraram_survey.xlsx`
2. Verify "All" sheet exists
3. Check browser console (F12)
4. Wait 2-3 minutes after push

### Changes Not Showing:
1. Clear browser cache (Ctrl+Shift+R)
2. Wait 2-3 minutes for GitHub CDN
3. Check GitHub Actions for deployment status
4. Verify push was successful

### Build Errors:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📱 Features

✅ **Dashboard** - Statistics and overview
✅ **Map View** - Interactive Google Maps satellite
✅ **Table View** - Sortable, filterable device list
✅ **Device Details** - Complete information panel
✅ **Export** - Download as Excel/CSV
✅ **Responsive** - Mobile, tablet, desktop support
✅ **No Backend** - Pure client-side application

---

## 💡 Benefits

✅ **Free Hosting** - GitHub Pages is 100% free
✅ **No Server Costs** - No maintenance required
✅ **Easy Updates** - Just edit Excel and push
✅ **Fast** - CDN delivery worldwide
✅ **Reliable** - 99.9% uptime by GitHub
✅ **Version Control** - Complete change history
✅ **Simple** - No backend code complexity

---

## 📞 Support Checklist

Before asking for help:
1. ✓ Verify GitHub Pages is enabled (Settings → Pages)
2. ✓ Confirm source is set to "main" branch "/docs" folder
3. ✓ Check GitHub Actions for deployment logs
4. ✓ Clear browser cache
5. ✓ Wait 2-3 minutes after changes
6. ✓ Check browser console for errors (F12)

---

## 🎉 You're All Set!

Your dashboard is ready to deploy! Follow Step 1 above to enable GitHub Pages.

**Next Actions:**
1. ✅ Enable GitHub Pages (main → /docs)
2. ⏳ Wait 2 minutes
3. 🌐 Visit https://aditya08deole.github.io/Survey-Rudraram/
4. 📊 Add GPS coordinates to Excel
5. 📤 Share with stakeholders!

---

**Last Updated:** January 8, 2026
**Repository:** https://github.com/aditya08deole/Survey-Rudraram
