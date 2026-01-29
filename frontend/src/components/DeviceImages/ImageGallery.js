import React, { useState, useEffect } from 'react';
import { Trash2, Star } from 'lucide-react';
import { imageService } from '../../services/imageService';
import './ImageGallery.css';

const ImageGallery = ({ surveyCode }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const response = await imageService.getDeviceImages(surveyCode);
                // Handle response format variations (array direct or inside data property)
                const imagesData = Array.isArray(response) ? response : (response?.data || []);
                setImages(imagesData);
            } catch (error) {
                console.error('Failed to load images:', error);
            } finally {
                setLoading(false);
            }
        };

        if (surveyCode) {
            loadImages();
        }
    }, [surveyCode]);

    const handleDelete = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await imageService.deleteImage(imageId);
            setImages(images.filter(img => img.id !== imageId));
        } catch (error) {
            console.error('Failed to delete image:', error);
            alert('Failed to delete image');
        }
    };

    const handleSetPrimary = async (imageId) => {
        try {
            await imageService.setPrimaryImage(imageId, surveyCode);
            setImages(images.map(img => ({
                ...img,
                is_primary: img.id === imageId
            })));
        } catch (error) {
            console.error('Failed to set primary image:', error);
            alert('Failed to set primary image');
        }
    };

    if (loading) {
        return <div className="image-gallery-loading">Loading images...</div>;
    }

    if (images.length === 0) {
        return (
            <div className="image-gallery-empty">
                <p>No images uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="image-gallery">
            <div className="image-grid">
                {images.map((image) => (
                    <div key={image.id} className="image-card">
                        {image.is_primary && (
                            <div className="primary-badge">
                                <Star size={14} fill="currentColor" /> Primary
                            </div>
                        )}
                        <img
                            src={image.thumbnail_url || image.image_url}
                            alt={image.caption || 'Device image'}
                            loading="lazy"
                            decoding="async"
                            onClick={() => setSelectedImage(image)}
                            className="gallery-image"
                        />
                        {image.caption && (
                            <div className="image-caption">{image.caption}</div>
                        )}
                        <div className="image-actions">
                            {!image.is_primary && (
                                <button
                                    className="action-btn set-primary-btn"
                                    onClick={() => handleSetPrimary(image.id)}
                                    title="Set as primary"
                                >
                                    <Star size={16} />
                                </button>
                            )}
                            <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(image.id)}
                                title="Delete image"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div className="lightbox" onClick={() => setSelectedImage(null)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage.image_url} alt={selectedImage.caption || 'Device image'} />
                        {selectedImage.caption && (
                            <div className="lightbox-caption">{selectedImage.caption}</div>
                        )}
                        <button
                            className="lightbox-close"
                            onClick={() => setSelectedImage(null)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGallery;
