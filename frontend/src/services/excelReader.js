/**
 * Excel Reader Service for GitHub Pages
 * 
 * Fetches and parses Excel file directly from GitHub repository.
 * No backend server required - everything runs in the browser.
 */

import * as XLSX from 'xlsx';

// Configuration
const GITHUB_CONFIG = {
  username: 'aditya08deole',
  repository: 'Survey-Rudraram',
  branch: 'main',
  excelPath: 'backend/data/rudraram_survey.xlsx'
};

/**
 * Generate the raw GitHub URL for the Excel file
 */
const getExcelUrl = () => {
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repository}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.excelPath}`;
};

/**
 * Fetch and parse Excel file from GitHub
 * @returns {Promise<Object>} - { success, devices, stats, errors, warnings }
 */
export const fetchAndParseExcel = async () => {
  const result = {
    success: false,
    devices: [],
    errors: [],
    warnings: [],
    stats: {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      mappedDevices: 0,
      unmappedDevices: 0
    },
    loadedAt: new Date().toISOString()
  };

  try {
    console.log('📊 Fetching Excel from GitHub:', getExcelUrl());

    // Fetch the Excel file
    const response = await fetch(getExcelUrl());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }

    // Get the file as array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Parse the workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('   📋 Available sheets:', workbook.SheetNames.join(', '));
    
    // Look for "All" sheet first, otherwise use first sheet
    let sheetName;
    if (workbook.SheetNames.includes('All')) {
      sheetName = 'All';
      console.log('   ✅ Using sheet: "All"');
    } else if (workbook.SheetNames.includes('all')) {
      sheetName = 'all';
      console.log('   ✅ Using sheet: "all"');
    } else {
      sheetName = workbook.SheetNames[0];
      console.log(`   ⚠️  Sheet "All" not found, using: "${sheetName}"`);
      result.warnings.push(`Expected sheet "All" not found, using "${sheetName}"`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      result.errors.push(`Sheet "${sheetName}" not found in Excel file`);
      return result;
    }
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`   📄 Total rows in sheet: ${rawData.length}`);
    
    if (rawData.length === 0) {
      result.errors.push('Excel file is empty or has no data rows');
      return result;
    }

    // Filter out zone headers and empty rows
    const dataRows = rawData.filter(row => {
      const surveyCode = row['Survey Code (ID)'] || '';
      if (surveyCode.toString().toUpperCase().startsWith('ZONE')) {
        return false;
      }
      if (!surveyCode || surveyCode.toString().trim() === '') {
        return false;
      }
      return true;
    });

    console.log(`   ✅ Data rows after filtering: ${dataRows.length}`);
    result.stats.totalRows = dataRows.length;

    // Parse each row into device object
    dataRows.forEach((row, index) => {
      const device = {
        surveyCode: row['Survey Code (ID)'] || '',
        zone: row['Zone'] || '',
        streetName: row['Street Name / Landmark'] || '',
        deviceType: row['Device Type'] || '',
        lat: parseFloat(row['Lat']) || null,
        long: parseFloat(row['Long']) || null,
        status: row['Status'] || '',
        housesConnected: parseInt(row['Houses Conn.']) || null,
        pipeSize: parseFloat(row['Pipe Size (inch)']) || null,
        motorHP: row['Motor HP / Cc'] || '',
        notes: row['Notes / Maintenance Issue'] || '',
        imagesRef: row['Images'] || ''
      };

      // Validate required fields
      if (!device.surveyCode || !device.zone || !device.deviceType || !device.status) {
        result.errors.push(`Row ${index + 2}: Missing required fields`);
        result.stats.invalidRows++;
        return;
      }

      // Check coordinates
      const hasLocation = device.lat !== null && device.long !== null && 
                         !isNaN(device.lat) && !isNaN(device.long);
      
      device.isMapped = hasLocation;

      if (!hasLocation) {
        result.stats.unmappedDevices++;
      } else {
        result.stats.mappedDevices++;
      }

      // Parse images (comma-separated URLs)
      if (device.imagesRef && typeof device.imagesRef === 'string' && device.imagesRef.trim()) {
        device.images = device.imagesRef
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0);
      } else {
        device.images = [];
      }

      result.devices.push(device);
      result.stats.validRows++;
    });

    result.success = result.devices.length > 0;

    console.log(`✅ Loaded ${result.devices.length} devices from Excel`);
    console.log(`   📍 Mapped: ${result.stats.mappedDevices}, Unmapped: ${result.stats.unmappedDevices}`);

  } catch (error) {
    console.error('❌ Error loading Excel from GitHub:', error);
    result.errors.push(`Failed to load Excel: ${error.message}`);
  }

  return result;
};

/**
 * Calculate statistics from devices
 * @param {Array} devices - Array of device objects
 * @returns {Object} - Statistics object
 */
export const calculateStats = (devices) => {
  if (!devices || devices.length === 0) {
    return {
      totalDevices: 0,
      byZone: {},
      byType: {},
      byStatus: {},
      mappedDevices: 0,
      unmappedDevices: 0
    };
  }

  const stats = {
    totalDevices: devices.length,
    byZone: {},
    byType: {},
    byStatus: {},
    mappedDevices: 0,
    unmappedDevices: 0
  };

  devices.forEach(device => {
    // Count by zone
    stats.byZone[device.zone] = (stats.byZone[device.zone] || 0) + 1;
    
    // Count by type
    stats.byType[device.deviceType] = (stats.byType[device.deviceType] || 0) + 1;
    
    // Count by status
    stats.byStatus[device.status] = (stats.byStatus[device.status] || 0) + 1;
    
    // Count mapped/unmapped
    if (device.isMapped) {
      stats.mappedDevices++;
    } else {
      stats.unmappedDevices++;
    }
  });

  return stats;
};

export default {
  fetchAndParseExcel,
  calculateStats,
  getExcelUrl
};
