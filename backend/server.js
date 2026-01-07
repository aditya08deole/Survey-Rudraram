/**
 * Rudraram Survey - Backend Server
 * 
 * Main entry point for the Node.js/Express backend.
 * Handles Excel ingestion, API endpoints, and image uploads.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const deviceRoutes = require('./routes/devices');
const zoneRoutes = require('./routes/zones');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/images', 'uploads/excel', 'data'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// API Routes
app.use('/api/devices', deviceRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Rudraram Survey Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handle React routing, return all requests to React app
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
║   Endpoints:                                               ║
║   - GET  /api/devices      - All devices                  ║
║   - GET  /api/devices/:id  - Single device                ║
║   - GET  /api/zones        - Zone metadata                ║
║   - GET  /api/stats        - Statistics                   ║
║   - POST /api/upload/excel - Upload Excel file            ║
║   - POST /api/images/:id   - Upload device images         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
