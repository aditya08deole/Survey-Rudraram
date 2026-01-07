/**
 * Device Type Configuration
 * 
 * Defines the valid device types and their visual properties.
 */

const DEVICE_TYPES = {
  'Borewell': {
    id: 'borewell',
    name: 'Borewell',
    marker: 'circle',
    icon: '⚫',
    description: 'Underground borewell for water extraction'
  },
  'Sump': {
    id: 'sump',
    name: 'Sump',
    marker: 'square',
    icon: '⬛',
    description: 'Underground water storage tank'
  },
  'OHT': {
    id: 'oht',
    name: 'OHT',
    marker: 'triangle',
    icon: '🔺',
    description: 'Overhead Tank for water distribution'
  }
};

// Valid device type names
const VALID_DEVICE_TYPES = Object.keys(DEVICE_TYPES);

// Status color mapping
const STATUS_COLORS = {
  'Working': '#22C55E',    // Green
  'Not Work': '#F97316',   // Orange
  'Failed': '#EF4444'      // Red
};

// Valid status values
const VALID_STATUSES = Object.keys(STATUS_COLORS);

// Get device type config
const getDeviceType = (typeName) => {
  return DEVICE_TYPES[typeName] || null;
};

// Validate device type
const isValidDeviceType = (typeName) => {
  return VALID_DEVICE_TYPES.includes(typeName);
};

// Validate status
const isValidStatus = (status) => {
  return VALID_STATUSES.includes(status);
};

// Get status color
const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#9CA3AF'; // Gray for unknown
};

module.exports = {
  DEVICE_TYPES,
  VALID_DEVICE_TYPES,
  STATUS_COLORS,
  VALID_STATUSES,
  getDeviceType,
  isValidDeviceType,
  isValidStatus,
  getStatusColor
};
