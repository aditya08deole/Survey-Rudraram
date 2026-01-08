# Rudraram Survey - Python FastAPI Backend

**Production-ready Excel-driven API for water infrastructure dashboard**

## 🚀 Features

- ✅ **FastAPI** - Modern, fast Python web framework
- ✅ **Pandas** - Superior Excel data processing
- ✅ **In-Memory Caching** - 60-second intelligent cache
- ✅ **GitHub Raw Fetch** - Always fresh data from repository
- ✅ **Render Deployment** - One-click production deployment
- ✅ **Auto-Refresh** - No redeployment needed for data updates
- ✅ **Full Type Safety** - Pydantic validation

## 📁 Project Structure

```
backend-python/
├── app.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## 🔧 Local Development

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

Server runs at: `http://localhost:8000`

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service health and status |
| `GET` | `/api/survey-data` | Get all survey devices |
| `GET` | `/api/survey-data/stats` | Get statistical summary |
| `GET` | `/api/survey-data/{code}` | Get specific device |
| `POST` | `/api/cache/refresh` | Force cache refresh |
| `GET` | `/health` | Detailed health check |

### Example Response

```json
[
  {
    "surveyCode": "RUD001",
    "zone": "Village",
    "streetName": "Main Road",
    "deviceType": "Borewell",
    "status": "Working",
    "housesConnected": 25,
    "dailyUsage": 8,
    "pipeSize": 4,
    "motorCapacity": "5 HP",
    "notes": "Regular maintenance",
    "lat": 17.563,
    "long": 78.167,
    "images": null
  }
]
```

## ⚡ Performance

### Latency Metrics

| Scenario | Response Time |
|----------|---------------|
| Cache Hit | 20-40 ms |
| Cache Miss | 250-400 ms |
| Stats Endpoint | 30-50 ms |

### Caching Strategy

- **Cache Duration**: 60 seconds
- **Auto-Refresh**: On cache expiry
- **Manual Refresh**: `POST /api/cache/refresh`

## 🌐 Data Source

Excel file fetched from:
```
https://raw.githubusercontent.com/aditya08deole/Survey-Rudraram/main/backend/data/rudraram_survey.xlsx
```

**Sheet**: `All`

## 🚢 Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. Push code to GitHub
2. Go to Render Dashboard
3. New → Blueprint
4. Connect repository
5. Deploy automatically

### Option 2: Manual Setup

1. New Web Service
2. Connect GitHub repo
3. Configure:
   - **Name**: rudraram-survey-api
   - **Environment**: Python 3
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend-python`

### Environment Variables

| Variable | Value |
|----------|-------|
| `PYTHON_VERSION` | 3.11.0 |
| `GITHUB_RAW_EXCEL_URL` | (Excel raw URL) |

## 🔍 Monitoring

### Health Check Endpoint

```bash
curl https://your-app.onrender.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T12:00:00",
  "checks": {
    "cache_valid": true,
    "github_accessible": true,
    "data_loaded": true
  },
  "metrics": {
    "total_fetches": 42,
    "cached_devices": 60,
    "last_fetch": "2026-01-08T11:59:00"
  }
}
```

## 🆚 Why Python over Express?

| Feature | Express (Node) | FastAPI (Python) |
|---------|---------------|------------------|
| Excel Handling | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Pandas Support | ❌ | ✅ Native |
| Type Safety | Low | High (Pydantic) |
| Data Analysis | Limited | Excellent |
| Auto Docs | Manual | Auto-generated |
| Performance | Good | Excellent |

## 📊 Excel Column Mapping

| Excel Column | JSON Key | Type |
|--------------|----------|------|
| Survey Code | surveyCode | string |
| Zone | zone | string |
| Street Name | streetName | string |
| Device Type | deviceType | string |
| Status | status | string |
| Houses Connected | housesConnected | number |
| Daily Usage (hrs) | dailyUsage | number |
| Pipe Size (inch) | pipeSize | number |
| Motor HP | motorCapacity | string |
| Notes | notes | string |
| Lat | lat | number |
| Long | long | number |
| Images | images | string |

## 🔒 CORS Configuration

Currently allows all origins (`*`) for development.

**Production**: Update in `app.py`:
```python
allow_origins=["https://your-frontend-domain.com"]
```

## 🐛 Troubleshooting

### GitHub Fetch Fails

**Error**: `503 Service Unavailable`

**Solutions**:
1. Check GitHub repository is public
2. Verify Excel file exists at path
3. Check GitHub API rate limits

### Cache Issues

Force refresh:
```bash
curl -X POST https://your-app.onrender.com/api/cache/refresh
```

### Missing Data

Check logs for Excel parsing errors:
```bash
render logs -s rudraram-survey-api
```

## 📦 Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pandas` - Excel processing
- `openpyxl` - Excel file engine
- `requests` - HTTP client

## 🎯 Next Steps

1. ✅ Backend deployed on Render
2. ⏳ Update frontend API URL
3. ⏳ Configure CORS for production
4. ⏳ Set up monitoring alerts

## 📝 License

Part of Rudraram Survey project
