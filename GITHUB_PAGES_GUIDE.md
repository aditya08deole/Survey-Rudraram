# Rudraram Survey - GitHub Pages Deployment Guide

## 🎉 Your Dashboard is Now Live!

**Live URL:** https://aditya08deole.github.io/Rudraram-Survey/

## ✅ What We Built

A **fully static website** hosted on **GitHub Pages** that reads Excel data directly from your GitHub repository - **no backend server required!**

### Architecture Changes:
- ❌ **Before**: Node.js backend → API endpoints → React frontend
- ✅ **Now**: GitHub repository → Excel file → React frontend (pure client-side)

## 📁 How It Works

### 1. Excel File Location
Your Excel file is stored at:
```
backend/data/rudraram_survey.xlsx
```

### 2. Client-Side Reading
The browser fetches the Excel file from:
```
https://raw.githubusercontent.com/aditya08deole/Rudraram-Survey/main/backend/data/rudraram_survey.xlsx
```

### 3. Data Parsing
- Uses **SheetJS (xlsx)** library to parse Excel in the browser
- Reads the **"All"** sheet specifically
- Parses all 60 devices with their properties
- No server processing needed!

## 🔄 How to Update Data

### Option 1: Direct GitHub Edit
1. Go to: https://github.com/aditya08deole/Rudraram-Survey
2. Navigate to: `backend/data/rudraram_survey.xlsx`
3. Click **"Upload files"** or edit icon
4. Replace the Excel file
5. Commit changes
6. **Website updates automatically** (within 1-2 minutes)

### Option 2: Local Edit & Push
1. Edit `backend/data/rudraram_survey.xlsx` locally
2. Save changes
3. Run:
   ```bash
   git add backend/data/rudraram_survey.xlsx
   git commit -m "Update survey data"
   git push origin main
   ```
4. Wait 1-2 minutes for GitHub CDN to refresh

### Option 3: Using Git Desktop
1. Edit the Excel file locally
2. Open GitHub Desktop
3. See the changed file listed
4. Write a commit message
5. Click "Commit to main"
6. Click "Push origin"

## 📊 Excel File Requirements

### Required Columns (Must Have):
- `Survey Code (ID)` - Unique identifier
- `Zone` - One of: SC Colony, Village, Waddera
- `Device Type` - One of: Borewell, Sump, OHT
- `Status` - One of: Working, Not Work, Failed

### Optional Columns (For Full Features):
- `Lat` - Latitude (for map display)
- `Long` - Longitude (for map display)
- `Street Name / Landmark` - Location description
- `Houses Conn.` - Number of houses connected
- `Pipe Size (inch)` - Pipe diameter
- `Motor HP / Cc` - Motor specifications
- `Notes / Maintenance Issue` - Any notes
- `Images` - Comma-separated image URLs

### Excel File Format:
```
Sheet Name: "All"
Format: .xlsx (Excel Workbook)
Encoding: UTF-8
```

## 🚀 Deployment Commands

### Deploy New Version
```bash
cd frontend
npm run deploy
```

This will:
1. Build optimized production files
2. Create/update `gh-pages` branch
3. Push to GitHub Pages
4. Website updates in 1-2 minutes

### Full Update Workflow
```bash
# Make code changes
git add .
git commit -m "Your update message"
git push origin main

# Deploy to GitHub Pages
cd frontend
npm run deploy
```

## 🔧 Configuration Files

### 1. `frontend/package.json`
```json
{
  "homepage": "https://aditya08deole.github.io/Rudraram-Survey",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 2. `frontend/src/services/excelReader.js`
```javascript
const GITHUB_CONFIG = {
  username: 'aditya08deole',
  repository: 'Rudraram-Survey',
  branch: 'main',
  excelPath: 'backend/data/rudraram_survey.xlsx'
};
```

**To change Excel file location**, update `excelPath` in this file.

## 🌐 GitHub Pages Settings

Your repository settings (already configured):
1. Go to: https://github.com/aditya08deole/Rudraram-Survey/settings/pages
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **/ (root)**

## 📱 Features Available

### ✅ Working Features:
- **Dashboard** - Overview with statistics
- **Map View** - Interactive map (once coordinates are added)
- **Table View** - Sortable, filterable device list
- **Device Details** - Full info panel for each device
- **Export** - Download data as Excel/CSV
- **Responsive** - Works on mobile, tablet, desktop

### 📍 Adding GPS Coordinates:
Currently 0/60 devices have coordinates. To enable map view:
1. Visit each device location with GPS
2. Note latitude and longitude
3. Add to Excel `Lat` and `Long` columns
4. Save and push Excel file
5. Map markers appear automatically!

## 🎨 Customization

### Change Colors/Theme:
Edit: `frontend/src/components/**/*.css`

### Change Title:
Edit: `frontend/public/index.html`

### Change Logo:
Replace: `frontend/public/logo.png`

## 🔍 Troubleshooting

### "Error Loading Data" on Website:
1. Check Excel file exists at: `backend/data/rudraram_survey.xlsx`
2. Verify sheet named "All" exists
3. Check browser console (F12) for errors
4. Wait 2-3 minutes after pushing changes

### Changes Not Appearing:
1. Clear browser cache (Ctrl+Shift+R)
2. Wait 2-3 minutes for GitHub CDN
3. Check if `git push` was successful
4. Verify Excel file was uploaded correctly

### Deployment Fails:
```bash
# Reinstall dependencies
cd frontend
npm install
npm run deploy
```

## 📊 Current Status

✅ **Deployed Successfully**
- URL: https://aditya08deole.github.io/Rudraram-Survey/
- Devices Loaded: 60
- Mapped Devices: 0 (add coordinates!)
- Last Updated: January 7, 2026

## 🎯 Next Steps

1. **Add GPS Coordinates** to Excel file for map visualization
2. **Add Device Images** as URLs in Excel "Images" column
3. **Share the Link** with stakeholders
4. **Update Data** regularly by editing Excel file
5. **Monitor Usage** via GitHub insights

## 💡 Benefits of This Setup

✅ **No Server Costs** - Free hosting on GitHub Pages
✅ **No Maintenance** - No server to manage
✅ **Easy Updates** - Just edit Excel and push
✅ **Fast** - Served via GitHub CDN globally
✅ **Reliable** - 99.9% uptime guaranteed by GitHub
✅ **Version Control** - Full history of changes
✅ **Simple** - No backend code to debug

## 📞 Support

For issues or questions:
1. Check browser console (F12 → Console tab)
2. Verify Excel file format matches requirements
3. Test with sample data first
4. Check GitHub Actions logs for build errors

---

**Built with React, Leaflet, SheetJS, and GitHub Pages** 🚀
**No Backend Required - Pure Client-Side Application** ⚡
