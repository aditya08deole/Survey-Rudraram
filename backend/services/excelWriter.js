/**
 * Excel Writer Service
 * 
 * Handles writing back to Excel files - specifically for updating image references.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Path to the current Excel file
let currentExcelPath = null;

/**
 * Set the path to the current Excel file
 */
const setCurrentExcelPath = (filePath) => {
  currentExcelPath = filePath;
};

/**
 * Get the current Excel file path
 */
const getCurrentExcelPath = () => {
  return currentExcelPath;
};

/**
 * Update the Images column for a specific device in the Excel file
 * @param {string} surveyCode - The Survey Code of the device
 * @param {string[]} imagePaths - Array of image paths/URLs
 * @returns {Object} - { success, message, error }
 */
const updateDeviceImages = (surveyCode, imagePaths) => {
  try {
    if (!currentExcelPath || !fs.existsSync(currentExcelPath)) {
      return {
        success: false,
        error: 'No Excel file loaded. Please upload an Excel file first.'
      };
    }

    // Read the current Excel file
    const workbook = XLSX.readFile(currentExcelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays to preserve structure
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
      return {
        success: false,
        error: 'Excel file is empty'
      };
    }

    // Find the header row and column indices
    const headers = data[0];
    const surveyCodeColIndex = headers.findIndex(h => 
      h && h.toString().includes('Survey Code')
    );
    const imagesColIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('images')
    );

    if (surveyCodeColIndex === -1) {
      return {
        success: false,
        error: 'Survey Code column not found in Excel'
      };
    }

    // If Images column doesn't exist, add it
    let actualImagesColIndex = imagesColIndex;
    if (imagesColIndex === -1) {
      actualImagesColIndex = headers.length;
      data[0].push('Images');
    }

    // Find the row with the matching Survey Code
    let rowFound = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowSurveyCode = row[surveyCodeColIndex];

      if (rowSurveyCode && rowSurveyCode.toString().trim() === surveyCode) {
        // Update the Images column with comma-separated paths
        const imageString = imagePaths.join(', ');
        
        // Ensure the row has enough columns
        while (row.length <= actualImagesColIndex) {
          row.push('');
        }
        
        row[actualImagesColIndex] = imageString;
        rowFound = true;
        break;
      }
    }

    if (!rowFound) {
      return {
        success: false,
        error: `Device with Survey Code "${surveyCode}" not found in Excel`
      };
    }

    // Convert back to worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;

    // Write back to file
    XLSX.writeFile(workbook, currentExcelPath);

    return {
      success: true,
      message: `Images updated for device ${surveyCode}`
    };

  } catch (error) {
    console.error('Error updating Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get device images from Excel
 * @param {string} surveyCode - The Survey Code of the device
 * @returns {string[]} - Array of image paths
 */
const getDeviceImagesFromExcel = (surveyCode) => {
  try {
    if (!currentExcelPath || !fs.existsSync(currentExcelPath)) {
      return [];
    }

    const workbook = XLSX.readFile(currentExcelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) return [];

    const headers = data[0];
    const surveyCodeColIndex = headers.findIndex(h => 
      h && h.toString().includes('Survey Code')
    );
    const imagesColIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('images')
    );

    if (surveyCodeColIndex === -1 || imagesColIndex === -1) {
      return [];
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[surveyCodeColIndex] === surveyCode) {
        const imagesValue = row[imagesColIndex];
        if (imagesValue && imagesValue.toString().trim()) {
          return imagesValue.toString().split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error reading images from Excel:', error);
    return [];
  }
};

module.exports = {
  setCurrentExcelPath,
  getCurrentExcelPath,
  updateDeviceImages,
  getDeviceImagesFromExcel
};
