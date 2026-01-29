import React, { useState, useEffect } from 'react';
import { X, MapPin, Droplet, Zap, Ruler, Clock, Home, FileText, Camera, Info } from 'lucide-react';
import ImageUpload from '../DeviceImages/ImageUpload';
import ImageGallery from '../DeviceImages/ImageGallery';
import { imageService } from '../../services/imageService';
import { updateDeviceNotes } from '../../services/apiService';
import './DeviceSidebar.css';

const DeviceSidebar = ({ device, onClose, onImageUpload }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [coverImage, setCoverImage] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        if (device?.survey_id) {
            setNoteText(device.notes || '');
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
            setNoteText('');
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
                    <DetailRow icon={<Ruler size={16} />} label="Depth" value={device.depth_ft} unit="ft" highlight />
                    <DetailRow icon={<Droplet size={16} />} label="Pipe Size" value={device.pipe_size_inch} unit="inch" />
                    <DetailRow icon={<Zap size={16} />} label="Power" value={device.power_type} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.houses_connected} />
                    <DetailRow icon={<Clock size={16} />} label="Daily Usage" value={device.daily_usage_hrs} unit="hrs" />
                    <DetailRow icon={<Clock size={16} />} label="Daily Usage" value={device.daily_usage_hrs} unit="hrs" />
                    {/* sr_no removed as per request */}
                    <DetailRow icon={<Info size={16} />} label="Status" value={device.done !== undefined ? (device.done ? 'Done' : 'Pending') : null} />
                </div>
            );
        }
        // Sump Details
        if (deviceType === 'Sump') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} unit="L" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.tank_height_m} unit="m" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Circumference" value={device.tank_circumference} unit="m" />
                    <DetailRow icon={<Zap size={16} />} label="Power Dist." value={device.power_distance_m} unit="m" />
                    <DetailRow icon={<Home size={16} />} label="People" value={device.people_connected} />
                </div>
            );
        }
        // OHSR Details
        if (deviceType === 'OHSR' || deviceType === 'OHT') {
            return (
                <div className="sidebar-details-grid">
                    <DetailRow icon={<Droplet size={16} />} label="Capacity" value={device.capacity} unit="L" highlight />
                    <DetailRow icon={<Ruler size={16} />} label="Height" value={device.tank_height_m} unit="m" highlight />
                    <DetailRow icon={<FileText size={16} />} label="Material" value={device.material} />
                    <DetailRow icon={<Info size={16} />} label="Type" value={device.type} />
                    <DetailRow icon={<Info size={16} />} label="Lid Access" value={device.lid_access} />
                    <DetailRow icon={<Home size={16} />} label="Houses" value={device.houses_connected} />
                </div>
            );
        }
        return <p className="text-gray-500 italic p-4">No specific technical details available for this device type.</p>;
    };

    const renderAdditionalInfo = () => {
        // Core system fields to always hide (internal or already shown prominently)
        const systemFields = ['id', 'geometry', 'geom', 'lat', 'lng', 'latitude', 'longitude', 'images', 'notes', 'device_type', 'deviceType', 'survey_id', 'surveyCode', 'original_name', 'originalName', 'done', 'status', 'zone', 'street', 'location', 'sr_no', 'is_primary', 'created_at', 'updated_at', 'sheet_name', 'row_index'];

        // Fields already rendered in 'renderDetails' (Technical Specs)
        let renderedSpecs = [];
        if (deviceType === 'Borewell') renderedSpecs = ['motor_hp', 'depth_ft', 'pipe_size_inch', 'power_type', 'houses_connected', 'daily_usage_hrs'];
        if (deviceType === 'Sump') renderedSpecs = ['capacity', 'tank_height_m', 'tank_circumference', 'power_distance_m', 'people_connected'];
        if (deviceType === 'OHSR' || deviceType === 'OHT') renderedSpecs = ['capacity', 'tank_height_m', 'material', 'type', 'lid_access', 'houses_connected'];

        const excluded = new Set([...systemFields, ...renderedSpecs]);

        const extraFields = Object.entries(device).filter(([key, val]) => {
            if (excluded.has(key)) return false;
            if (val === null || val === undefined || val === '') return false;
            if (typeof val === 'object') return false;
            return true;
        });

        if (extraFields.length === 0) return null;

        return (
            <div className="sidebar-section">
                <h3 className="section-title">Additional Information</h3>
                <div className="sidebar-details-grid">
                    {extraFields.map(([key, val]) => (
                        <DetailRow
                            key={key}
                            icon={<Info size={16} />}
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            value={String(val)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="device-sidebar">
            {/* 1. Hero Image / Gallery Preview */}
            <div className="sidebar-cover-image" style={{ backgroundImage: `url(${coverImage || '/placeholder-device.jpg'})` }}>
                <div className="cover-overlay"></div>
                <button className="sidebar-close-btn" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                    <X size={24} />
                </button>
            </div>

            {/* 2. Header & Title (Floating up into image) */}
            <div className={`sidebar-header has-cover`}>
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="sidebar-title">{deviceName}</h2>
                        <span className={`status-badge status-${(device.status || 'Working').toLowerCase().replace(' ', '-')}`}>
                            {device.status || 'Unknown'}
                        </span>
                    </div>
                    <span className="sidebar-subtitle">{surveyId || 'No ID'} • {device.zone || 'No Zone'}</span>
                </div>
            </div>

            {/* 3. Action Bar (Google Maps Style) */}
            <div className="sidebar-actions-bar">
                <button className="action-chip primary" onClick={() => setShowUploadModal(true)}>
                    <Camera size={16} />
                    <span>Add Photo</span>
                </button>
                <button className={`action-chip ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>
                    <FileText size={16} />
                    <span>Gallery</span>
                </button>
                <button className={`action-chip ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                    <Info size={16} />
                    <span>Details</span>
                </button>
            </div>

            {/* 4. Scrollable Content Area */}
            <div className="sidebar-content">
                {activeTab === 'details' && (
                    <div className="details-tab fade-in">
                        {/* Location Section */}
                        <div className="sidebar-section">
                            <div className="location-card glass-panel">
                                <div className="loc-row">
                                    <MapPin size={18} className="text-primary" />
                                    <div>
                                        <span className="loc-value">{device.street || device.location || 'Location not available'}</span>
                                        <span className="loc-label">{device.lat?.toFixed(5)}, {device.lng?.toFixed(5)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Specs - Preserved All Data */}
                        <div className="sidebar-section">
                            <h3 className="section-title">Technical Specifications</h3>
                            {renderDetails()}
                            {renderAdditionalInfo()}
                        </div>

                        {/* Notes Section */}
                        <div className="sidebar-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 className="section-title" style={{ marginBottom: 0 }}>Field Notes</h3>
                                {!isEditingNote && (
                                    <button className="edit-notes-link" onClick={() => setIsEditingNote(true)}>Edit</button>
                                )}
                            </div>
                            {isEditingNote ? (
                                <div className="note-editor-container">
                                    <textarea
                                        className="notes-editor"
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="note-actions">
                                        <button className="btn-save" onClick={async () => {
                                            await updateDeviceNotes(surveyId, deviceType, noteText);
                                            setIsEditingNote(false);
                                            device.notes = noteText;
                                        }}>Save</button>
                                        <button className="btn-cancel" onClick={() => setIsEditingNote(false)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="notes-text">{noteText || 'No notes available.'}</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div className="images-tab fade-in">
                        <ImageGallery surveyCode={surveyId} />
                    </div>
                )}
            </div>

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
