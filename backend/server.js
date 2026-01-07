/**
 * Rudraram Survey - Backend Server
 * 
 * Main entry point for the Node.js/Express backend.
 * Loads Excel data from repository at startup - no uploads, no database.
 * The Excel file in /backend/data/ is the single source of truth.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import data store (must be initialized before routes)
const store = require('./data/store');

// Import routes
const deviceRoutes = require('./routes/devices');
const zoneRoutes = require('./routes/zones');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize data store by loading Excel file
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   🌊 Rudraram Survey - Starting Server                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const initResult = store.initializeStore();
if (!initResult.success) {
  console.error('\n⚠️  Warning: Server starting with no data loaded');
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for device images (from frontend public folder)
app.use('/device-images', express.static(path.join(__dirname, '../frontend/public/device-images')));

// Ensure device images directory exists
const imagesDir = path.join(__dirname, '../frontend/public/device-images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// API Routes (read-only)
app.use('/api/devices', deviceRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Rudraram Survey Backend is running',
    dataLoaded: store.getDeviceCount() > 0,
    deviceCount: store.getDeviceCount(),
    loadedAt: store.getDataLoadedAt(),
    timestamp: new Date().toISOString()
  });
});

// Data info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    dataSource: 'Excel file (repository)',
    deviceCount: store.getDeviceCount(),
    loadedAt: store.getDataLoadedAt(),
    stats: store.getLoadStats()
  });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌊 Rudraram Survey Backend Server                       ║
║                                                            ║
║   Server running on: http://localhost:${PORT}               ║
║   API Base URL: http://localhost:${PORT}/api               ║
║                                                            ║
║   Data Source: backend/data/rudraram_survey.xlsx           ║
║                                                            ║
║   Endpoints:                                               ║
║   - GET  /api/devices      - All devices                  ║
║   - GET  /api/devices/:id  - Single device                ║
║   - GET  /api/zones        - Zone metadata                ║
║   - GET  /api/stats        - Statistics                   ║
║   - POST /api/images/:id   - Upload device images         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
