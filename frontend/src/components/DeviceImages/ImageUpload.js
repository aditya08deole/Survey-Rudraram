import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { imageService } from '../../services/imageService';
import './ImageUpload.css';

const ImageUpload = ({ surveyCode, onUploadSuccess, onClose }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setFile(selectedFile);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect({ target: { files: [droppedFile] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            await imageService.uploadImage(surveyCode, file, caption, isPrimary);
            if (onUploadSuccess) onUploadSuccess();
            if (onClose) onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-modal">
            <div className="image-upload-content">
                <div className="image-upload-header">
                    <h3>📷 Upload Device Image</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="image-upload-body">
                    {!preview ? (
                        <div
                            className="upload-dropzone"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <Upload size={48} />
                            <p>Drag & drop an image here</p>
                            <p className="upload-hint">or click to browse</p>
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div className="image-preview">
                            <img src={preview} alt="Preview" />
                            <button
                                className="remove-preview-btn"
                                onClick={() => {
                                    setFile(null);
                                    setPreview(null);
                                }}
                            >
                                <X size={16} /> Remove
                            </button>
                        </div>
                    )}

                    {error && <div className="upload-error">{error}</div>}

                    <div className="upload-options">
                        <label className="upload-option">
                            <input
                                type="text"
                                placeholder="Add caption (optional)"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="caption-input"
                            />
                        </label>

                        <label className="upload-option checkbox-option">
                            <input
                                type="checkbox"
                                checked={isPrimary}
                                onChange={(e) => setIsPrimary(e.target.checked)}
                            />
                            <span>Set as primary image</span>
                        </label>
                    </div>
                </div>

                <div className="image-upload-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
