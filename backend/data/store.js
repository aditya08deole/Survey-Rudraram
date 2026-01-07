/**
 * Data Store
 * 
 * In-memory data store for devices.
 * Excel file is loaded at startup - this is the single source of truth.
 * No database, no uploads - data comes directly from the repository Excel file.
 */

const { loadExcelData } = require('../services/dataLoader');

// In-memory device storage
let devices = [];

// Load metadata
let dataLoadedAt = null;
let loadStats = null;

/**
 * Initialize the store by loading Excel data
 * Called once at server startup
 */
const initializeStore = () => {
  console.log('\n🔄 Initializing data store...');
  
  const result = loadExcelData();
  
  if (result.success) {
    devices = result.devices;
    dataLoadedAt = result.loadedAt;
    loadStats = result.stats;
    console.log('✅ Data store initialized successfully\n');
  } else {
    console.error('❌ Failed to initialize data store');
    console.error('   Errors:', result.errors);
  }
  
  return result;
};

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
 * Get data loaded timestamp
 */
const getDataLoadedAt = () => {
  return dataLoadedAt;
};

/**
 * Get load statistics
 */
const getLoadStats = () => {
  return loadStats;
};

/**
 * Get device count
 */
const getDeviceCount = () => {
  return devices.length;
};

/**
 * Get images for a device (from the device record itself)
 */
const getDeviceImages = (surveyCode) => {
  const device = getDeviceById(surveyCode);
  return device ? device.images : [];
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
  initializeStore,
  getAllDevices,
  getDeviceById,
  getDevicesByZone,
  getDevicesByType,
  getDevicesByStatus,
  getMappedDevices,
  getUnmappedDevices,
  getDataLoadedAt,
  getLoadStats,
  getDeviceCount,
  getDeviceImages,
  searchDevices,
  filterDevices
};
