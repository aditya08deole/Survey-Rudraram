import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Image as ImageIcon, Trash2, CheckCircle, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import apiService from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import './DeviceImageGallery.css';

interface DeviceImageGalleryProps {
    surveyCode: string;
    onClose?: () => void;
}

const DeviceImageGallery: React.FC<DeviceImageGalleryProps> = ({ surveyCode }) => {
    const { user } = useApp() as any;
    const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadImages = async () => {
        setLoading(true);
        try {
            const response = await apiService.fetchDeviceImages(surveyCode);
            if (response.success) {
                setImages(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, [surveyCode]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress Image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            console.log('Original file size:', file.size / 1024 / 1024, 'MB');
            const compressedFile = await imageCompression(file, options);
            console.log('Compressed file size:', compressedFile.size / 1024 / 1024, 'MB');

            await apiService.uploadDeviceImage(surveyCode, compressedFile);
            await loadImages();
            // Reset to latest image
            setCurrentIndex(0);
        } catch (error) {
            alert('Upload failed. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;

        try {
            await apiService.deleteDeviceImage(imageId);
            const newImages = images.filter(img => img.id !== imageId);
            setImages(newImages);
            if (currentIndex >= newImages.length && newImages.length > 0) {
                setCurrentIndex(newImages.length - 1);
            }
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleSetPrimary = async (imageId: string) => {
        try {
            await apiService.setPrimaryImage(surveyCode, imageId);
            const updated = images.map(img => ({
                ...img,
                is_primary: img.id === imageId
            }));
            setImages(updated);
        } catch (error) {
            alert('Operation failed');
        }
    };

    if (loading) {
        return (
            <div className="gallery-placeholder">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading Photos...</span>
            </div>
        );
    }

    if (images.length === 0 && !uploading) {
        return (
            <div className="gallery-empty">
                <div className="empty-state">
                    <ImageIcon size={48} strokeWidth={1} />
                    <p>No photos yet</p>
                    {isAdminOrEditor && (
                        <button
                            className="btn-upload-init"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera size={18} />
                            Add First Photo
                        </button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>
        );
    }

    const currentImage = images[currentIndex];

    return (
        <div className="device-gallery">
            <div className="gallery-viewer">
                {uploading && (
                    <div className="upload-overlay">
                        <Loader2 className="animate-spin" />
                        <span>Uploading...</span>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="main-image-container" onClick={() => setIsFullScreen(true)}>
                        <img src={currentImage.image_url} alt={currentImage.caption || 'Device'} />
                        {currentImage.is_primary && (
                            <div className="primary-badge">
                                <CheckCircle size={12} />
                                Primary
                            </div>
                        )}
                    </div>
                )}

                {images.length > 1 && (
                    <>
                        <button
                            className="nav-btn prev"
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1)); }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="nav-btn next"
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0)); }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {isAdminOrEditor && (
                    <div className="gallery-actions">
                        <button className="action-btn upload" onClick={() => fileInputRef.current?.click()} title="Add Photo">
                            <Upload size={18} />
                        </button>
                        {images.length > 0 && (
                            <>
                                <button
                                    className={`action-btn primary ${currentImage.is_primary ? 'active' : ''}`}
                                    onClick={() => handleSetPrimary(currentImage.id)}
                                    title="Set as Primary"
                                >
                                    <CheckCircle size={18} />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(currentImage.id)} title="Delete Photo">
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="thumbnail-strip">
                {images.map((img, idx) => (
                    <div
                        key={img.id}
                        className={`thumb ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    >
                        <img src={img.image_url} alt="" />
                    </div>
                ))}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
            />

            {isFullScreen && (
                <div className="fullscreen-overlay" onClick={() => setIsFullScreen(false)}>
                    <button className="close-fullscreen"><X size={24} /></button>
                    <img src={currentImage.image_url} alt="" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default DeviceImageGallery;
