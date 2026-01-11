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
 * Fetch all survey devices from API with optional sheet selection
 * @param {string} sheet - Name of the Excel sheet to load (optional, defaults to "All")
 * @returns {Promise<Array>} Array of device objects
 */
export const fetchSurveyData = async (sheet = 'All') => {
  try {
    const url = new URL(`${API_BASE_URL}/api/survey-data`);
    if (sheet) {
      url.searchParams.append('sheet', sheet);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Handle new API structure with metadata
    const devices = data.devices || data;
    return {
      success: true,
      devices: devices,
      metadata: data.metadata || null,
      sheet: sheet,
      stats: calculateStats(devices),
      errors: [],
      warnings: []
    };
  } catch (error) {
    console.error('Error fetching survey data:', error);
    return {
      success: false,
      devices: [],
      sheet: sheet,
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
    // Count devices with coordinates (updated field name: lng)
    if (device.lat && device.lng) {
      stats.devicesWithCoordinates++;
    }

    // Count by zone
    const zone = device.zone || 'Unknown';
    stats.byZone[zone] = (stats.byZone[zone] || 0) + 1;

    // Count by type (updated field name: device_type)
    const type = device.device_type || 'Unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by status
    const status = device.status || 'Unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
};

/**
 * Fetch list of available Excel sheets
 * @returns {Promise<Object>} Object with sheets array and default sheet
 */
export const fetchAvailableSheets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sheets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      sheets: data.sheets || [],
      defaultSheet: data.default_sheet || 'All',
      totalSheets: data.total_sheets || 0
    };
  } catch (error) {
    console.error('Error fetching available sheets:', error);
    return {
      success: false,
      sheets: ['All'],  // Fallback to default
      defaultSheet: 'All',
      totalSheets: 1,
      error: error.message
    };
  }
};

/**
 * ========================================
 * DATABASE API FUNCTIONS (New Supabase Integration)
 * ========================================
 */

/**
 * Fetch devices from DATABASE API (replaces Excel-based system)
 * @param {Object} filters - Query filters (device_type, zone, status, limit, offset)
 * @returns {Promise<Object>} Response with devices array
 */
export const fetchDevicesFromDB = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.device_type) params.append('device_type', filters.device_type);
    if (filters.zone) params.append('zone', filters.zone);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await fetch(`${API_BASE_URL}/api/db/devices?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Database API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      devices: data.data || [],
      count: data.count || 0,
      filters: data.filters || {},
      errors: []
    };
  } catch (error) {
    console.error('Database API error:', error);
    return {
      success: false,
      error: error.message,
      devices: [],
      count: 0,
      errors: [error.message]
    };
  }
};

/**
 * Fetch statistics from DATABASE API
 * @returns {Promise<Object>} Statistics with counts by type, status, zone
 */
export const fetchStatsFromDB = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Database stats error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      stats: data.data || {},
      errors: []
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return {
      success: false,
      error: error.message,
      stats: {},
      errors: [error.message]
    };
  }
};

/**
 * Fetch single device by survey code from DATABASE
 * @param {string} surveyCode - Device survey code
 * @returns {Promise<Object>} Device object with device_type field
 */
export const fetchDeviceByCodeDB = async (surveyCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/devices/${encodeURIComponent(surveyCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Device not found: ${surveyCode}`);
    }

    const data = await response.json();
    return {
      success: true,
      device: data.data || null,
      errors: []
    };
  } catch (error) {
    console.error('Device fetch error:', error);
    return {
      success: false,
      error: error.message,
      device: null,
      errors: [error.message]
    };
  }
};

/**
 * Fetch zones list from DATABASE
 * @returns {Promise<Object>} List of unique zones
 */
export const fetchZonesFromDB = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/zones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Zones fetch error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      zones: data.data || [],
      errors: []
    };
  } catch (error) {
    console.error('Zones fetch error:', error);
    return {
      success: false,
      error: error.message,
      zones: [],
      errors: [error.message]
    };
  }
};

/**
 * Check database health
 * @returns {Promise<Object>} Database connection status
 */
export const checkDatabaseHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return {
      success: data.status === 'healthy',
      status: data.status,
      database: data.database || 'unknown',
      timestamp: data.timestamp || null
    };
  } catch (error) {
    return {
      success: false,
      status: 'error',
      error: error.message
    };
  }
};

// Export API base URL for debugging
export { API_BASE_URL };

// Default export
const apiService = {
  // Excel-based API (Legacy)
  fetchSurveyData,
  fetchSurveyStats,
  fetchAvailableSheets,
  fetchDeviceByCode,
  refreshCache,
  checkApiHealth,

  // Database API (New)
  fetchDevicesFromDB,
  fetchStatsFromDB,
  fetchDeviceByCodeDB,
  fetchZonesFromDB,
  checkDatabaseHealth,

  API_BASE_URL
};

export default apiService;
