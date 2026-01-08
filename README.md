# Rudraram Survey – Village Water Infrastructure Mapping Dashboard

A production-ready dashboard application for visualizing water infrastructure assets of Rudraram Village, Telangana, on an interactive OpenStreetMap with satellite imagery.

**Data Source**: Excel file in repository (`backend/data/rudraram_survey.xlsx`) - Fetched dynamically from GitHub, cached for 60 seconds. No database needed.

## 🚀 Live Deployment

- **Frontend (GitHub Pages)**: [https://aditya08deole.github.io/Survey-Rudraram](https://aditya08deole.github.io/Survey-Rudraram)
- **Backend API (Render)**: Deploy using `render.yaml`

## 📊 Features

- **Dynamic Data Loading**: Excel fetched from GitHub raw URL with intelligent caching
- Interactive OpenStreetMap with **4 layer types**: Standard, Satellite, Hybrid, Terrain
- 60+ water infrastructure devices (Borewells, Sumps, OHTs)
- Three administrative zones: SC Colony, Village, Waddera
- Device filtering by zone, type, and status
- Real-time statistics dashboard
- Professional government-grade UI
- Mobile-responsive design

## 🛠️ Technology Stack

### Frontend
- React 18
- React-Leaflet (OpenStreetMap)
- Esri World Imagery (Satellite tiles - FREE)
- XLSX (Client-side Excel parsing)
- Lucide React Icons

### Backend
- **Python 3.11** + FastAPI
- **Pandas** - Superior Excel processing
- **Uvicorn** - ASGI server
- **60-second intelligent cache**
- **GitHub raw URL fetch**

## 🏗️ Architecture

### Data Flow
```
GitHub Excel File → Python Backend (Pandas) → 60s Cache → REST API → React Frontend
```

- **No database**: Excel is fetched from GitHub on-demand
- **Auto-refresh**: Updates within 60 seconds without redeployment
- **Version controlled**: All data changes tracked in Git
- **Stateless**: Backend can restart without data loss

## 📁 Project Structure

```
Survey-Rudraram/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # Excel reader (from GitHub)
│   │   └── utils/         # Constants and helpers
│   └── public/            # Static assets
├── backend-python/        # FastAPI Python backend
│   ├── app.py            # Main FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Backend documentation
├── docs/                  # GitHub Pages build output
├── render.yaml           # Render deployment config
└── RENDER_DEPLOY.md      # Deployment guide
```
├── backend/
│   ├── data/
│   │   └── rudraram_survey.xlsx    # Single source of truth
│   ├── config/                     # Zone, device type, schema config
│   ├── routes/                     # REST API endpoints
│   ├── services/
│   │   ├── dataLoader.js           # Loads Excel at startup
│   │   └── excelParser.js          # Parses Excel structure
│   └── server.js                   # Express server
├── frontend/
│   ├── src/
│   │   ├── components/             # Map, DevicePanel, etc.
│   │   ├── pages/                  # Dashboard, MapView, TableView
│   │   ├── services/               # API client
│   │   └── utils/                  # Constants and helpers
│   └── public/
│       └── device-images/          # Device photos (optional)
└── README.md
```

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
