import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, Info, Image as ImageIcon, Plus,
    Settings, Droplets, ShieldCheck,
    Loader2, Camera, Navigation, CheckCircle2,
    Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import apiService from '../../services/apiService';
import { generateDeviceReport } from '../../services/ReportGenerator';
import './DeviceSidebar.css';

const DeviceHUD = ({ device, onClose, onImageUpload }) => {
    const [activeTab, setActiveTab] = useState('specs');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState(device?.notes || '');
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    // Auto-sync notes when device changes
    useEffect(() => {
        setNotes(device?.notes || '');
        if (device?.survey_id) {
            loadImages();
        }
    }, [device]);

    const loadImages = async () => {
        try {
            const data = await apiService.fetchDeviceImages(device.survey_id);
            setImages(data || []);
        } catch (error) {
            console.error("Error loading images:", error);
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadProgress(10);

            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8,
                onProgress: (p) => setUploadProgress(10 + (p * 0.4)) // 10% to 50%
            };

            const compressedFile = await imageCompression(file, options);
            setUploadProgress(60);

            const result = await apiService.uploadDeviceImage(
                device.survey_id,
                device.device_type || 'BOREWELL',
                compressedFile
            );

            if (result.success) {
                setUploadProgress(100);
                toast.success('Field Photo Ingested');
                loadImages();
                if (onImageUpload) onImageUpload();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            toast.error('Ingestion Failed: ' + error.message);
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    if (!device) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                drag
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                dragElastic={0.1}
                dragMomentum={false}
                className="device-hud-container glassmorphism"
            >
                {/* Drag Handle Top */}
                <div className="hud-drag-handle">
                    <div className="drag-indicator" />
                    <button className="hud-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Hero Banner */}
                <div className="hud-hero" style={{
                    backgroundImage: `url(${images[0]?.image_url || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800'})`
                }}>
                    <div className="hud-hero-overlay">
                        <div className="hud-title-zone">
                            <h2 className="hud-title">{device.original_name || 'Unnamed Device'}</h2>
                            <div className="hud-badges">
                                <span className={`hud-status-badge status-${device.status?.toLowerCase().replace(' ', '-')}`}>
                                    {device.status || 'Unknown'}
                                </span>
                                <span className="hud-id-badge">{device.survey_id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className="hud-nav">
                    <button
                        className={`hud-nav-item ${activeTab === 'specs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('specs')}
                    >
                        <Info size={18} />
                        <span>Specs</span>
                    </button>
                    <button
                        className={`hud-nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gallery')}
                    >
                        <ImageIcon size={18} />
                        <span>Gallery</span>
                    </button>
                    <button className="hud-nav-item" onClick={() => generateDeviceReport(device)}>
                        <Download size={18} />
                        <span>PDF</span>
                    </button>
                    <button
                        className={`hud-nav-item upload-btn`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <div className="progress-radial-container">
                                <Loader2 size={18} className="animate-spin" />
                            </div>
                        ) : (
                            <Plus size={18} />
                        )}
                        <span>Photo</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Dynamic Content Body */}
                <div className="hud-body">
                    <div className="hud-scroll-content">
                        {activeTab === 'specs' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hud-section fade-in"
                            >
                                <div className="section-label">Technical Configuration</div>
                                <div className="hud-specs-grid">
                                    <div className="hud-spec-card highlight">
                                        <ShieldCheck size={16} className="spec-icon" />
                                        <div className="spec-content">
                                            <div className="spec-label">Hardware Type</div>
                                            <div className="spec-value">{device.device_type || 'Borewell'}</div>
                                        </div>
                                    </div>
                                    <div className="hud-spec-card">
                                        <Navigation size={16} className="spec-icon" />
                                        <div className="spec-content">
                                            <div className="spec-label">Zone</div>
                                            <div className="spec-value">{device.zone || 'Rudraram'}</div>
                                        </div>
                                    </div>
                                    <div className="hud-spec-card">
                                        <Droplets size={16} className="spec-icon" />
                                        <div className="spec-content">
                                            <div className="spec-label">Condition</div>
                                            <div className="spec-value">{device.condition || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="hud-spec-card">
                                        <Settings size={16} className="spec-icon" />
                                        <div className="spec-content">
                                            <div className="spec-label">Usage</div>
                                            <div className="spec-value">{device.daily_usage_hrs || 'N/A'} hrs</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section-label mt-6">Spatial Location</div>
                                <div className="hud-location-bar">
                                    <MapPin size={16} color="#ef4444" />
                                    <span>GPS Fix Established</span>
                                    <span className="coords">
                                        {Number(device.lat || device.latitude).toFixed(4)}, {Number(device.lng || device.longitude).toFixed(4)}
                                    </span>
                                </div>

                                <div className="hud-notes-box mt-6">
                                    <div className="hud-notes-header">
                                        <div className="section-label">Field Intelligence</div>
                                        <button className="hud-edit-btn" onClick={() => setIsEditingNotes(!isEditingNotes)}>
                                            {isEditingNotes ? 'Cancel' : 'Update'}
                                        </button>
                                    </div>
                                    {isEditingNotes ? (
                                        <div className="hud-note-editor">
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add field observations..."
                                            />
                                            <button className="hud-save-btn" onClick={async () => {
                                                await apiService.updateDeviceNotes(device.survey_id, device.device_type, notes);
                                                setIsEditingNotes(false);
                                            }}>Push Updates</button>
                                        </div>
                                    ) : (
                                        <div className="hud-notes-display">
                                            {notes || 'No critical observations recorded for this asset.'}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hud-gallery-grid fade-in"
                            >
                                {images.length > 0 ? (
                                    <div className="hud-gallery-container">
                                        {images.map((img, i) => (
                                            <div key={i} className="hud-gallery-item">
                                                <img src={img.image_url} alt="Field Asset" />
                                                <div className="img-overlay">
                                                    <span>{new Date(img.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="hud-empty-gallery">
                                        <Camera size={48} className="mb-2 opacity-20" />
                                        <p>No Asset Documentation Yet</p>
                                        <button onClick={() => fileInputRef.current?.click()}>Start Ingestion</button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom Utility Bar */}
                <div className="hud-footer">
                    <div className="sync-status">
                        <CheckCircle2 size={12} className="text-secondary" />
                        <span>Live Supabase Sync</span>
                    </div>
                    <div className="last-updated">
                        Ref: {device.survey_id?.substring(0, 8)}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeviceHUD;
