/**
 * Admin Upload Page
 * 
 * Allows administrators to upload Excel files and manage device images.
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Trash2,
  Image,
  Info
} from 'lucide-react';
import { uploadAPI, imageAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/helpers';
import './AdminUpload.css';

function AdminUpload() {
  const { refreshData, hasData, lastUpdated, devices } = useApp();
  
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Image upload states
  const [selectedDevice, setSelectedDevice] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUploadState, setImageUploadState] = useState('idle');
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadState('idle');
      setUploadResult(null);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setUploadState('idle');
        setUploadResult(null);
      } else {
        setUploadResult({
          success: false,
          error: 'Please upload an Excel file (.xlsx or .xls)'
        });
      }
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(0);

    try {
      const result = await uploadAPI.uploadExcel(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadState('success');
      setUploadResult(result);
      
      // Refresh the app data
      await refreshData();
      
      // Clear selected file after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadState('error');
      setUploadResult({
        success: false,
        error: error.response?.data?.error || error.message || 'Upload failed'
      });
    }
  };

  // Handle clear data
  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all device data? This action cannot be undone.')) {
      return;
    }

    try {
      await uploadAPI.clearData();
      await refreshData();
      setUploadResult({
        success: true,
        message: 'All data has been cleared'
      });
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.message || 'Failed to clear data'
      });
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedDevice || imageFiles.length === 0) return;

    setImageUploadState('uploading');

    try {
      await imageAPI.upload(selectedDevice, imageFiles);
      setImageUploadState('success');
      setImageFiles([]);
      setSelectedDevice('');
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      await refreshData();
    } catch (error) {
      setImageUploadState('error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin - Data Management</h1>
        <p className="admin-subtitle">Upload Excel files and manage device images</p>
      </div>

      <div className="admin-grid">
        {/* Excel Upload Section */}
        <section className="admin-section">
          <div className="section-header">
            <h2>
              <FileSpreadsheet size={20} />
              Excel Data Upload
            </h2>
          </div>

          <div className="section-content">
            {/* Current Status */}
            <div className="status-card">
              <div className="status-info">
                <span className="status-label">Current Data Status</span>
                <span className={`status-value ${hasData ? 'has-data' : 'no-data'}`}>
                  {hasData ? 'Data Loaded' : 'No Data'}
                </span>
              </div>
              {lastUpdated && (
                <div className="status-info">
                  <span className="status-label">Last Updated</span>
                  <span className="status-value">{formatDate(lastUpdated)}</span>
                </div>
              )}
            </div>

            {/* Drop Zone */}
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="file-selected">
                  <FileSpreadsheet size={32} />
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <div className="drop-content">
                  <Upload size={32} />
                  <p className="drop-text">
                    Drag and drop Excel file here, or click to browse
                  </p>
                  <span className="drop-hint">Supports .xlsx and .xls files</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button 
              className="btn btn-primary btn-lg upload-btn"
              onClick={handleUpload}
              disabled={!selectedFile || uploadState === 'uploading'}
            >
              {uploadState === 'uploading' ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Excel File
                </>
              )}
            </button>

            {/* Upload Progress */}
            {uploadState === 'uploading' && (
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className={`result-card ${uploadResult.success ? 'success' : 'error'}`}>
                {uploadResult.success ? (
                  <>
                    <CheckCircle size={20} />
                    <div className="result-content">
                      <strong>{uploadResult.message || 'Upload Successful!'}</strong>
                      {uploadResult.stats && (
                        <div className="result-stats">
                          <span>Total Rows: {uploadResult.stats.totalRows}</span>
                          <span>Valid: {uploadResult.stats.validRows}</span>
                          <span>Mapped: {uploadResult.stats.mappedDevices}</span>
                        </div>
                      )}
                      {uploadResult.warnings?.length > 0 && (
                        <div className="result-warnings">
                          <AlertTriangle size={14} />
                          <span>{uploadResult.warnings.length} warning(s)</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={20} />
                    <div className="result-content">
                      <strong>Upload Failed</strong>
                      <p>{uploadResult.error}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Clear Data Button */}
            {hasData && (
              <button 
                className="btn btn-outline danger clear-btn"
                onClick={handleClearData}
              >
                <Trash2 size={16} />
                Clear All Data
              </button>
            )}
          </div>
        </section>

        {/* Image Upload Section */}
        <section className="admin-section">
          <div className="section-header">
            <h2>
              <Image size={20} />
              Device Image Upload
            </h2>
          </div>

          <div className="section-content">
            {!hasData ? (
              <div className="info-card">
                <Info size={20} />
                <p>Upload Excel data first before adding device images.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Select Device (Survey Code)</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Select a device --</option>
                    {devices.map(device => (
                      <option key={device.surveyCode} value={device.surveyCode}>
                        {device.surveyCode} - {device.zone} ({device.deviceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Images</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="form-input"
                  />
                  {imageFiles.length > 0 && (
                    <span className="file-count">
                      {imageFiles.length} file(s) selected
                    </span>
                  )}
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={handleImageUpload}
                  disabled={!selectedDevice || imageFiles.length === 0 || imageUploadState === 'uploading'}
                >
                  {imageUploadState === 'uploading' ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Images
                    </>
                  )}
                </button>

                {imageUploadState === 'success' && (
                  <div className="result-card success small">
                    <CheckCircle size={16} />
                    <span>Images uploaded successfully!</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Schema Info Section */}
        <section className="admin-section schema-section">
          <div className="section-header">
            <h2>
              <Info size={20} />
              Expected Excel Schema
            </h2>
          </div>

          <div className="section-content">
            <p className="schema-intro">
              Your Excel file must contain the following columns (in any order):
            </p>

            <div className="schema-table">
              <table>
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Required</th>
                    <th>Valid Values</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Survey Code (ID)</td>
                    <td><span className="required">Yes</span></td>
                    <td>Unique identifier</td>
                  </tr>
                  <tr>
                    <td>Zone</td>
                    <td><span className="required">Yes</span></td>
                    <td>SC Colony, Village, Waddera</td>
                  </tr>
                  <tr>
                    <td>Street Name / Landmark</td>
                    <td>No</td>
                    <td>Free text</td>
                  </tr>
                  <tr>
                    <td>Device Type</td>
                    <td><span className="required">Yes</span></td>
                    <td>Borewell, Sump, OHT</td>
                  </tr>
                  <tr>
                    <td>Lat</td>
                    <td>No</td>
                    <td>Latitude (decimal)</td>
                  </tr>
                  <tr>
                    <td>Long</td>
                    <td>No</td>
                    <td>Longitude (decimal)</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td><span className="required">Yes</span></td>
                    <td>Working, Not Work, Failed</td>
                  </tr>
                  <tr>
                    <td>Houses Conn.</td>
                    <td>No</td>
                    <td>Number</td>
                  </tr>
                  <tr>
                    <td>Daily Usage (Hrs)</td>
                    <td>No</td>
                    <td>Number</td>
                  </tr>
                  <tr>
                    <td>Pipe Size (inch)</td>
                    <td>No</td>
                    <td>Number</td>
                  </tr>
                  <tr>
                    <td>Motor HP / Cap</td>
                    <td>No</td>
                    <td>Free text</td>
                  </tr>
                  <tr>
                    <td>Notes / Maintenance Issue</td>
                    <td>No</td>
                    <td>Free text</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminUpload;
