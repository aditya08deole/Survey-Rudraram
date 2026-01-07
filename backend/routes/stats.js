/**
 * Statistics Routes
 * 
 * API endpoints for statistics and dashboard data.
 */

const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');

/**
 * GET /api/stats
 * Get comprehensive dashboard statistics
 */
router.get('/', (req, res) => {
  try {
    const stats = statsService.getDashboardStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/overview
 * Get basic overview statistics
 */
router.get('/overview', (req, res) => {
  try {
    const overview = statsService.getOverallStats();
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/zones
 * Get zone-wise statistics
 */
router.get('/zones', (req, res) => {
  try {
    const zones = statsService.getZoneStats();
    res.json({
      success: true,
      zones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/status
 * Get status-wise statistics
 */
router.get('/status', (req, res) => {
  try {
    const status = statsService.getStatusStats();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/device-types
 * Get device type statistics
 */
router.get('/device-types', (req, res) => {
  try {
    const deviceTypes = statsService.getDeviceTypeStats();
    res.json({
      success: true,
      deviceTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
