# 🚀 Unified Dashboard Deployment Guide

**Deploy entire dashboard (Frontend + Backend) to Render in one service**

---

## 📦 What This Deploys

✅ **Python FastAPI Backend** - API endpoints + Excel processing
✅ **React Frontend** - Interactive dashboard UI  
✅ **Unified URL** - One domain for everything
✅ **Auto-updates** - Data refreshes every 60 seconds

---

## 🎯 Architecture

```
┌─────────────────────────────────────┐
│   Render Web Service                │
│                                     │
│   ┌──────────────────────┐         │
│   │  Python FastAPI      │         │
│   │  - Serves API        │◄────────┤── /api/survey-data
│   │  - Serves Frontend   │         │
│   └──────────────────────┘         │
│            │                        │
│   ┌────────▼──────────────┐        │
│   │  React Build (static) │        │
│   │  - index.html         │◄────────┤── /
│   │  - JS/CSS bundles     │        │
│   └───────────────────────┘        │
└─────────────────────────────────────┘
```

**Single URL serves both:**
- `https://your-app.onrender.com/` → React Dashboard
- `https://your-app.onrender.com/api/*` → API Endpoints

---

## 🚀 Quick Deploy (3 Steps)

### 1. Push to GitHub

```bash
cd "C:\Users\asus\OneDrive\Desktop\StartUp\Rudraram Survey"
git add .
git commit -m "Unified dashboard: Backend serves frontend"
git push origin main
```

### 2. Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect `Survey-Rudraram` repository
4. Click **Apply**

### 3. Done! 🎉

Your dashboard will be live at:
```
https://rudraram-survey-dashboard.onrender.com
```

---

## 📋 Manual Setup (Alternative)

If Blueprint doesn't work, create manually:

### Service Configuration

| Setting | Value |
|---------|-------|
| **Name** | `rudraram-survey-dashboard` |
| **Environment** | Python 3 |
| **Region** | Singapore |
| **Branch** | main |
| **Build Command** | See below ⬇️ |
| **Start Command** | `cd backend-python && uvicorn app:app --host 0.0.0.0 --port $PORT` |

### Build Command

```bash
# Install Python dependencies
cd backend-python && pip install -r requirements.txt && cd ..

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Build React frontend
cd frontend && npm install && npm run build && cd ..
```

### Environment Variables

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `NODE_VERSION` | `18.x` |
| `GITHUB_RAW_EXCEL_URL` | `https://raw.githubusercontent.com/.../rudraram_survey.xlsx` |

---

## ⚙️ How It Works

### Build Process (Render)

1. **Install Python** → FastAPI backend
2. **Install Node.js** → Build tools  
3. **Build React** → `frontend/build/`
4. **Start FastAPI** → Serves both API + Frontend

### Runtime Behavior

```
User Request → FastAPI Server
                   ↓
           ┌───────┴────────┐
           │                │
      Starts with      Doesn't start
      "/api"?          with "/api"?
           │                │
           ↓                ↓
     API Endpoint      React Frontend
     (JSON response)   (HTML page)
```

### Data Flow

```
GitHub Excel → Backend fetches → 60s cache → API → React UI
```

---

## 🔍 Verify Deployment

### 1. Check Health

```bash
curl https://rudraram-survey-dashboard.onrender.com/health
```

**Expected:**
```json
{
  "status": "healthy",
  "checks": {
    "cache_valid": true,
    "github_accessible": true,
    "data_loaded": true
  }
}
```

### 2. Test API

```bash
curl https://rudraram-survey-dashboard.onrender.com/api/survey-data
```

### 3. Open Dashboard

Visit: `https://rudraram-survey-dashboard.onrender.com/`

---

## 📊 Deployment Timeline

| Phase | Time |
|-------|------|
| Build Python backend | ~1 min |
| Install Node.js | ~1 min |
| Build React frontend | ~2 min |
| Start service | ~10 sec |
| **Total** | **~4-5 min** |

---

## 🐛 Troubleshooting

### Build Fails

**Problem:** Node.js installation fails

**Solution:** Check build logs. Render might need:
```bash
# Alternative Node.js install
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Frontend Not Loading

**Problem:** 404 on root path

**Solution:** Check that:
1. Frontend built successfully (`frontend/build/` exists)
2. FastAPI routes are correct (API routes before static)
3. `FRONTEND_BUILD_DIR` path is correct

### API CORS Errors

**Problem:** Frontend can't call API

**Solution:** Update `backend-python/app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Already configured
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Slow Cold Starts

**Problem:** First request takes 10+ seconds

**Solution:** 
- Normal on Render free tier (service sleeps)
- Use **UptimeRobot** to ping every 5 minutes
- Or upgrade to paid plan ($7/month)

---

## 📈 Performance

### Latency

| Request Type | Time |
|--------------|------|
| Static files (JS/CSS) | 10-30 ms |
| API (cached) | 20-40 ms |
| API (fresh Excel fetch) | 250-400 ms |
| First load (cold start) | 5-10 sec |

### Free Tier Limits

- ✅ 750 hours/month
- ✅ 100 GB bandwidth
- ⚠️ Sleeps after 15 min idle
- ⚠️ Cold start on wake

---

## 🔄 Auto-Deployment

Every push to `main` branch triggers:

1. **Build** → Frontend + Backend
2. **Test** → Health check
3. **Deploy** → Replace old version
4. **Live** → ~5 minutes

---

## 🎯 URLs Reference

| Purpose | URL |
|---------|-----|
| **Dashboard** | `https://rudraram-survey-dashboard.onrender.com/` |
| **API Docs** | `https://rudraram-survey-dashboard.onrender.com/docs` |
| **Health Check** | `https://rudraram-survey-dashboard.onrender.com/health` |
| **API Endpoint** | `https://rudraram-survey-dashboard.onrender.com/api/survey-data` |

---

## 📝 Checklist

- [x] Backend serves frontend
- [x] Frontend uses API service
- [x] Build command includes React build
- [x] render.yaml configured
- [ ] Push to GitHub
- [ ] Deploy on Render
- [ ] Verify health endpoint
- [ ] Test dashboard loads
- [ ] Test API works
- [ ] Check map displays
- [ ] Test filtering
- [ ] Verify data updates

---

## 🆚 Comparison: Split vs Unified

### Split Deployment (Old)
- Frontend: GitHub Pages
- Backend: Render
- **2 URLs**, **2 deployments**, **CORS needed**

### Unified Deployment (New) ✅
- Everything: Render
- **1 URL**, **1 deployment**, **No CORS issues**
- **Simpler**, **Faster**, **Professional**

---

## 💡 Next Steps

1. ✅ Deploy to Render
2. ⏳ Get your live URL
3. ⏳ Share with stakeholders
4. ⏳ Set up monitoring (UptimeRobot)
5. ⏳ Configure custom domain (optional)

---

**🎉 One deployment, one URL, full dashboard!**
