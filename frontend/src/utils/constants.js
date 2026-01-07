/**
 * Constants
 * 
 * Centralized constants matching the backend configuration.
 */

// Zone configuration
export const ZONES = {
  'SC Colony': {
    id: 'Z1',
    name: 'SC Colony',
    population: 3000,
    color: '#FF6B6B', // Red - Northern area
    borderColor: '#C92A2A'
  },
  'Village': {
    id: 'Z2',
    name: 'Village',
    population: 5000,
    color: '#51CF66', // Green - Central area
    borderColor: '#2F9E44'
  },
  'Waddera': {
    id: 'Z3',
    name: 'Waddera',
    population: 4000,
    color: '#FFD93D', // Yellow - Southern area
    borderColor: '#F59F00'
  }
};

export const ZONE_LIST = Object.values(ZONES);
export const ZONE_NAMES = Object.keys(ZONES);

// Device types
export const DEVICE_TYPES = ['Borewell', 'Sump', 'OHT'];

// Device type marker configuration
export const DEVICE_MARKERS = {
  'Borewell': {
    shape: 'circle',
    icon: '⚫'
  },
  'Sump': {
    shape: 'square',
    icon: '⬛'
  },
  'OHT': {
    shape: 'triangle',
    icon: '🔺'
  }
};

// Status configuration
export const STATUS_CONFIG = {
  'Working': {
    color: '#22C55E',
    bgColor: '#DCFCE7',
    textColor: '#166534',
    label: 'Working'
  },
  'Not Work': {
    color: '#F97316',
    bgColor: '#FFEDD5',
    textColor: '#9A3412',
    label: 'Not Working'
  },
  'Failed': {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    label: 'Failed'
  }
};

export const STATUS_LIST = Object.keys(STATUS_CONFIG);

// Map configuration
export const MAP_CONFIG = {
  // Rudraram village center coordinates (Sangareddy district, Telangana)
  center: [17.563, 78.167], // Rudraram Village, Isnapur Municipality
  // Default zoom level (closer view to see village layout)
  defaultZoom: 15,
  // Min/Max zoom
  minZoom: 13,
  maxZoom: 20,
  // Google Maps API Key (loaded from environment variable - never commit the actual key!)
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
};

// Excel column display order (for device detail panel)
export const DEVICE_FIELDS = [
  { key: 'surveyCode', label: 'Survey Code (ID)', type: 'id' },
  { key: 'zone', label: 'Zone', type: 'zone' },
  { key: 'streetName', label: 'Street Name / Landmark', type: 'text' },
  { key: 'deviceType', label: 'Device Type', type: 'type' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'housesConnected', label: 'Houses Connected', type: 'number' },
  { key: 'dailyUsage', label: 'Daily Usage (Hrs)', type: 'number' },
  { key: 'pipeSize', label: 'Pipe Size (inch)', type: 'number' },
  { key: 'motorCapacity', label: 'Motor HP / Capacity', type: 'text' },
  { key: 'notes', label: 'Notes / Maintenance Issue', type: 'text' }
];

// Get status color
export const getStatusColor = (status) => {
  return STATUS_CONFIG[status]?.color || '#9CA3AF';
};

// Get zone color
export const getZoneColor = (zoneName) => {
  return ZONES[zoneName]?.color || '#9CA3AF';
};

// Get status badge class
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Working':
      return 'badge-success';
    case 'Not Work':
      return 'badge-warning';
    case 'Failed':
      return 'badge-danger';
    default:
      return '';
  }
};
