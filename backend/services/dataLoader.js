/**
 * Data Loader Service
 * 
 * Loads and parses the Excel file from the repository at startup.
 * The Excel file is the single source of truth - no database, no uploads.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { REQUIRED_COLUMNS, EXCEL_COLUMNS } = require('../config/schema');
const { isValidZone } = require('../config/zones');
const { isValidDeviceType, isValidStatus } = require('../config/deviceTypes');

// Fixed path to the Excel file in the repository
const EXCEL_FILE_PATH = path.join(__dirname, '../data/rudraram_survey.xlsx');

/**
 * Load and parse the Excel file from the repository
 * Called once at server startup
 * @returns {Object} - { success, devices, stats, errors, warnings }
 */
const loadExcelData = () => {
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
    // Check if file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      result.errors.push(`Excel file not found at: ${EXCEL_FILE_PATH}`);
      console.error('❌ Excel file not found:', EXCEL_FILE_PATH);
      return result;
    }

    console.log('📊 Loading Excel data from:', EXCEL_FILE_PATH);

    // Read the Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (array of objects)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (rawData.length === 0) {
      result.errors.push('Excel file is empty or has no data rows');
      return result;
    }

    // Validate headers (required columns)
    const headers = Object.keys(rawData[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      result.warnings.push(`Missing columns: ${missingColumns.join(', ')}`);
    }

    // Track unique survey codes
    const surveyCodesSeen = new Set();

    // Filter out zone header rows and empty rows
    const dataRows = rawData.filter(row => {
      const surveyCode = row['Survey Code (ID)'] || '';
      // Skip rows that are zone headers
      if (surveyCode.toString().toUpperCase().startsWith('ZONE')) {
        return false;
      }
      // Skip completely empty rows
      if (!surveyCode || surveyCode.toString().trim() === '') {
        return false;
      }
      return true;
    });

    result.stats.totalRows = dataRows.length;

    // Parse each row
    dataRows.forEach((row, index) => {
      const rowNum = index + 2;
      const device = {};
      const rowErrors = [];
      const rowWarnings = [];

      // Map Excel columns to internal keys
      EXCEL_COLUMNS.forEach(colDef => {
        const excelValue = row[colDef.excelHeader];
        let value = excelValue;

        // Type conversion
        switch (colDef.type) {
          case 'integer':
            value = parseInt(excelValue, 10);
            if (isNaN(value)) value = null;
            break;
          case 'float':
            value = parseFloat(excelValue);
            if (isNaN(value)) value = null;
            break;
          case 'string':
          case 'text':
            value = excelValue ? String(excelValue).trim() : '';
            break;
          case 'enum':
            value = excelValue ? String(excelValue).trim() : '';
            break;
          default:
            value = excelValue;
        }

        device[colDef.key] = value;
      });

      // Validate required fields
      if (!device.surveyCode || device.surveyCode === '') {
        rowErrors.push(`Row ${rowNum}: Missing Survey Code (ID)`);
      } else if (surveyCodesSeen.has(device.surveyCode)) {
        rowErrors.push(`Row ${rowNum}: Duplicate Survey Code "${device.surveyCode}"`);
      } else {
        surveyCodesSeen.add(device.surveyCode);
      }

      // Validate Zone
      if (!device.zone || !isValidZone(device.zone)) {
        rowErrors.push(`Row ${rowNum}: Invalid Zone "${device.zone}"`);
      }

      // Validate Device Type
      if (!device.deviceType || !isValidDeviceType(device.deviceType)) {
        rowErrors.push(`Row ${rowNum}: Invalid Device Type "${device.deviceType}"`);
      }

      // Validate Status
      if (!device.status || !isValidStatus(device.status)) {
        rowErrors.push(`Row ${rowNum}: Invalid Status "${device.status}"`);
      }

      // Check for location data
      const hasLocation = device.lat !== null && device.long !== null && 
                         !isNaN(device.lat) && !isNaN(device.long);
      
      if (!hasLocation) {
        rowWarnings.push(`Row ${rowNum} (${device.surveyCode}): No coordinates - table only`);
        result.stats.unmappedDevices++;
      } else {
        result.stats.mappedDevices++;
      }

      // Add computed fields
      device.isMapped = hasLocation;
      device.images = [];

      // Parse images from Excel (comma-separated paths)
      if (device.imagesRef && device.imagesRef.trim()) {
        device.images = device.imagesRef.split(',').map(s => s.trim()).filter(Boolean);
      }

      // Add to result
      if (rowErrors.length === 0) {
        result.devices.push(device);
        result.stats.validRows++;
      } else {
        result.errors.push(...rowErrors);
        result.stats.invalidRows++;
      }
      
      result.warnings.push(...rowWarnings);
    });

    result.success = result.devices.length > 0;

    // Log summary
    console.log(`✅ Loaded ${result.devices.length} devices from Excel`);
    console.log(`   📍 Mapped: ${result.stats.mappedDevices}, Unmapped: ${result.stats.unmappedDevices}`);
    
    if (result.errors.length > 0) {
      console.log(`   ⚠️  ${result.errors.length} errors`);
    }

  } catch (error) {
    console.error('❌ Error loading Excel:', error);
    result.errors.push(`Failed to load Excel: ${error.message}`);
  }

  return result;
};

/**
 * Get the path to the Excel file
 */
const getExcelFilePath = () => {
  return EXCEL_FILE_PATH;
};

/**
 * Check if Excel file exists
 */
const excelFileExists = () => {
  return fs.existsSync(EXCEL_FILE_PATH);
};

module.exports = {
  loadExcelData,
  getExcelFilePath,
  excelFileExists,
  EXCEL_FILE_PATH
};
