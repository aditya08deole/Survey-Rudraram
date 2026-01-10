import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const imageService = {
    /**
     * Upload an image for a device
     */
    async uploadImage(surveyCode, file, caption = null, isPrimary = false) {
        const formData = new FormData();
        formData.append('file', file);
        if (caption) formData.append('caption', caption);
        formData.append('is_primary', isPrimary);

        const response = await axios.post(
            `${API_BASE_URL}/device-images/upload/${surveyCode}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
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
