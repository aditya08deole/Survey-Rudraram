/**
 * API Configuration and Service
 * 
 * Centralized API calls to the backend.
 */

import axios from 'axios';

// Base URL for API - uses environment variable in production, proxy in development
const API_BASE = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Device API calls
 */
export const deviceAPI = {
  // Get all devices with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/devices?${params}`);
    return response.data;
  },

  // Get single device by Survey Code
  getById: async (surveyCode) => {
    const response = await api.get(`/devices/${encodeURIComponent(surveyCode)}`);
    return response.data;
  },

  // Get only mapped devices (for map display)
  getMapped: async () => {
    const response = await api.get('/devices/mapped');
    return response.data;
  },

  // Get unmapped devices (for table only)
  getUnmapped: async () => {
    const response = await api.get('/devices/unmapped');
    return response.data;
  },

  // Get devices as GeoJSON
  getGeoJSON: async () => {
    const response = await api.get('/devices/geojson');
    return response.data;
  },

  // Search devices
  search: async (query) => {
    const response = await api.get(`/devices/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

/**
 * Zone API calls
 */
export const zoneAPI = {
  // Get all zones with device counts
  getAll: async () => {
    const response = await api.get('/zones');
    return response.data;
  },

  // Get single zone with devices
  getById: async (zoneName) => {
    const response = await api.get(`/zones/${encodeURIComponent(zoneName)}`);
    return response.data;
  },

  // Get devices for a zone
  getDevices: async (zoneName) => {
    const response = await api.get(`/zones/${encodeURIComponent(zoneName)}/devices`);
    return response.data;
  }
};

/**
 * Statistics API calls
 */
export const statsAPI = {
  // Get comprehensive dashboard statistics
  getDashboard: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Get basic overview
  getOverview: async () => {
    const response = await api.get('/stats/overview');
    return response.data;
  },

  // Get zone statistics
  getZones: async () => {
    const response = await api.get('/stats/zones');
    return response.data;
  },

  // Get status statistics
  getStatus: async () => {
    const response = await api.get('/stats/status');
    return response.data;
  },

  // Get device type statistics
  getDeviceTypes: async () => {
    const response = await api.get('/stats/device-types');
    return response.data;
  }
};

/**
 * Upload API calls
 */
export const uploadAPI = {
  // Upload Excel file
  uploadExcel: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return response.data;
  },

  // Validate Excel file without importing
  validateExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get upload status
  getStatus: async () => {
    const response = await api.get('/upload/status');
    return response.data;
  },

  // Clear all data
  clearData: async () => {
    const response = await api.delete('/upload/clear');
    return response.data;
  }
};

/**
 * Image API calls
 */
export const imageAPI = {
  // Upload images for a device
  upload: async (surveyCode, files, onProgress) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post(`/images/${encodeURIComponent(surveyCode)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return response.data;
  },

  // Get images for a device
  getByDevice: async (surveyCode) => {
    const response = await api.get(`/images/${encodeURIComponent(surveyCode)}`);
    return response.data;
  },

  // Delete an image
  delete: async (surveyCode, filename) => {
    const response = await api.delete(`/images/${encodeURIComponent(surveyCode)}/${filename}`);
    return response.data;
  }
};

/**
 * Health check
 */
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
