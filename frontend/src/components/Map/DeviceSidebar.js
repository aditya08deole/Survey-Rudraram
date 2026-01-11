import React, { useState, useEffect } from 'react';
import { X, MapPin, Droplet, Zap, Ruler, Clock, Home, FileText, Camera } from 'lucide-react';
import ImageUpload from '../DeviceImages/ImageUpload';
import ImageGallery from '../DeviceImages/ImageGallery';
import { imageService } from '../../services/imageService';
import './DeviceSidebar.css';

const DeviceSidebar = ({ device, onClose, onImageUpload }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [coverImage, setCoverImage] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (device?.surveyCode) {
            imageService.getDeviceImages(device.surveyCode)
                .then(images => {
                    if (images && images.length > 0) {
                        // Prefer primary image, otherwise first image
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

    const getDeviceType = () => {
        const checkStr = ((device.surveyCode || '') + (device.originalName || '')).toUpperCase();
        if (checkStr.includes('BW') || checkStr.includes('BORE')) return 'Borewell';
        if (checkStr.includes('SM') || checkStr.includes('SUMP')) return 'Sump';
        if (checkStr.includes('OH') || checkStr.includes('OHSR')) return 'OHSR';
        return device.deviceType || device.type || 'Unknown';
    };

    const deviceType = getDeviceType();
    const deviceName = device.originalName || device.surveyCode || device.surveyCodeId || 'Unknown Device';

    const renderDetails = () => {
        if (deviceType === 'Borewell') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Zap size={16} />} label="Motor HP" value={device.motorHp || device.motorHP} highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Depth" value={device.depthFt ? `${device.depthFt} ft` : null} highlight />
                    <DetailRow icon={<Droplet size={16} />} label="Pipe Size" value={device.pipeSizeInch ? `${device.pipeSizeInch}"` : null} />
                    <DetailRow icon={<Zap size={16} />} label="Power" value={device.powerType1Ph3Ph || device.powerType} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.housesConnected} />
                    <DetailRow icon={<Clock size={16} />} label="Daily Usage" value={device.dailyUsageHrs ? `${device.dailyUsageHrs} hrs` : null} />
                </div>
            );
        }
        if (deviceType === 'Sump') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.tankHeightM ? `${device.tankHeightM} m` : null} highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Circumference" value={device.tankCircumference} />
                    <DetailRow icon={<Zap size={16} />} label="Power Dist." value={device.powerDistanceM ? `${device.powerDistanceM} m` : null} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.housesConnected} />
                </div>
            );
        }
        if (deviceType === 'OHSR') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.tankHeightM ? `${device.tankHeightM} m` : null} highlight />
                    <DetailRow icon={<FileText size={16} />} label="Material" value={device.material} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.housesConnected} />
                </div>
            );
        }
        return <p className="text-gray-500 italic">No specific details available.</p>;
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
                    <span className="sidebar-subtitle">{device.surveyCode || device.surveyCodeId || 'No ID'}</span>
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
                                        <p className="loc-value">{device.location || 'N/A'}</p>
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
                            <p>Coordinates: {device.latitude?.toFixed(6)}, {device.longitude?.toFixed(6)}</p>
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
                                surveyCode={device.surveyCode}
                                onUploadSuccess={() => {
                                    // Refresh cover image
                                    imageService.getDeviceImages(device.surveyCode).then(images => {
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
                            <ImageGallery surveyCode={device.surveyCode} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, highlight }) => {
    if (!value) return null;
    return (
        <div className={`detail-card ${highlight ? 'highlight' : ''}`}>
            <div className="detail-icon">{icon}</div>
            <div className="detail-content">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}</span>
            </div>
        </div>
    );
};

export default DeviceSidebar;
