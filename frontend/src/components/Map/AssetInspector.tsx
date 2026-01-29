import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Info, Image as ImageIcon,
    MapPin, Maximize2, Minimize2,
    Plus, FileText, Activity
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
        setUploadProgress(20);
        try {
            const sid = device.survey_id || (device as any).survey_code;
            if (!sid) throw new Error("Asset identifier not found");

            const result = await apiService.uploadDeviceImage(
                sid,
                device.device_type || 'BOREWELL',
                file
            );

            if (result.success) {
                setUploadProgress(100);
                setTimeout(() => {
                    setUploading(false);
                    setUploadProgress(0);
                }, 800);
            } else {
                throw new Error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload failed", error);
            setUploading(false);
            setUploadProgress(0);
            alert("Upload failed. Please ensure you are logged in.");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`oracle-hud-v2 ${isMinimized ? 'minimized' : ''}`}
                drag
                dragMomentum={false}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
            >
                <div className="hud-header">
                    <div className="drag-handle" />
                    <div className="window-btns">
                        <button onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>
                        <button onClick={onClose} className="close">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="hud-body">
                        <div className="column-left">
                            <div className="hero-section">
                                <div className="hero-content">
                                    <h1>{device.original_name || device.survey_id}</h1>
                                    <div className="hero-meta">
                                        <div className="id-tag">{device.survey_id} • {device.zone || 'Rudraram'}</div>
                                        <div className={`status-badge ${device.status?.toLowerCase().includes('working') ? 'working' : 'fault'}`}>
                                            {device.status?.toUpperCase() || 'UNKNOWN'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="action-row">
                                <button className="btn-action photos"><ImageIcon size={16} /> Photos</button>
                                <button className="btn-action report"><FileText size={16} /> Report</button>
                                <button className="btn-action details active"><Info size={16} /> Details</button>
                            </div>

                            <div className="upload-container">
                                <button
                                    className={`btn-add-media ${uploading ? 'loading' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <div className="upload-spinner" style={{ '--p': `${uploadProgress}%` } as any}>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                    ) : (
                                        <>Add image option here</>
                                    )}
                                </button>
                                <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                            </div>

                            <div className="notes-section">
                                <h3>FIELD NOTES</h3>
                                <p>{device.notes || "No notes available."}</p>
                            </div>
                        </div>

                        <div className="column-right">
                            <div className="location-card">
                                <div className="loc-icon"><MapPin size={18} /></div>
                                <div className="loc-data">
                                    <h4>{device.original_name || 'SC Colony'}</h4>
                                    <p>{device.lat}, {device.lng}</p>
                                </div>
                            </div>

                            <div className="spec-group">
                                <h5>TECHNICAL SPECIFICATIONS</h5>
                                <p className="empty-msg">No specific technical details available for this device type.</p>
                            </div>

                            <div className="info-group">
                                <h5>ADDITIONAL INFORMATION</h5>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Long</label>
                                            <span>{device.lng || device.longitude}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Survey Code</label>
                                            <span>{device.survey_id}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Depth Ft</label>
                                            <span>{device.depth_ft || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Motor Hp</label>
                                            <span>{device.motor_hp || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Pipe Size Inch</label>
                                            <span>{device.pipe_size || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>Power Type</label>
                                            <span>{device.power_type || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item full">
                                        <Info size={14} />
                                        <div className="item-vals">
                                            <label>StreetName</label>
                                            <span>{device.street || device.original_name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default AssetInspector;
