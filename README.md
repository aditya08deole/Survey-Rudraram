# Rudraram Survey – Village Water Infrastructure Mapping Dashboard

A production-ready dashboard application for visualizing water infrastructure assets of Rudraram Village, Telangana, on an interactive OpenStreetMap.

**Data Source**: Excel file in repository (`backend/data/rudraram_survey.xlsx`) - No database, no file uploads. The Excel file is the single source of truth, loaded at server startup.

## 🚀 Live Demo

**Deployed on Render**: [https://rudraram-survey.onrender.com](https://rudraram-survey.onrender.com)

## 📊 Features

- **Single Source of Truth**: Excel file in repository, loaded at startup
- Interactive OpenStreetMap with custom markers
- 60 water infrastructure devices (Borewells, Sumps, OHTs)
- Three administrative zones: SC Colony, Village, Waddera
- Device filtering by zone, type, and status
- Real-time statistics dashboard
- Export data to Excel/CSV
- Professional government-grade UI

## 🛠️ Technology Stack

### Frontend
- React 18
- React-Leaflet (OpenStreetMap)
- Axios
- Lucide React Icons

### Backend
- Node.js
- Express.js
- XLSX (Excel parser)
- In-memory data store

## 🏗️ Architecture

### Data Flow
```
Repository Excel File → Backend Loads at Startup → In-Memory Store → REST APIs → React Frontend
```

- **No database**: Data is read from Excel file at server start
- **No uploads**: Excel file is part of the codebase
- **Read-only APIs**: Frontend consumes data via REST endpoints
- **Restart to update**: Changes to Excel file require server restart

## 📁 Project Structure

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
