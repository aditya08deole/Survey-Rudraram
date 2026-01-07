/**
 * Utility Functions
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Format a number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString();
};

/**
 * Format a date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Export data to Excel
 */
export const exportToExcel = (data, filename = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Save file
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${Date.now()}.xlsx`);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${Date.now()}.csv`);
};

/**
 * Prepare device data for export
 */
export const prepareDevicesForExport = (devices) => {
  return devices.map(device => ({
    'Survey Code (ID)': device.surveyCode,
    'Zone': device.zone,
    'Street Name / Landmark': device.streetName || '',
    'Device Type': device.deviceType,
    'Lat': device.lat || '',
    'Long': device.long || '',
    'Status': device.status,
    'Houses Conn.': device.housesConnected || '',
    'Daily Usage (Hrs)': device.dailyUsage || '',
    'Pipe Size (inch)': device.pipeSize || '',
    'Motor HP / Cap': device.motorCapacity || '',
    'Notes / Maintenance Issue': device.notes || ''
  }));
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Check if coordinates are valid
 */
export const hasValidCoordinates = (device) => {
  return device.lat && device.long && 
         !isNaN(device.lat) && !isNaN(device.long) &&
         device.lat !== 0 && device.long !== 0;
};

/**
 * Group devices by zone
 */
export const groupByZone = (devices) => {
  return devices.reduce((acc, device) => {
    const zone = device.zone || 'Unknown';
    if (!acc[zone]) {
      acc[zone] = [];
    }
    acc[zone].push(device);
    return acc;
  }, {});
};

/**
 * Group devices by device type
 */
export const groupByDeviceType = (devices) => {
  return devices.reduce((acc, device) => {
    const type = device.deviceType || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(device);
    return acc;
  }, {});
};

/**
 * Group devices by status
 */
export const groupByStatus = (devices) => {
  return devices.reduce((acc, device) => {
    const status = device.status || 'Unknown';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(device);
    return acc;
  }, {});
};

/**
 * Calculate device statistics
 */
export const calculateDeviceStats = (devices) => {
  const total = devices.length;
  const working = devices.filter(d => d.status === 'Working').length;
  const notWorking = devices.filter(d => d.status === 'Not Work').length;
  const failed = devices.filter(d => d.status === 'Failed').length;
  
  const borewells = devices.filter(d => d.deviceType === 'Borewell').length;
  const sumps = devices.filter(d => d.deviceType === 'Sump').length;
  const ohts = devices.filter(d => d.deviceType === 'OHT').length;
  
  const mapped = devices.filter(d => hasValidCoordinates(d)).length;
  const unmapped = total - mapped;
  
  const totalHouses = devices.reduce((sum, d) => sum + (d.housesConnected || 0), 0);
  
  return {
    total,
    working,
    notWorking,
    failed,
    borewells,
    sumps,
    ohts,
    mapped,
    unmapped,
    totalHouses,
    workingPercentage: calculatePercentage(working, total),
    healthScore: calculatePercentage(working, total)
  };
};
