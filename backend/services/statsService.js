/**
 * Statistics Service
 * 
 * Computes various statistics from device data.
 */

const store = require('../data/store');
const { VALID_ZONES, getAllZones } = require('../config/zones');
const { VALID_DEVICE_TYPES, VALID_STATUSES, getStatusColor } = require('../config/deviceTypes');

/**
 * Get overall statistics
 */
const getOverallStats = () => {
  const devices = store.getAllDevices();
  
  return {
    totalDevices: devices.length,
    mappedDevices: store.getMappedDevices().length,
    unmappedDevices: store.getUnmappedDevices().length,
    lastUpdated: store.getLastUpload()
  };
};

/**
 * Get zone-wise statistics
 */
const getZoneStats = () => {
  const devices = store.getAllDevices();
  const zones = getAllZones();
  
  return zones.map(zone => {
    const zoneDevices = devices.filter(d => d.zone === zone.name);
    const working = zoneDevices.filter(d => d.status === 'Working').length;
    const notWorking = zoneDevices.filter(d => d.status === 'Not Work').length;
    const failed = zoneDevices.filter(d => d.status === 'Failed').length;
    
    const totalHousesConnected = zoneDevices.reduce((sum, d) => sum + (d.housesConnected || 0), 0);
    
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      population: zone.population,
      color: zone.color,
      totalDevices: zoneDevices.length,
      working,
      notWorking,
      failed,
      workingPercentage: zoneDevices.length > 0 ? 
        Math.round((working / zoneDevices.length) * 100) : 0,
      housesConnected: totalHousesConnected,
      borewells: zoneDevices.filter(d => d.deviceType === 'Borewell').length,
      sumps: zoneDevices.filter(d => d.deviceType === 'Sump').length,
      ohts: zoneDevices.filter(d => d.deviceType === 'OHT').length
    };
  });
};

/**
 * Get status-wise statistics
 */
const getStatusStats = () => {
  const devices = store.getAllDevices();
  
  return VALID_STATUSES.map(status => {
    const count = devices.filter(d => d.status === status).length;
    return {
      status,
      count,
      percentage: devices.length > 0 ? 
        Math.round((count / devices.length) * 100) : 0,
      color: getStatusColor(status)
    };
  });
};

/**
 * Get device type statistics
 */
const getDeviceTypeStats = () => {
  const devices = store.getAllDevices();
  
  return VALID_DEVICE_TYPES.map(type => {
    const typeDevices = devices.filter(d => d.deviceType === type);
    const working = typeDevices.filter(d => d.status === 'Working').length;
    
    return {
      type,
      total: typeDevices.length,
      working,
      notWorking: typeDevices.filter(d => d.status === 'Not Work').length,
      failed: typeDevices.filter(d => d.status === 'Failed').length,
      workingPercentage: typeDevices.length > 0 ? 
        Math.round((working / typeDevices.length) * 100) : 0
    };
  });
};

/**
 * Get comprehensive dashboard statistics
 */
const getDashboardStats = () => {
  const devices = store.getAllDevices();
  const zoneStats = getZoneStats();
  
  // Calculate totals
  const totalHousesConnected = devices.reduce((sum, d) => sum + (d.housesConnected || 0), 0);
  const totalDailyUsage = devices.reduce((sum, d) => sum + (d.dailyUsage || 0), 0);
  
  // Calculate health score (percentage of working devices)
  const workingDevices = devices.filter(d => d.status === 'Working').length;
  const healthScore = devices.length > 0 ? 
    Math.round((workingDevices / devices.length) * 100) : 0;
  
  return {
    overview: getOverallStats(),
    zones: zoneStats,
    statusBreakdown: getStatusStats(),
    deviceTypes: getDeviceTypeStats(),
    summary: {
      totalHousesConnected,
      averageDailyUsage: devices.length > 0 ? 
        Math.round(totalDailyUsage / devices.length * 10) / 10 : 0,
      healthScore,
      criticalDevices: devices.filter(d => d.status === 'Failed').length,
      needsAttention: devices.filter(d => d.status === 'Not Work').length
    }
  };
};

/**
 * Get GeoJSON for all mapped devices
 */
const getGeoJSON = () => {
  const devices = store.getMappedDevices();
  
  return {
    type: 'FeatureCollection',
    features: devices.map(device => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [device.long, device.lat]
      },
      properties: {
        surveyCode: device.surveyCode,
        zone: device.zone,
        streetName: device.streetName,
        deviceType: device.deviceType,
        status: device.status,
        housesConnected: device.housesConnected,
        dailyUsage: device.dailyUsage,
        pipeSize: device.pipeSize,
        motorCapacity: device.motorCapacity,
        notes: device.notes,
        images: device.images
      }
    }))
  };
};

module.exports = {
  getOverallStats,
  getZoneStats,
  getStatusStats,
  getDeviceTypeStats,
  getDashboardStats,
  getGeoJSON
};
