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
    
    console.log('   📋 Available sheets:', workbook.SheetNames.join(', '));
    
    // Look for a sheet named "All" first, otherwise use the first sheet
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
      console.error('❌ Sheet not found:', sheetName);
      return result;
    }
    
    // Convert to JSON (array of objects)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`   📄 Total rows in sheet: ${rawData.length}`);
    
    if (rawData.length === 0) {
      result.errors.push('Excel file is empty or has no data rows');
      console.error('❌ No data rows found in sheet');
      return result;
    }

    // Validate headers (required columns)
    const headers = Object.keys(rawData[0]);
    console.log(`   📋 Found ${headers.length} columns in Excel`);
    
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      console.error('❌ Missing required columns:', missingColumns);
      console.error('   Available columns:', headers);
      return result;
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

    console.log(`   ✅ Data rows after filtering: ${dataRows.length}`);
    result.stats.totalRows = dataRows.length;
    
    if (dataRows.length === 0) {
      result.errors.push('No valid data rows found after filtering');
      console.error('❌ All rows were filtered out (zone headers or empty)');
      return result;
    }

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
      
      // Parse images from Excel (comma-separated URLs/paths in the Images column)
      if (device.imagesRef && typeof device.imagesRef === 'string' && device.imagesRef.trim()) {
        device.images = device.imagesRef
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0);
      } else {
        device.images = [];
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
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║   ✅ LOADED ${result.devices.length} DEVICES FROM EXCEL`.padEnd(60) + '║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║   📍 Mapped: ${result.stats.mappedDevices}, Unmapped: ${result.stats.unmappedDevices}`.padEnd(60) + '║');
    console.log(`║   ✓ Valid Rows: ${result.stats.validRows}, Invalid: ${result.stats.invalidRows}`.padEnd(60) + '║');
    
    if (result.errors.length > 0) {
      console.log(`║   ⚠️  Errors: ${result.errors.length}`.padEnd(60) + '║');
    }
    if (result.warnings.length > 0) {
      console.log(`║   ⚠️  Warnings: ${result.warnings.length}`.padEnd(60) + '║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝\n');

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
