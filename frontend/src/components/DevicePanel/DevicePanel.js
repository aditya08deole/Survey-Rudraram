/**
 * Device Panel Component
 * 
 * Sliding panel that displays all device details when a marker is clicked.
 * Shows ALL Excel fields in the specified order.
 */

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Home,
  FileText,
  Image,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { STATUS_CONFIG, ZONES } from '../../utils/constants';
import './DevicePanel.css';

function DevicePanel({ device, onClose }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!device) return null;

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Working':
        return <CheckCircle size={16} />;
      case 'Not Work':
        return <AlertTriangle size={16} />;
      case 'Failed':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  // Get device type icon
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Borewell':
        return '⚫';
      case 'Sump':
        return '⬛';
      case 'OHT':
        return '🔺';
      default:
        return '📍';
    }
  };

  // Format field value
  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="empty-value">Not specified</span>;
    }
    return value;
  };

  // Image navigation
  const hasImages = device.images && device.images.length > 0;
  const nextImage = () => {
    if (hasImages) {
      setActiveImageIndex((prev) => 
        prev === device.images.length - 1 ? 0 : prev + 1
      );
    }
  };
  const prevImage = () => {
    if (hasImages) {
      setActiveImageIndex((prev) => 
        prev === 0 ? device.images.length - 1 : prev - 1
      );
    }
  };

  const statusConfig = STATUS_CONFIG[device.status] || {};
  const zoneConfig = ZONES[device.zone] || {};

  return (
    <>
      <div className="device-panel slide-in-right">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title">
            <span className="device-icon">{getDeviceIcon(device.deviceType)}</span>
            <div className="device-info">
              <h2>{device.surveyCode}</h2>
              <span className="device-type">{device.deviceType}</span>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Banner */}
        <div 
          className="status-banner"
          style={{ 
            backgroundColor: statusConfig.bgColor,
            borderColor: statusConfig.color
          }}
        >
          <span 
            className="status-icon"
            style={{ color: statusConfig.color }}
          >
            {getStatusIcon(device.status)}
          </span>
          <span 
            className="status-text"
            style={{ color: statusConfig.textColor }}
          >
            {statusConfig.label || device.status}
          </span>
        </div>

        {/* Content */}
        <div className="panel-content">
          {/* Quick Info Cards */}
          <div className="quick-info-cards">
            <div className="quick-card">
              <MapPin size={16} />
              <div>
                <span className="quick-label">Zone</span>
                <span 
                  className="quick-value"
                  style={{ color: zoneConfig.color }}
                >
                  {device.zone}
                </span>
              </div>
            </div>
            <div className="quick-card">
              <Home size={16} />
              <div>
                <span className="quick-label">Houses</span>
                <span className="quick-value">
                  {device.housesConnected || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* All Fields - Following Excel Column Order */}
          <div className="field-section">
            <h3 className="section-title">
              <FileText size={16} />
              Complete Device Information
            </h3>
            
            <div className="field-list">
              {/* Survey Code (ID) */}
              <div className="field-row">
                <span className="field-label">Survey Code (ID)</span>
                <span className="field-value field-id">{device.surveyCode}</span>
              </div>

              {/* Zone */}
              <div className="field-row">
                <span className="field-label">Zone</span>
                <span className="field-value">
                  <span 
                    className="zone-badge"
                    style={{ 
                      backgroundColor: zoneConfig.color + '20',
                      color: zoneConfig.color,
                      borderColor: zoneConfig.color
                    }}
                  >
                    {device.zone}
                  </span>
                </span>
              </div>

              {/* Street Name / Landmark */}
              <div className="field-row">
                <span className="field-label">Street Name / Landmark</span>
                <span className="field-value">
                  {formatValue('streetName', device.streetName)}
                </span>
              </div>

              {/* Device Type */}
              <div className="field-row">
                <span className="field-label">Device Type</span>
                <span className="field-value">
                  <span className="device-type-badge">
                    {getDeviceIcon(device.deviceType)} {device.deviceType}
                  </span>
                </span>
              </div>

              {/* Status */}
              <div className="field-row">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.textColor
                    }}
                  >
                    {getStatusIcon(device.status)} {device.status}
                  </span>
                </span>
              </div>

              {/* Houses Connected */}
              <div className="field-row">
                <span className="field-label">Houses Connected</span>
                <span className="field-value field-number">
                  {formatValue('housesConnected', device.housesConnected)}
                </span>
              </div>

              {/* Pipe Size (inch) */}
              <div className="field-row">
                <span className="field-label">Pipe Size (inch)</span>
                <span className="field-value field-number">
                  {device.pipeSize ? `${device.pipeSize}"` : formatValue('pipeSize', null)}
                </span>
              </div>

              {/* Motor HP */}
              <div className="field-row">
                <span className="field-label">Motor HP</span>
                <span className="field-value">
                  {formatValue('motorHP', device.motorHP)}
                </span>
              </div>

              {/* Notes / Maintenance Issue */}
              <div className="field-row field-row-notes">
                <span className="field-label">Notes / Maintenance Issue</span>
                <span className="field-value field-notes">
                  {formatValue('notes', device.notes)}
                </span>
              </div>

              {/* Coordinates */}
              {device.lat && device.long && (
                <div className="field-row">
                  <span className="field-label">Coordinates</span>
                  <span className="field-value field-coords">
                    {device.lat.toFixed(6)}, {device.long.toFixed(6)}
                    <a 
                      href={`https://www.google.com/maps?q=${device.lat},${device.long}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="coords-link"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="field-section">
            <h3 className="section-title">
              <Image size={16} />
              Device Images
              {hasImages && <span className="image-count">({device.images.length})</span>}
            </h3>

            {hasImages ? (
              <div className="image-gallery">
                <div className="gallery-main">
                  <img 
                    src={device.images[activeImageIndex]}
                    alt={`${device.surveyCode} - View ${activeImageIndex + 1}`}
                    onClick={() => setShowImageModal(true)}
                  />
                  {device.images.length > 1 && (
                    <>
                      <button className="gallery-nav prev" onClick={prevImage}>
                        <ChevronLeft size={20} />
                      </button>
                      <button className="gallery-nav next" onClick={nextImage}>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  <span className="image-counter">
                    {activeImageIndex + 1} / {device.images.length}
                  </span>
                </div>
                {device.images.length > 1 && (
                  <div className="gallery-thumbnails">
                    {device.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className={idx === activeImageIndex ? 'active' : ''}
                        onClick={() => setActiveImageIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-images">
                <Image size={32} />
                <p>No images available for this device</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && hasImages && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowImageModal(false)}
            >
              <X size={24} />
            </button>
            <img 
              src={device.images[activeImageIndex]}
              alt={`${device.surveyCode} - Full View`}
            />
            {device.images.length > 1 && (
              <>
                <button className="modal-nav prev" onClick={prevImage}>
                  <ChevronLeft size={32} />
                </button>
                <button className="modal-nav next" onClick={nextImage}>
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default DevicePanel;
