/**
 * Application Context
 * 
 * Global state management for the Rudraram Survey Dashboard.
 * Reads Excel file directly from GitHub (no backend required).
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchSurveyData, fetchDevicesFromDB, fetchStatsFromDB, fetchZonesFromDB } from '../services/apiService';
import { calculateStats } from '../services/excelReader';

// Initial state
const initialState = {
  // Data
  devices: [],
  zones: [],
  stats: null,

  // Data source
  useDatabase: true, // Use database API by default (set to false for Excel fallback)

  // Sheet selection (Excel mode)
  currentSheet: 'All',
  availableSheets: ['All'],

  // Selected/Active items
  selectedDevice: null,
  selectedZone: null,

  // Filters
  filters: {
    zone: '',
    deviceType: '',
    status: '',
    search: ''
  },

  // UI state
  isLoading: true,
  error: null,
  showDevicePanel: false,

  // Data status
  lastUpdated: null,
  hasData: false
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DEVICES: 'SET_DEVICES',
  SET_ZONES: 'SET_ZONES',
  SET_STATS: 'SET_STATS',
  SET_SELECTED_DEVICE: 'SET_SELECTED_DEVICE',
  SET_SELECTED_ZONE: 'SET_SELECTED_ZONE',
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  SHOW_DEVICE_PANEL: 'SHOW_DEVICE_PANEL',
  HIDE_DEVICE_PANEL: 'HIDE_DEVICE_PANEL',
  SET_DATA_STATUS: 'SET_DATA_STATUS',
  REFRESH_DATA: 'REFRESH_DATA',
  SET_CURRENT_SHEET: 'SET_CURRENT_SHEET',
  SET_AVAILABLE_SHEETS: 'SET_AVAILABLE_SHEETS'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.SET_DEVICES:
      return { ...state, devices: action.payload };

    case ActionTypes.SET_ZONES:
      return { ...state, zones: action.payload };

    case ActionTypes.SET_STATS:
      return { ...state, stats: action.payload };

    case ActionTypes.SET_SELECTED_DEVICE:
      return {
        ...state,
        selectedDevice: action.payload,
        showDevicePanel: !!action.payload
      };

    case ActionTypes.SET_SELECTED_ZONE:
      return {
        ...state,
        selectedZone: action.payload,
        filters: {
          ...state.filters,
          zone: action.payload || ''
        }
      };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: {
          zone: '',
          deviceType: '',
          status: '',
          search: ''
        }
      };

    case ActionTypes.SHOW_DEVICE_PANEL:
      return { ...state, showDevicePanel: true };

    case ActionTypes.HIDE_DEVICE_PANEL:
      return { ...state, showDevicePanel: false, selectedDevice: null };

    case ActionTypes.SET_DATA_STATUS:
      return {
        ...state,
        hasData: action.payload.hasData,
        lastUpdated: action.payload.lastUpdated
      };

    case ActionTypes.SET_CURRENT_SHEET:
      return {
        ...state,
        currentSheet: action.payload
      };

    case ActionTypes.SET_AVAILABLE_SHEETS:
      return {
        ...state,
        availableSheets: action.payload
      };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    if (state.useDatabase) {
      loadDatabaseData();
    } else {
      loadData(state.currentSheet);
    }
  }, [state.currentSheet, state.useDatabase]);

  // Function to load data from DATABASE API (new Supabase integration)
  const loadDatabaseData = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });

    try {
      // Fetch all devices from database
      const devicesResult = await fetchDevicesFromDB();

      if (!devicesResult.success || !devicesResult.devices) {
        throw new Error(devicesResult.error || 'Failed to load devices from database');
      }

      const devices = devicesResult.devices;

      // Smart Fallback: If database is empty, try Excel
      if (!devices || devices.length === 0) {
        console.warn('⚠️ Database is empty. Falling back to Excel (Legacy Mode)...');
        loadData('All');
        return;
      }

      // Transform database schema to match frontend expectations
      // Transform database schema to match frontend expectations
      const typeMap = { borewell: 'Borewell', sump: 'Sump', overhead_tank: 'OHSR', ohsr: 'OHSR', oht: 'OHSR' }; // Added lowercase variants

      const transformedDevices = devices.map(device => {
        let dType = typeMap[device.device_type?.toLowerCase()] || device.device_type;

        // Robust Fallback: Infer from Survey Code or Name if type is missing/unknown
        if (!dType || dType === 'Unknown') {
          const code = (device.survey_code || device.original_name || '').toUpperCase();
          if (code.includes('BW') || code.includes('BORE')) dType = 'Borewell';
          else if (code.includes('SM') || code.includes('SUMP')) dType = 'Sump';
          else if (code.includes('OH') || code.includes('OHSR') || code.includes('OHT')) dType = 'OHSR';
          else dType = 'Unknown';
        }

        return {
          // Standardized fields
          surveyCode: device.survey_code || device.sr_no,
          deviceType: dType,
          zone: device.zone,
          location: device.location,
          status: device.status || 'Unknown',

          // Coordinates
          lat: parseFloat(device.latitude),
          long: parseFloat(device.longitude),
          lng: parseFloat(device.longitude),

          // Device-specific fields
          ...device,

          // Street name from location
          streetName: device.location || device.original_name
        }
      });

      // Fetch statistics
      const statsResult = await fetchStatsFromDB();
      const dbStats = statsResult.success ? statsResult.stats : {};

      // Fetch zones
      const zonesResult = await fetchZonesFromDB();
      const zonesList = zonesResult.success ? zonesResult.zones : [];

      const zonesWithCounts = zonesList.map(zoneName => ({
        name: zoneName,
        deviceCount: transformedDevices.filter(d => d.zone === zoneName).length
      }));

      // Calculate additional stats
      const mappedDevices = transformedDevices.filter(d => d.lat && d.long).length;

      // Transform device types for Dashboard display
      const deviceTypesArray = Object.entries(dbStats.by_type || {}).map(([type, count]) => ({
        type: type === 'borewell' ? 'Borewell' : type === 'sump' ? 'Sump' : type === 'overhead_tank' ? 'OHSR' : type,
        count: count
      }));

      // Transform status breakdown
      const statusArray = Object.entries(dbStats.by_status || {}).map(([status, count]) => ({
        status: status,
        count: count
      }));

      // Transform zones
      const zonesArray = Object.entries(dbStats.by_zone || {}).map(([zone, count]) => ({
        zone: zone,
        count: count
      }));

      dispatch({ type: ActionTypes.SET_DEVICES, payload: transformedDevices });
      dispatch({ type: ActionTypes.SET_ZONES, payload: zonesWithCounts });
      dispatch({
        type: ActionTypes.SET_STATS, payload: {
          overview: {
            totalDevices: transformedDevices.length,
            mappedDevices: mappedDevices,
            unmappedDevices: transformedDevices.length - mappedDevices,
            lastUpdated: new Date().toISOString()
          },
          byType: dbStats.by_type || {},
          byStatus: dbStats.by_status || {},
          byZone: dbStats.by_zone || {},
          deviceTypes: deviceTypesArray,
          statusBreakdown: statusArray,
          zones: zonesArray,
          summary: {
            totalBorewells: dbStats.by_type?.borewell || 0,
            totalSumps: dbStats.by_type?.sump || 0,
            totalOHSR: dbStats.by_type?.overhead_tank || 0,
            workingDevices: dbStats.by_status?.Working || 0,
            notWorkingDevices: dbStats.by_status?.['Not Working'] || 0
          }
        }
      });
      dispatch({
        type: ActionTypes.SET_DATA_STATUS,
        payload: {
          hasData: transformedDevices.length > 0,
          lastUpdated: new Date().toISOString()
        }
      });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      console.log('✅ Database loaded:', {
        devices: transformedDevices.length,
        zones: zonesWithCounts.length,
        stats: dbStats
      });

    } catch (error) {
      console.error('Failed to load database:', error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: `Failed to load data from database: ${error.message}`
      });
    }

    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  };

  // Function to load all data from Excel API backend (legacy)
  const loadData = async (sheetName = 'All') => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });

    try {
      // Fetch data from FastAPI backend with sheet parameter
      const result = await fetchSurveyData(sheetName);

      if (!result.success) {
        throw new Error(result.errors.join(', ') || 'Failed to load data from API');
      }

      // Calculate statistics
      const stats = calculateStats(result.devices);

      // Extract unique zones
      const zones = [...new Set(result.devices.map(d => d.zone))]
        .filter(Boolean)
        .map(zoneName => ({
          name: zoneName,
          deviceCount: result.devices.filter(d => d.zone === zoneName).length
        }));

      dispatch({ type: ActionTypes.SET_DEVICES, payload: result.devices });
      dispatch({ type: ActionTypes.SET_ZONES, payload: zones });
      dispatch({
        type: ActionTypes.SET_STATS, payload: {
          overview: {
            totalDevices: stats.totalDevices,
            mappedDevices: stats.mappedDevices,
            unmappedDevices: stats.unmappedDevices,
            lastUpdated: result.loadedAt
          },
          byZone: stats.byZone,
          byType: stats.byType,
          byStatus: stats.byStatus
        }
      });
      dispatch({
        type: ActionTypes.SET_DATA_STATUS,
        payload: {
          hasData: result.devices.length > 0,
          lastUpdated: result.loadedAt
        }
      });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      // Log warnings if any
      if (result.warnings.length > 0) {
        console.warn('⚠️  Warnings during Excel load:', result.warnings);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: `Failed to load Excel file from GitHub: ${error.message}`
      });
    }

    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  };

  // Filter devices based on current filters
  const getFilteredDevices = () => {
    let filtered = [...state.devices];

    if (state.filters.zone) {
      filtered = filtered.filter(d => d.zone === state.filters.zone);
    }
    if (state.filters.deviceType) {
      filtered = filtered.filter(d => d.deviceType === state.filters.deviceType);
    }
    if (state.filters.status) {
      filtered = filtered.filter(d => d.status === state.filters.status);
    }
    if (state.filters.search) {
      const query = state.filters.search.toLowerCase();
      filtered = filtered.filter(d =>
        d.surveyCode.toLowerCase().includes(query) ||
        (d.streetName && d.streetName.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  // Get only mapped devices (with coordinates)
  const getMappedDevices = () => {
    return getFilteredDevices().filter(d =>
      d.lat && d.long && !isNaN(d.lat) && !isNaN(d.long)
    );
  };

  // Actions
  const actions = {
    refreshData: () => {
      if (state.useDatabase) {
        loadDatabaseData();
      } else {
        loadData(state.currentSheet);
      }
    },

    toggleDataSource: () => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      // Toggle between database and Excel
      const newValue = !state.useDatabase;
      // Manually update state and reload
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });
      if (newValue) {
        loadDatabaseData();
      } else {
        loadData(state.currentSheet);
      }
    },

    setCurrentSheet: (sheetName) => {
      dispatch({ type: ActionTypes.SET_CURRENT_SHEET, payload: sheetName });
    },

    setAvailableSheets: (sheets) => {
      dispatch({ type: ActionTypes.SET_AVAILABLE_SHEETS, payload: sheets });
    },

    setSelectedDevice: (device) => {
      dispatch({ type: ActionTypes.SET_SELECTED_DEVICE, payload: device });
    },

    setSelectedZone: (zone) => {
      dispatch({ type: ActionTypes.SET_SELECTED_ZONE, payload: zone });
    },

    setFilters: (filters) => {
      dispatch({ type: ActionTypes.SET_FILTERS, payload: filters });
    },

    resetFilters: () => {
      dispatch({ type: ActionTypes.RESET_FILTERS });
    },

    hideDevicePanel: () => {
      dispatch({ type: ActionTypes.HIDE_DEVICE_PANEL });
    },

    showDevicePanel: () => {
      dispatch({ type: ActionTypes.SHOW_DEVICE_PANEL });
    }
  };

  const value = {
    ...state,
    ...actions,
    getFilteredDevices,
    getMappedDevices
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
