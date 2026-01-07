/**
 * Upload Routes
 * 
 * API endpoints for Excel file upload and data ingestion.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseExcelFile, validateExcelHeaders } = require('../services/excelParser');
const store = require('../data/store');
const excelWriter = require('../services/excelWriter');

// Configure multer for Excel file uploads
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `survey_${timestamp}${ext}`);
  }
});

const excelFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || ['.xlsx', '.xls'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
  }
};

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * POST /api/upload/excel
 * Upload and process Excel file
 */
router.post('/excel', uploadExcel.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    
    // Parse and validate the Excel file
    const result = parseExcelFile(filePath);
    
    if (!result.success && result.devices.length === 0) {
      // Delete the uploaded file if parsing failed completely
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        error: 'Failed to parse Excel file',
        details: result.errors
      });
    }

    // Store the parsed devices
    store.setDevices(result.devices);

    // Save the Excel file path for future updates (image sync)
    excelWriter.setCurrentExcelPath(filePath);

    res.json({
      success: true,
      message: 'Excel file processed successfully',
      stats: result.stats,
      warnings: result.warnings,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/upload/validate
 * Validate Excel file without importing
 */
router.post('/validate', uploadExcel.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const validation = validateExcelHeaders(filePath);
    
    // Delete the file after validation (we're just checking)
    fs.unlinkSync(filePath);

    res.json({
      success: validation.valid,
      validation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/upload/status
 * Get current data status
 */
router.get('/status', (req, res) => {
  try {
    const deviceCount = store.getDeviceCount();
    const lastUpload = store.getLastUpload();
    
    res.json({
      success: true,
      hasData: deviceCount > 0,
      deviceCount,
      lastUpload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/upload/clear
 * Clear all device data (admin only)
 */
router.delete('/clear', (req, res) => {
  try {
    store.clearDevices();
    res.json({
      success: true,
      message: 'All device data cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
