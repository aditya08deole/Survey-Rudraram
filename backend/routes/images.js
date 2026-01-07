/**
 * Image Routes
 * 
 * API endpoints for device image upload and retrieval.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const surveyCode = req.params.surveyCode;
    // Create directory for this device's images
    const uploadPath = path.join(__dirname, '../uploads/images', surveyCode);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4().slice(0, 8);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
};

const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
    files: 10 // Max 10 files at once
  }
});

/**
 * POST /api/images/:surveyCode
 * Upload images for a device
 */
router.post('/:surveyCode', uploadImages.array('images', 10), (req, res) => {
  try {
    const { surveyCode } = req.params;
    
    // Check if device exists
    const device = store.getDeviceById(surveyCode);
    if (!device) {
      // Delete uploaded files if device doesn't exist
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({
        success: false,
        error: `Device with Survey Code "${surveyCode}" not found`
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded'
      });
    }

    // Generate URLs for the uploaded images
    const imagePaths = req.files.map(file => {
      return `/uploads/images/${surveyCode}/${file.filename}`;
    });

    // Add images to the device
    const allImages = store.addDeviceImages(surveyCode, imagePaths);

    res.json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: allImages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/images/:surveyCode
 * Get all images for a device
 */
router.get('/:surveyCode', (req, res) => {
  try {
    const { surveyCode } = req.params;
    const images = store.getDeviceImages(surveyCode);
    
    res.json({
      success: true,
      surveyCode,
      count: images.length,
      images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/images/:surveyCode/:filename
 * Delete a specific image
 */
router.delete('/:surveyCode/:filename', (req, res) => {
  try {
    const { surveyCode, filename } = req.params;
    const imagePath = path.join(__dirname, '../uploads/images', surveyCode, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    fs.unlinkSync(imagePath);
    
    // Note: We'd need to update the store to remove the image reference
    // For simplicity, the image is just deleted from disk
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
