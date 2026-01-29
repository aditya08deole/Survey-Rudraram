import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Info, Settings, Image as ImageIcon,
    MapPin, Maximize2, Minimize2,
    Plus, FileText, Activity, Server,
    Cpu, Database, Clock
} from 'lucide-react';
import type { Device } from '../../types/device';
import apiService from '../../services/apiService';
import './AssetInspector.css';

interface AssetInspectorProps {
    device: Device | null;
    onClose: () => void;
}

const AssetInspector: React.FC<AssetInspectorProps> = ({ device, onClose }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!device) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(10);
        try {
            await apiService.uploadDeviceImage(
                device.survey_id,
                device.device_type || 'BOREWELL',
                file
            );
            setUploadProgress(100);
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 800);
        } catch (error) {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`oracle-console ${isMinimized ? 'minimized' : ''}`}
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
            >
                <div className="console-header-bar">
                    <div className="system-indicator">
                        <Activity size={12} className="pulse-icon" />
                        <span>INFRA-INTEL v2.0</span>
                    </div>
                    <div className="console-controls">
                        <button onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>
                        <button onClick={onClose} className="close-trigger">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {!isMinimized ? (
                    <div className="console-content">
                        <div className="left-technical-panel">
                            <div className="asset-hero-box">
                                <div className="hero-gradient" />
                                <div className="hero-data">
                                    <div className="type-row">
                                        <span className="type-tag">{device.device_type}</span>
                                        <span className={`status-pill ${device.status?.toLowerCase().includes('working') ? 'active' : 'alert'}`}>
                                            {device.status}
                                        </span>
                                    </div>
                                    <h2>{device.original_name || device.survey_id}</h2>
                                    <span className="survey-id">{device.survey_id}</span>
                                </div>
                            </div>

                            <div className="action-ribbon">
                                <button className="ribbon-btn active"><Server size={14} /> Console</button>
                                <button className="ribbon-btn"><ImageIcon size={14} /> Assets</button>
                                <button className="ribbon-btn"><FileText size={14} /> Logs</button>
                            </div>

                            <div className="notes-box-technical">
                                <h3>FIELD OBSERVATIONS</h3>
                                <p>{device.notes || "No operational telemetry notes available."}</p>
                            </div>

                            <div className="ingestion-control">
                                <button
                                    className={`upload-console-btn ${uploading ? 'processing' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <div className="circular-progress" style={{ '--progress': `${uploadProgress}%` } as any}>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                    ) : (
                                        <><Plus size={16} /> SYNC FIELD MEDIA</>
                                    )}
                                </button>
                                <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                            </div>
                        </div>

                        <div className="right-data-grid">
                            <div className="location-context-card">
                                <div className="icon-wrap"><MapPin size={18} /></div>
                                <div className="loc-text">
                                    <h4>GEOSPATIAL CONTEXT</h4>
                                    <p>{device.lat}, {device.lng}</p>
                                </div>
                            </div>

                            <div className="telemetry-group">
                                <h5>INFRASTRUCTURE TELEMETRY</h5>
                                <div className="telemetry-grid">
                                    <div className="tel-card">
                                        <Cpu size={14} />
                                        <div className="tel-body">
                                            <label>MOTOR POWER</label>
                                            <span>{device.motor_hp || 'N/A'} HP</span>
                                        </div>
                                    </div>
                                    <div className="tel-card">
                                        <Database size={14} />
                                        <div className="tel-body">
                                            <label>DEPTH FT</label>
                                            <span>{device.depth_ft || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="tel-card">
                                        <Clock size={14} />
                                        <div className="tel-body">
                                            <label>PIPE CALIBER</label>
                                            <span>{device.pipe_size || 'N/A'}"</span>
                                        </div>
                                    </div>
                                    <div className="tel-card">
                                        <Settings size={14} />
                                        <div className="tel-body">
                                            <label>POWER SOURCE</label>
                                            <span>{device.power_type || 'STANDARD'}</span>
                                        </div>
                                    </div>
                                    <div className="tel-card full-span">
                                        <Info size={14} />
                                        <div className="tel-body">
                                            <label>ZONE ORIGIN</label>
                                            <span>{device.street || device.zone || 'RURARAM CORE'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="minimized-console-bar">
                        <Activity size={14} />
                        <span>{device.original_name || device.survey_id}</span>
                        <div className="minimized-status" />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default AssetInspector;
