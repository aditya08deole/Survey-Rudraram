/**
 * Device Routes
 * 
 * API endpoints for device CRUD operations.
 */

const express = require('express');
const router = express.Router();
const store = require('../data/store');

/**
 * GET /api/devices
 * Get all devices with optional filtering
 * Query params: zone, deviceType, status, search, mappedOnly
 */
router.get('/', (req, res) => {
  try {
    const { zone, deviceType, status, search, mappedOnly } = req.query;
    
    const filters = {};
    if (zone) filters.zone = zone;
    if (deviceType) filters.deviceType = deviceType;
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (mappedOnly === 'true') filters.mappedOnly = true;
    
    const devices = Object.keys(filters).length > 0 
      ? store.filterDevices(filters)
      : store.getAllDevices();
    
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/devices/mapped
 * Get only devices with valid coordinates (for map display)
 */
router.get('/mapped', (req, res) => {
  try {
    const devices = store.getMappedDevices();
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/devices/unmapped
 * Get devices without valid coordinates (visible in table only)
 */
router.get('/unmapped', (req, res) => {
  try {
    const devices = store.getUnmappedDevices();
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/devices/geojson
 * Get all mapped devices as GeoJSON for map rendering
 */
router.get('/geojson', (req, res) => {
  try {
    const statsService = require('../services/statsService');
    const geojson = statsService.getGeoJSON();
    res.json(geojson);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/devices/search
 * Search devices by Survey Code or Landmark
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        count: 0,
        devices: []
      });
    }
    
    const devices = store.searchDevices(q);
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/devices/:id
 * Get single device by Survey Code
 */
router.get('/:id', (req, res) => {
  try {
    const device = store.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: `Device with Survey Code "${req.params.id}" not found`
      });
    }
    
    res.json({
      success: true,
      device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
