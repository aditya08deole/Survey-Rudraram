/**
 * API Configuration and Service
 * 
 * Centralized API calls to the backend.
 * Data is read-only - loaded from Excel file in the repository.
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
 * Device API calls (read-only)
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
 * Zone API calls (read-only)
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
 * Statistics API calls (read-only)
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
 * Health check and data info
 */
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getDataInfo = async () => {
  const response = await api.get('/info');
  return response.data;
};

export default api;
