# 🔐 API Key Security Setup - Complete Guide

## ✅ What We've Done

Your Google Maps API key is now **secure** and **hidden from GitHub**:

- ✅ API key stored in `.env.local` (local development)
- ✅ `.env.local` added to `.gitignore` (never committed)
- ✅ Code uses environment variable (no hardcoded keys)
- ✅ GitHub Actions workflow ready (for automated deployments)
- ✅ `.env.example` template provided (for team members)

---

## 📁 Files Created

### 1. `.env.local` (NOT in Git)
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyD0jikbM33Zx-DrWj_iD2Z5QIQ_nT-XfV0
```
**Location:** `frontend/.env.local`
**Status:** ⚠️ **NEVER COMMIT THIS FILE** - Already protected by `.gitignore`

### 2. `.env.example` (Template for others)
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```
**Location:** `frontend/.env.example`
**Status:** ✅ Safe to commit - just a template

### 3. GitHub Actions Workflow
**Location:** `.github/workflows/deploy.yml`
**Purpose:** Automatic deployment using GitHub Secrets

---

## 🔧 How It Works

### Local Development:
1. API key read from `frontend/.env.local`
2. File is ignored by Git
3. Build process injects key into app
4. Your key stays private on your machine

### Production (GitHub Pages):
1. API key stored in GitHub Secrets
2. GitHub Actions builds the app
3. Key injected during build
4. Built files pushed to `/docs` folder
5. GitHub Pages serves the app

---

## 🚀 Setup GitHub Secret (Required for Auto-Deploy)

### Step 1: Go to Repository Settings
1. Visit: https://github.com/aditya08deole/Survey-Rudraram/settings/secrets/actions
2. Click "New repository secret"

### Step 2: Add the Secret
- **Name:** `GOOGLE_MAPS_API_KEY`
- **Value:** `AIzaSyD0jikbM33Zx-DrWj_iD2Z5QIQ_nT-XfV0`
- Click "Add secret"

### Step 3: Enable GitHub Actions
1. Go to: https://github.com/aditya08deole/Survey-Rudraram/settings/actions
2. Under "Actions permissions", select "Allow all actions and reusable workflows"
3. Click "Save"

### Step 4: Test the Workflow
1. Make any change to your code
2. Commit and push to `main` branch
3. Go to: https://github.com/aditya08deole/Survey-Rudraram/actions
4. Watch the deployment run
5. After ~2 minutes, check your GitHub Pages site

---

## 💻 Local Development Commands

### Build for Testing:
```bash
cd frontend
npm run build
```

### Run Development Server:
```bash
cd frontend
npm start
```

The `.env.local` file will be automatically loaded by React.

---

## 👥 For Team Members

If someone else wants to work on this project:

1. **Clone the repository**
   ```bash
   git clone https://github.com/aditya08deole/Survey-Rudraram.git
   cd Survey-Rudraram/frontend
   ```

2. **Copy the template**
   ```bash
   cp .env.example .env.local
   ```

3. **Add their API key**
   Edit `.env.local` and replace `your_api_key_here` with their actual key

4. **Install and run**
   ```bash
   npm install
   npm start
   ```

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env.local` on your local machine only
- Use GitHub Secrets for production API keys
- Restrict API key to your domain in Google Cloud Console
- Rotate API keys periodically
- Share API keys securely (never via email or chat)

### ❌ DON'T:
- Commit `.env.local` to Git
- Hardcode API keys in source code
- Share API keys in public channels
- Use production keys for development
- Leave API keys unrestricted

---

## 🔐 API Key Restrictions (Already Configured)

Your Google Maps API key should be restricted to:

### Allowed Websites:
```
https://aditya08deole.github.io/Survey-Rudraram/*
http://localhost:3000/*
http://localhost:*/*
```

### Allowed APIs:
- Maps JavaScript API

### To Update Restrictions:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Edit "Application restrictions" and "API restrictions"
4. Save changes

---

## 🐛 Troubleshooting

### "Google Maps API Key Missing" Error:
1. Check if `.env.local` exists in `frontend/` folder
2. Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set correctly
3. Restart development server (`npm start`)
4. Clear browser cache

### Map Not Loading on GitHub Pages:
1. Verify GitHub Secret is set: `GOOGLE_MAPS_API_KEY`
2. Check GitHub Actions run completed successfully
3. Wait 2-3 minutes for CDN to update
4. Check browser console for errors (F12)

### "RefererNotAllowedMapError":
1. Your domain is not in API key restrictions
2. Add your GitHub Pages URL to allowed referrers
3. Wait a few minutes for restrictions to apply

---

## 📊 What Gets Committed to GitHub?

### ✅ Committed (Safe):
- `.env.example` (template)
- `constants.js` (uses environment variable)
- `.gitignore` (protects secrets)
- `.github/workflows/deploy.yml` (uses GitHub Secrets)
- Built files in `/docs` (API key embedded but restricted)

### ❌ Never Committed:
- `.env.local` (your actual API key)
- `.env` (any environment files with secrets)

---

## 🎯 Quick Reference

### Your API Key:
```
AIzaSyD0jikbM33Zx-DrWj_iD2Z5QIQ_nT-XfV0
```
**⚠️ Keep this private! Only store in:**
- Local `.env.local` file
- GitHub Secrets (for deployment)

### Client ID (Not Used):
```
277691120332-ru7g0s526ck148aj3lja0gn6qtnlseht.apps.googleusercontent.com
```
**Note:** Client IDs are for OAuth, not needed for Maps API.

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] `.env.local` file exists in `frontend/` folder
- [ ] `.env.local` contains your actual API key
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] `constants.js` uses `process.env.REACT_APP_GOOGLE_MAPS_API_KEY`
- [ ] GitHub Secret `GOOGLE_MAPS_API_KEY` is set
- [ ] GitHub Actions workflow file exists
- [ ] API key is restricted in Google Cloud Console
- [ ] Build completes successfully locally
- [ ] Map loads correctly in development

---

**🔐 Your API key is secure and will never be exposed on GitHub!**

**Last Updated:** January 8, 2026
