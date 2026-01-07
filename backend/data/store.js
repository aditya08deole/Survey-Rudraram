/**
 * Data Store
 * 
 * In-memory data store for devices and images.
 * Excel is the source of truth - data is loaded from Excel files.
 */

// In-memory device storage
let devices = [];

// Image mappings: surveyCode -> array of image paths
let deviceImages = {};

// Last Excel upload metadata
let lastUpload = null;

/**
 * Get all devices
 */
const getAllDevices = () => {
  return devices;
};

/**
 * Get device by Survey Code
 */
const getDeviceById = (surveyCode) => {
  return devices.find(d => d.surveyCode === surveyCode);
};

/**
 * Get devices by zone
 */
const getDevicesByZone = (zone) => {
  return devices.filter(d => d.zone === zone);
};

/**
 * Get devices by type
 */
const getDevicesByType = (type) => {
  return devices.filter(d => d.deviceType === type);
};

/**
 * Get devices by status
 */
const getDevicesByStatus = (status) => {
  return devices.filter(d => d.status === status);
};

/**
 * Get devices with coordinates (for map display)
 */
const getMappedDevices = () => {
  return devices.filter(d => d.lat && d.long && !isNaN(d.lat) && !isNaN(d.long));
};

/**
 * Get devices without coordinates (for table only)
 */
const getUnmappedDevices = () => {
  return devices.filter(d => !d.lat || !d.long || isNaN(d.lat) || isNaN(d.long));
};

/**
 * Set all devices (after Excel import)
 */
const setDevices = (newDevices) => {
  // Preserve existing images
  newDevices.forEach(device => {
    if (deviceImages[device.surveyCode]) {
      device.images = deviceImages[device.surveyCode];
    } else {
      device.images = [];
    }
  });
  devices = newDevices;
  lastUpload = new Date().toISOString();
  return devices;
};

/**
 * Clear all devices
 */
const clearDevices = () => {
  devices = [];
  lastUpload = null;
};

/**
 * Add images to a device
 */
const addDeviceImages = (surveyCode, imagePaths) => {
  if (!deviceImages[surveyCode]) {
    deviceImages[surveyCode] = [];
  }
  deviceImages[surveyCode].push(...imagePaths);
  
  // Update device record if exists
  const device = getDeviceById(surveyCode);
  if (device) {
    device.images = deviceImages[surveyCode];
  }
  
  return deviceImages[surveyCode];
};

/**
 * Get images for a device
 */
const getDeviceImages = (surveyCode) => {
  return deviceImages[surveyCode] || [];
};

/**
 * Get last upload timestamp
 */
const getLastUpload = () => {
  return lastUpload;
};

/**
 * Get device count
 */
const getDeviceCount = () => {
  return devices.length;
};

/**
 * Search devices by Survey Code or Landmark
 */
const searchDevices = (query) => {
  const lowerQuery = query.toLowerCase();
  return devices.filter(d => 
    d.surveyCode.toLowerCase().includes(lowerQuery) ||
    (d.streetName && d.streetName.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Filter devices with multiple criteria
 */
const filterDevices = (filters) => {
  let result = [...devices];
  
  if (filters.zone) {
    result = result.filter(d => d.zone === filters.zone);
  }
  if (filters.deviceType) {
    result = result.filter(d => d.deviceType === filters.deviceType);
  }
  if (filters.status) {
    result = result.filter(d => d.status === filters.status);
  }
  if (filters.mappedOnly) {
    result = result.filter(d => d.lat && d.long && !isNaN(d.lat) && !isNaN(d.long));
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(d => 
      d.surveyCode.toLowerCase().includes(query) ||
      (d.streetName && d.streetName.toLowerCase().includes(query))
    );
  }
  
  return result;
};

module.exports = {
  getAllDevices,
  getDeviceById,
  getDevicesByZone,
  getDevicesByType,
  getDevicesByStatus,
  getMappedDevices,
  getUnmappedDevices,
  setDevices,
  clearDevices,
  addDeviceImages,
  getDeviceImages,
  getLastUpload,
  getDeviceCount,
  searchDevices,
  filterDevices
};
