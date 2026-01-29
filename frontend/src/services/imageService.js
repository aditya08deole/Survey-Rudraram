import axios from 'axios';

import { API_BASE_URL } from './apiService';

export const imageService = {
    /**
     * Upload an image for a device
     */
    async uploadImage(surveyCode, file, caption = null, isPrimary = false) {
        // Deprecated: Use Direct Upload in ImageUpload.js
        console.warn("Using deprecated uploadImage service. Please migrate to Direct Upload.");
        const formData = new FormData();
        formData.append('file', file);
        if (caption) formData.append('caption', caption);
        formData.append('is_primary', isPrimary);

        const response = await axios.post(
            `${API_BASE_URL}/device-images/upload/${surveyCode}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    /**
     * Save metadata for a directly uploaded image
     */
    async saveImageMetadata(data) {
        // data: { survey_id, image_url, caption, is_primary }
        const response = await axios.post(
            `${API_BASE_URL}/device-images/meta`,
            data
        );
        return response.data;
    },

    /**
     * Get all images for a device
     */
    async getDeviceImages(surveyCode) {
        const response = await axios.get(
            `${API_BASE_URL}/device-images/${surveyCode}`
        );
        return response.data;
    },

    /**
     * Delete an image
     */
    async deleteImage(imageId) {
        const response = await axios.delete(
            `${API_BASE_URL}/device-images/${imageId}`
        );
        return response.data;
    },

    /**
     * Set an image as primary
     */
    async setPrimaryImage(imageId, surveyCode) {
        const response = await axios.patch(
            `${API_BASE_URL}/device-images/${imageId}/primary?survey_code=${surveyCode}`
        );
        return response.data;
    },
};
