/**
 * Zone Routes
 * 
 * API endpoints for zone information.
 */

const express = require('express');
const router = express.Router();
const { getAllZones, getZone } = require('../config/zones');
const store = require('../data/store');

/**
 * GET /api/zones
 * Get all zone metadata with device counts
 */
router.get('/', (req, res) => {
  try {
    const zones = getAllZones();
    const devices = store.getAllDevices();
    
    const zonesWithCounts = zones.map(zone => {
      const zoneDevices = devices.filter(d => d.zone === zone.name);
      return {
        ...zone,
        deviceCount: zoneDevices.length,
        workingCount: zoneDevices.filter(d => d.status === 'Working').length,
        notWorkingCount: zoneDevices.filter(d => d.status === 'Not Work').length,
        failedCount: zoneDevices.filter(d => d.status === 'Failed').length
      };
    });
    
    res.json({
      success: true,
      zones: zonesWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/zones/:name
 * Get single zone by name
 */
router.get('/:name', (req, res) => {
  try {
    const zone = getZone(req.params.name);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: `Zone "${req.params.name}" not found`
      });
    }
    
    const devices = store.getDevicesByZone(req.params.name);
    
    res.json({
      success: true,
      zone: {
        ...zone,
        devices,
        deviceCount: devices.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/zones/:name/devices
 * Get all devices in a zone
 */
router.get('/:name/devices', (req, res) => {
  try {
    const zone = getZone(req.params.name);
    
    if (!zone) {
      return res.status(404).json({
        success: false,
        error: `Zone "${req.params.name}" not found`
      });
    }
    
    const devices = store.getDevicesByZone(req.params.name);
    
    res.json({
      success: true,
      zone: zone.name,
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

module.exports = router;
