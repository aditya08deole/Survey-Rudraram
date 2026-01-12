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
    const [isSavingNote, setIsSavingNote] = useState(false);

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
                            {renderAdditionalInfo()}
                        </div>

                        <div className="sidebar-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 className="section-title" style={{ marginBottom: 0 }}>Notes</h3>
                                {!isEditingNote ? (
                                    <button
                                        className="edit-notes-btn"
                                        onClick={() => setIsEditingNote(true)}
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="save-notes-btn"
                                            disabled={isSavingNote}
                                            onClick={async () => {
                                                setIsSavingNote(true);
                                                const result = await updateDeviceNotes(surveyId, deviceType, noteText);
                                                setIsSavingNote(false);
                                                if (result.success) {
                                                    setIsEditingNote(false);
                                                    device.notes = noteText; // Optimistic update
                                                } else {
                                                    alert('Failed to save notes');
                                                }
                                            }}
                                        >
                                            {isSavingNote ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="cancel-notes-btn"
                                            onClick={() => {
                                                setIsEditingNote(false);
                                                setNoteText(device.notes || '');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingNote ? (
                                <textarea
                                    className="notes-editor"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    rows={4}
                                />
                            ) : (
                                <div className="notes-box glassy-card">
                                    <p>{noteText || <em className="text-gray-400">No notes available...</em>}</p>
                                </div>
                            )}
                        </div>

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
