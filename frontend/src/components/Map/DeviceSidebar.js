import React, { useState, useEffect } from 'react';
import { X, MapPin, Droplet, Zap, Ruler, Clock, Home, FileText, Camera, Info } from 'lucide-react';
import ImageUpload from '../DeviceImages/ImageUpload';
import ImageGallery from '../DeviceImages/ImageGallery';
import { imageService } from '../../services/imageService';
import './DeviceSidebar.css';

const DeviceSidebar = ({ device, onClose, onImageUpload }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [coverImage, setCoverImage] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (device?.survey_id) {
            imageService.getDeviceImages(device.survey_id)
                .then(images => {
                    if (images && images.length > 0) {
                        const primary = images.find(img => img.is_primary) || images[0];
                        setCoverImage(primary.url);
                    } else {
                        setCoverImage(null);
                    }
                })
                .catch(err => console.error("Failed to load cover image", err));
        } else {
            setCoverImage(null);
        }
    }, [device]);

    if (!device) return null;

    // Use normalized keys from backend
    const deviceType = device.device_type || device.deviceType || 'Unknown';
    const deviceName = device.original_name || device.originalName || device.survey_id || 'Unknown Device';
    const surveyId = device.survey_id || device.surveyCode;

    const renderDetails = () => {
        // Borewell Details
        if (deviceType === 'Borewell') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Zap size={16} />} label="Motor HP" value={device.motor_hp} unit="HP" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Depth" value={device.depth || device.depth_ft} unit="ft" highlight />
                    <DetailRow icon={<Droplet size={16} />} label="Pipe Size" value={device.pipe_size} unit="inch" />
                    <DetailRow icon={<Zap size={16} />} label="Power" value={device.power_type} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.houses} />
                    <DetailRow icon={<Clock size={16} />} label="Daily Usage" value={device.usage_hours} unit="hrs" />
                    <DetailRow icon={<Info size={16} />} label="Yield" value={device.yield} unit="GPM" />
                </div>
            );
        }
        // Sump Details
        if (deviceType === 'Sump') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} unit="L" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.height || device.tankHeightM} unit="m" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Dimensions" value={device.dimensions || device.tankCircumference} />
                    <DetailRow icon={<Zap size={16} />} label="Power Dist." value={device.power_distance} unit="m" />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.houses} />
                </div>
            );
        }
        // OHSR Details
        if (deviceType === 'OHSR' || deviceType === 'OHT') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} unit="L" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.height || device.tankHeightM} unit="m" highlight />
                    <DetailRow icon={<FileText size={16} />} label="Material" value={device.material} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.houses} />
                </div>
            );
        }
        return <p className="text-gray-500 italic p-4">No specific technical details available for this device type.</p>;
    };

    return (
        <div className="device-sidebar">
            {coverImage && (
                <div className="sidebar-cover-image" style={{ backgroundImage: `url(${coverImage})` }}>
                    <div className="cover-overlay"></div>
                </div>
            )}

            <div className={`sidebar-header ${coverImage ? 'has-cover' : ''}`}>
                <div>
                    <h2 className="sidebar-title">{deviceName}</h2>
                    <span className="sidebar-subtitle">{surveyId || 'No ID'}</span>
                </div>
                <button onClick={onClose} className="sidebar-close-btn">
                    <X size={24} />
                </button>
            </div>

            <div className="sidebar-status-bar">
                <span className={`status-badge status-${(device.status || 'Working').toLowerCase().replace(' ', '-')}`}>
                    {device.status || 'Unknown Status'}
                </span>
                <span className="device-type-badge">{deviceType}</span>
            </div>

            <div className="sidebar-tabs">
                <button
                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
                <button
                    className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
                    onClick={() => setActiveTab('images')}
                >
                    Images
                </button>
            </div>

            <div className="sidebar-content">
                {activeTab === 'details' && (
                    <div className="details-tab fade-in">
                        <div className="sidebar-section">
                            <h3 className="section-title">Location</h3>
                            <div className="location-card">
                                <div className="loc-row">
                                    <MapPin size={16} className="text-primary" />
                                    <div>
                                        <span className="loc-label">Zone</span>
                                        <p className="loc-value">{device.zone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="loc-separator"></div>
                                <div className="loc-row">
                                    <MapPin size={16} className="text-primary" />
                                    <div>
                                        <span className="loc-label">Address</span>
                                        <p className="loc-value">{device.street || device.location || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <h3 className="section-title">Technical Specs</h3>
                            {renderDetails()}
                        </div>

                        {device.notes && (
                            <div className="sidebar-section">
                                <h3 className="section-title">Notes</h3>
                                <div className="notes-box">
                                    <p>{device.notes}</p>
                                </div>
                            </div>
                        )}

                        <div className="metadata-footer">
                            <p>Coordinates: {device.lat?.toFixed(6) || device.latitude?.toFixed(6)}, {device.lng?.toFixed(6) || device.longitude?.toFixed(6)}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div className="images-tab fade-in">
                        <button
                            className="upload-trigger-btn"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <Camera size={20} /> Upload Images
                        </button>

                        {showUploadModal && (
                            <ImageUpload
                                surveyCode={surveyId}
                                onUploadSuccess={() => {
                                    imageService.getDeviceImages(surveyId).then(images => {
                                        const primary = images.find(img => img.is_primary) || images[0];
                                        setCoverImage(primary ? primary.url : null);
                                    });
                                    setShowUploadModal(false);
                                }}
                                onClose={() => setShowUploadModal(false)}
                            />
                        )}

                        <div className="mt-6">
                            <h3 className="section-title mb-2">Gallery</h3>
                            <ImageGallery surveyCode={surveyId} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, unit, highlight }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className={`detail-card ${highlight ? 'highlight' : ''}`}>
            <div className="detail-icon">{icon}</div>
            <div className="detail-content">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}{unit ? ` ${unit}` : ''}</span>
            </div>
        </div>
    );
};

export default DeviceSidebar;
