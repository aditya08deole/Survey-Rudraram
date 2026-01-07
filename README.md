# Rudraram Survey – Village Water Infrastructure Mapping Dashboard

A complete production-ready dashboard application for visualizing water infrastructure assets of Rudraram Village, Telangana, on an interactive OpenStreetMap.

## 🚀 Live Demo

**Deployed on Render**: [https://rudraram-survey.onrender.com](https://rudraram-survey.onrender.com)

## 📊 Features

- Interactive OpenStreetMap with custom markers
- 60+ water infrastructure devices (Borewells, Sumps, OHTs)
- Three zones: SC Colony, Village, Waddera
- Excel file upload for data management
- Device image gallery with Excel sync
- Filtering by zone, device type, status
- Export to Excel/CSV
- Real-time statistics dashboard
- **Auto-sync images to Excel file**

## 🛠️ Technology Stack

### Frontend
- React 18
- React-Leaflet (OpenStreetMap)
- Axios
- Lucide React Icons

### Backend
- Node.js
- Express.js
- XLSX (Excel parser & writer)
- Multer (File uploads)

## 🌐 Deploy to Render (One-Click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/aditya08deole/Rudraram-Survey)

### Manual Render Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rudraram-survey`
   - **Environment**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd backend && node server.js`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
5. Click **Create Web Service**

## 📦 Local Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
App runs on http://localhost:3000

## 📁 Project Structure

```
├── backend/
│   ├── config/         # Zone, device type, schema definitions
│   ├── data/           # In-memory data store
│   ├── routes/         # API endpoints
│   ├── services/       # Excel parser, stats service
│   └── server.js       # Express server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # React Context for state management
│   │   ├── pages/      # Dashboard, Map, Table, Admin pages
│   │   ├── services/   # API client
│   │   └── utils/      # Constants and helpers
│   └── package.json
└── README.md
```

## 📋 Excel Schema

| Column | Required | Description |
|--------|----------|-------------|
| Survey Code (ID) | Yes | Unique identifier |
| Zone | Yes | SC Colony / Village / Waddera |
| Street Name / Landmark | No | Location description |
| Device Type | Yes | Borewell / Sump / OHT |
| Lat | No | Latitude |
| Long | No | Longitude |
| Status | Yes | Working / Not Work / Failed |
| Houses Conn. | No | Number of houses connected |
| Daily Usage (Hrs) | No | Daily usage hours |
| Pipe Size (inch) | No | Pipe diameter |
| Motor HP / Cap | No | Motor capacity |
| Notes / Maintenance Issue | No | Additional notes |

## 🎨 Device Markers

| Device Type | Shape | Status Colors |
|-------------|-------|---------------|
| Borewell | Circle | Green (Working), Orange (Not Work), Red (Failed) |
| Sump | Square | Green (Working), Orange (Not Work), Red (Failed) |
| OHT | Triangle | Green (Working), Orange (Not Work), Red (Failed) |

## 📄 License

MIT License

## 👤 Author

Aditya Deole
