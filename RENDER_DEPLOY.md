# 🚀 Render Deployment Guide - Python FastAPI Backend

**Complete deployment guide for Survey-Rudraram Python API**

---

## 📋 Quick Start (3 Steps)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Python FastAPI backend"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to https://dashboard.render.com
   - New → Blueprint
   - Select `Survey-Rudraram` repo
   - Click Apply

3. **Done!**
   - API live at: `https://rudraram-survey-api.onrender.com`
   - Docs: `https://rudraram-survey-api.onrender.com/docs`

---

## 🔧 Manual Setup (Alternative)

### Configuration

| Setting | Value |
|---------|-------|
| Name | `rudraram-survey-api` |
| Region | Singapore |
| Root Directory | `backend-python` |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |

---

## ✅ Post-Deployment

Update frontend API URL in `frontend/src/services/excelReader.js`:
```javascript
const API_URL = 'https://rudraram-survey-api.onrender.com';
```

Test endpoints:
```bash
curl https://rudraram-survey-api.onrender.com/health
curl https://rudraram-survey-api.onrender.com/api/survey-data
```

---

**Free tier sleeps after 15 min. Use UptimeRobot to keep awake.**
