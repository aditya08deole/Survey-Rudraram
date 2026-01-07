/**
 * Excel Parser Service
 * 
 * Handles parsing and validation of Excel files according to the locked schema.
 */

const XLSX = require('xlsx');
const { REQUIRED_COLUMNS, EXCEL_COLUMNS, headerToKey } = require('../config/schema');
const { isValidZone } = require('../config/zones');
const { isValidDeviceType, isValidStatus } = require('../config/deviceTypes');

/**
 * Parse Excel file and return validated devices
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} - { success, devices, errors, warnings }
 */
const parseExcelFile = (filePath) => {
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
    }
  };

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (array of objects)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (rawData.length === 0) {
      result.errors.push('Excel file is empty or has no data rows');
      return result;
    }

    result.stats.totalRows = rawData.length;

    // Validate headers (required columns)
    const headers = Object.keys(rawData[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      return result;
    }

    // Track unique survey codes
    const surveyCodesSeen = new Set();

    // Filter out zone header rows (rows where Survey Code starts with "ZONE")
    const dataRows = rawData.filter(row => {
      const surveyCode = row['Survey Code (ID)'] || '';
      // Skip rows that are zone headers (e.g., "ZONE 1: SC COLONY - POPULATION 3000 PEOPLES")
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
      const rowNum = index + 2; // Excel row number (1-indexed + header)
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
        rowErrors.push(`Row ${rowNum}: Invalid or missing Zone "${device.zone}". Must be one of: SC Colony, Village, Waddera`);
      }

      // Validate Device Type
      if (!device.deviceType || !isValidDeviceType(device.deviceType)) {
        rowErrors.push(`Row ${rowNum}: Invalid or missing Device Type "${device.deviceType}". Must be one of: Borewell, Sump, OHT`);
      }

      // Validate Status
      if (!device.status || !isValidStatus(device.status)) {
        rowErrors.push(`Row ${rowNum}: Invalid or missing Status "${device.status}". Must be one of: Working, Not Work, Failed`);
      }

      // Check for location data
      const hasLocation = device.lat !== null && device.long !== null && 
                         !isNaN(device.lat) && !isNaN(device.long);
      
      if (!hasLocation) {
        rowWarnings.push(`Row ${rowNum} (${device.surveyCode}): Missing or invalid coordinates - device will appear in table only, not on map`);
        result.stats.unmappedDevices++;
      } else {
        // Validate coordinate ranges (Telangana approximate bounds)
        if (device.lat < 15 || device.lat > 20 || device.long < 76 || device.long > 82) {
          rowWarnings.push(`Row ${rowNum} (${device.surveyCode}): Coordinates may be outside Telangana region`);
        }
        result.stats.mappedDevices++;
      }

      // Add computed fields
      device.isMapped = hasLocation;
      device.images = [];

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

    result.success = result.stats.validRows > 0;
    
  } catch (error) {
    result.errors.push(`Failed to parse Excel file: ${error.message}`);
  }

  return result;
};

/**
 * Validate Excel file headers only
 */
const validateExcelHeaders = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (rawData.length === 0) {
      return { valid: false, error: 'Excel file is empty' };
    }

    const headers = Object.keys(rawData[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return { 
        valid: false, 
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        foundHeaders: headers,
        missingColumns
      };
    }

    return { valid: true, headers, rowCount: rawData.length };
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  parseExcelFile,
  validateExcelHeaders
};
