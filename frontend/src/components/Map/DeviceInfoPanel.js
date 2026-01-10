import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Star, MapPin, Droplet, Zap, Ruler, Clock, Home, FileText } from 'lucide-react';
import './DeviceInfoPanel.css';

const DeviceInfoPanel = ({ device, onClose, position: initialPosition }) => {
    const [position, setPosition] = useState(initialPosition || { x: window.innerWidth / 2 - 250, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isMaximized, setIsMaximized] = useState(false);
    const panelRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('.panel-header') && !e.target.closest('.panel-actions')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && !isMaximized) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    const getDeviceType = () => {
        const checkStr = ((device.surveyCode || '') + (device.originalName || '')).toUpperCase();
        if (checkStr.includes('BW') || checkStr.includes('BORE')) return 'Borewell';
        if (checkStr.includes('SM') || checkStr.includes('SUMP')) return 'Sump';
        if (checkStr.includes('OH') || checkStr.includes('OHSR')) return 'OHSR';
        return device.deviceType || device.type || 'Unknown';
    };

    const deviceType = getDeviceType();
    const deviceName = device.originalName || device.surveyCode || device.surveyCodeId || 'Unknown Device';

    const renderDeviceDetails = () => {
        if (deviceType === 'Borewell') {
            return (
                <>
                    <div className="info-grid">
                        <InfoCard icon={<Zap />} label="Motor HP" value={device.motorHp || device.motorHP || 'N/A'} highlight />
                        <InfoCard icon={<Ruler />} label="Depth" value={device.depthFt ? `${device.depthFt} ft` : 'N/A'} highlight />
                    </div>
                    <div className="info-grid">
                        <InfoCard icon={<Droplet />} label="Pipe Size" value={device.pipeSizeInch ? `${device.pipeSizeInch}"` : 'N/A'} />
                        <InfoCard icon={<Zap />} label="Power Type" value={device.powerType1Ph3Ph || device.powerType || 'N/A'} />
                    </div>
                    <div className="info-grid">
                        <InfoCard icon={<Home />} label="Houses" value={device.housesConnected || 'N/A'} />
                        <InfoCard icon={<Clock />} label="Daily Usage" value={device.dailyUsageHrs ? `${device.dailyUsageHrs} hrs` : 'N/A'} />
                    </div>
                </>
            );
        }

        if (deviceType === 'Sump') {
            return (
                <>
                    <div className="info-grid">
                        <InfoCard icon={<Droplet />} label="Capacity" value={device.capacity || 'N/A'} highlight />
                        <InfoCard icon={<Ruler />} label="Height" value={device.tankHeightM ? `${device.tankHeightM} m` : 'N/A'} highlight />
                    </div>
                    <div className="info-grid">
                        <InfoCard icon={<Ruler />} label="Circumference" value={device.tankCircumference || 'N/A'} />
                        <InfoCard icon={<Zap />} label="Power Distance" value={device.powerDistanceM ? `${device.powerDistanceM} m` : 'N/A'} />
                    </div>
                </>
            );
        }

        if (deviceType === 'OHSR') {
            return (
                <>
                    <div className="info-grid">
                        <InfoCard icon={<Droplet />} label="Capacity" value={device.capacity || 'N/A'} highlight />
                        <InfoCard icon={<Ruler />} label="Height" value={device.tankHeightM ? `${device.tankHeightM} m` : 'N/A'} highlight />
                    </div>
                    <div className="info-grid">
                        <InfoCard icon={<FileText />} label="Material" value={device.material || 'N/A'} />
                        <InfoCard icon={<Home />} label="Houses" value={device.housesConnected || 'N/A'} />
                    </div>
                </>
            );
        }

        return null;
    };

    const panelStyle = isMaximized
        ? { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
        : { top: position.y, left: position.x };

    return (
        <div
            ref={panelRef}
            className={`device-info-panel ${isMaximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''}`}
            style={panelStyle}
            onMouseDown={handleMouseDown}
        >
            <div className="panel-header">
                <div className="panel-title">
                    <h3>{deviceName}</h3>
                    <span className="device-code">{device.surveyCode || device.surveyCodeId || 'N/A'}</span>
                </div>
                <div className="panel-actions">
                    <button className="panel-btn" onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button className="panel-btn close-btn" onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="panel-body">
                {device.status && (
                    <div className={`status-badge status-${device.status.toLowerCase().replace(' ', '-')}`}>
                        <Star size={14} fill="currentColor" />
                        {device.status}
                    </div>
                )}

                <div className="location-section">
                    <InfoCard icon={<MapPin />} label="Zone" value={device.zone || 'N/A'} />
                    <InfoCard icon={<MapPin />} label="Location" value={device.location || 'N/A'} />
                </div>

                {renderDeviceDetails()}

                {device.notes && (
                    <div className="notes-section">
                        <div className="notes-header">
                            <FileText size={16} />
                            <span>Notes</span>
                        </div>
                        <p>{device.notes}</p>
                    </div>
                )}

                <div className="coordinates-section">
                    <MapPin size={14} />
                    <span>{device.latitude?.toFixed(6) || 'N/A'}, {device.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};

const InfoCard = ({ icon, label, value, highlight }) => (
    <div className={`info-card ${highlight ? 'highlight' : ''}`}>
        <div className="info-icon">{icon}</div>
        <div className="info-content">
            <span className="info-label">{label}</span>
            <span className="info-value">{value}</span>
        </div>
    </div>
);

export default DeviceInfoPanel;
