/**
 * API Service - Unified Backend Communication
 * 
 * Handles all API requests to the FastAPI backend.
 * Works in both development and production environments.
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In production (Render), API is served from same domain
  // In development, use localhost:8000
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin; // Same domain as frontend
  }
  return 'http://localhost:8000'; // Development
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch all survey devices from API
 * @returns {Promise<Array>} Array of device objects
 */
export const fetchSurveyData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/survey-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      devices: data,
      stats: calculateStats(data),
      errors: [],
      warnings: []
    };
  } catch (error) {
    console.error('Error fetching survey data:', error);
    return {
      success: false,
      devices: [],
      stats: null,
      errors: [error.message],
      warnings: []
    };
  }
};

/**
 * Fetch survey statistics from API
 * @returns {Promise<Object>} Statistics object
 */
export const fetchSurveyStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/survey-data/stats`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

/**
 * Fetch specific device by survey code
 * @param {string} surveyCode - Device survey code
 * @returns {Promise<Object>} Device object
 */
export const fetchDeviceByCode = async (surveyCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/survey-data/${surveyCode}`);
    
    if (!response.ok) {
      throw new Error(`Device not found: ${surveyCode}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching device:', error);
    throw error;
  }
};

/**
 * Manually refresh API cache
 * @returns {Promise<Object>} Refresh result
 */
export const refreshCache = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cache/refresh`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Cache refresh failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing cache:', error);
    throw error;
  }
};

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('API unhealthy');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

/**
 * Calculate statistics from device data
 * @param {Array} devices - Array of device objects
 * @returns {Object} Statistics summary
 */
const calculateStats = (devices) => {
  const stats = {
    totalDevices: devices.length,
    devicesWithCoordinates: 0,
    byZone: {},
    byType: {},
    byStatus: {},
  };

  devices.forEach(device => {
    // Count devices with coordinates
    if (device.lat && device.long) {
      stats.devicesWithCoordinates++;
    }

    // Count by zone
    const zone = device.zone || 'Unknown';
    stats.byZone[zone] = (stats.byZone[zone] || 0) + 1;

    // Count by type
    const type = device.deviceType || 'Unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by status
    const status = device.status || 'Unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
};

// Export API base URL for debugging
export { API_BASE_URL };

// Default export
const apiService = {
  fetchSurveyData,
  fetchSurveyStats,
  fetchDeviceByCode,
  refreshCache,
  checkApiHealth,
  API_BASE_URL
};

export default apiService;
