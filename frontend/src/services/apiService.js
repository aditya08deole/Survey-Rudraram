import { supabase } from '../supabaseClient';

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch all survey devices from API with optional sheet selection
 * @param {string} sheet - Name of the Excel sheet to load (optional, defaults to "All")
 * @returns {Promise<Array>} Array of device objects
 */
export const fetchSurveyData = async (sheet = 'All', source = 'supabase') => {
  try {
    const url = new URL(`${API_BASE_URL}/api/survey-data`);
    if (sheet) {
      url.searchParams.append('sheet', sheet);
    }
    if (source) {
      url.searchParams.append('source', source);
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
    const normalizedDevices = (data.data || []).map(d => ({
      ...d,
      survey_id: d.survey_id || d.survey_code || d.SurveyID,
      lat: d.lat || d.latitude,
      lng: d.lng || d.longitude || d.long
    }));

    return {
      success: true,
      devices: normalizedDevices,
      count: data.count || normalizedDevices.length,
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
    const device = data.data;
    if (device) {
      device.survey_id = device.survey_id || device.survey_code;
      device.lat = device.lat || device.latitude;
      device.lng = device.lng || device.longitude || device.long;
    }
    return {
      success: true,
      device: device || null,
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

/**
 * ========================================
 * MAP ZONE API FUNCTIONS
 * ========================================
 */

export const getMapZones = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones`);
    if (!response.ok) throw new Error("Failed to fetch zones");
    return await response.json();
  } catch (error) {
    console.error("Error loading zones:", error);
    return [];
  }
};

export const saveMapZone = async (zone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zone),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving zone:", error);
    return { success: false };
  }
};

export const deleteMapZone = async (zoneId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones/${zoneId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting zone:", error);
    return { success: false };
  }
};

export const updateMapZone = async (zoneId, zone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones/${zoneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(zone),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating zone:", error);
    return { success: false };
  }
};

export const deleteAllMapZones = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones/all/delete`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting all zones:", error);
    return { success: false };
  }
};

export const updateDeviceNotes = async (surveyCode, deviceType, notes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/devices/${encodeURIComponent(surveyCode)}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, device_type: deviceType })
    });
    if (!response.ok) throw new Error("Failed to update notes");
    return await response.json();
  } catch (error) {
    console.error("Error updating notes:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger Excel to Supabase synchronization
 * @returns {Promise<Object>} Sync result
 */
export const triggerExcelSync = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/excel`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Sync failed");
    return await response.json();
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
};

/**
 * Fetch 14-day analytics trends
 */
export const fetchAnalyticsTrends = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/stats/trends`);
    if (!response.ok) throw new Error("Failed to fetch trends");
    return await response.json();
  } catch (error) {
    console.error("Trends error:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fetch zone-level health metrics
 */
export const fetchAnalyticsHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/db/stats/health`);
    if (!response.ok) throw new Error("Failed to fetch health stats");
    return await response.json();
  } catch (error) {
    console.error("Health stats error:", error);
    return { success: false, data: [] };
  }
};

/**
 * Team Management - Fetching members
 */
export const fetchTeamMembers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`);
    if (!response.ok) throw new Error("Failed to fetch team");
    return await response.json();
  } catch (error) {
    console.error("Team error:", error);
    throw error;
  }
};

/**
 * Team Management - Inviting members
 */
export const inviteUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw { response: { data: errorData } };
    }
    return await response.json();
  } catch (error) {
    console.error("Invite error:", error);
    throw error;
  }
};

// Image management methods should be here too...
// I noticed some were missing or incorrectly referenced in the default export.
// I'll add them here properly.

export const uploadDeviceImage = async (surveyCode, file, caption = null, isPrimary = false) => {
  if (!surveyCode || surveyCode === 'undefined') {
    return { success: false, error: "Invalid survey identifier. Please refresh the page and try again." };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return { success: false, error: "Authentication session expired. Please log in again." };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    if (isPrimary) formData.append('is_primary', 'true');

    const response = await fetch(`${API_BASE_URL}/api/device-images/upload/${encodeURIComponent(surveyCode)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || "Upload failed");
    return { success: true, data };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
};

export const fetchDeviceImages = async (surveyCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/device-images/${surveyCode}`);
    const data = await response.json();
    return { success: response.ok, data: data.data || [] };
  } catch (error) {
    return { success: false, data: [] };
  }
};

export const deleteDeviceImage = async (imageId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_BASE_URL}/api/device-images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setPrimaryImage = async (surveyCode, imageId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_BASE_URL}/api/device-images/${imageId}/primary?survey_code=${surveyCode}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Fetch synchronization history logs
 * @returns {Promise<Array>} List of sync history objects
 */
export const fetchSyncHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/history`, {
      method: "GET",
    });
    if (!response.ok) throw new Error("Failed to fetch sync history");
    return await response.json();
  } catch (error) {
    console.error("Fetch sync history error:", error);
    return [];
  }
};

// Export API base URL for debugging
export { API_BASE_URL };

// Default export
const apiService = {
  // Excel-based API
  fetchSurveyData,
  fetchAvailableSheets,

  fetchDeviceByCode,
  refreshCache,
  checkApiHealth,

  // Database API
  fetchDevicesFromDB,
  fetchStatsFromDB,
  fetchDeviceByCodeDB,
  fetchZonesFromDB,
  checkDatabaseHealth,
  updateDeviceNotes,
  deleteAllMapZones,
  triggerExcelSync,
  fetchSyncHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/api/sync/history`);
    return await response.json();
  },

  // New Methods
  uploadDeviceImage,
  fetchDeviceImages,
  deleteDeviceImage,
  setPrimaryImage,
  fetchTeamMembers,
  inviteUser,
  fetchAnalyticsTrends,
  fetchAnalyticsHealth,

  API_BASE_URL
};

export default apiService;
