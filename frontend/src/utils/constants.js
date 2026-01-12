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
export const DEVICE_TYPES = ['Borewell', 'Sump', 'OHSR'];

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
  'OHSR': {
    shape: 'triangle',
    icon: '🔺'
  }
};

// Status configuration with neon colors
export const STATUS_CONFIG = {
  'Working': {
    color: '#00FF41', // Neon green
    bgColor: '#DCFCE7',
    textColor: '#166534',
    glowColor: 'rgba(0, 255, 65, 0.6)',
    label: 'Working'
  },
  'Not Work': {
    color: '#FF4500', // Neon orange-red
    bgColor: '#FFEDD5',
    textColor: '#9A3412',
    glowColor: 'rgba(255, 69, 0, 0.6)',
    label: 'Not Working'
  },
  'Failed': {
    color: '#FF0040', // Neon red
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
    glowColor: 'rgba(255, 0, 64, 0.6)',
    label: 'Failed'
  }
};

export const STATUS_LIST = Object.keys(STATUS_CONFIG);

// Map configuration
export const MAP_CONFIG = {
  // Rudraram village center coordinates (exact focus area)
  center: [17.558599, 78.166078], // Rudraram focus area
  // Default zoom level (15 for clear area view)
  defaultZoom: 15,
  // Min/Max zoom
  minZoom: 10,
  maxZoom: 30,
  // OpenStreetMap tile providers
  tileProviders: {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxNativeZoom: 19
    },
    satellite: {
      // Switched to Google Hybrid for better performance ("microsec load") and labels ("satellite hybrid")
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      maxNativeZoom: 20 // Google supports higher native zoom
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxNativeZoom: 17
    }
  }
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
