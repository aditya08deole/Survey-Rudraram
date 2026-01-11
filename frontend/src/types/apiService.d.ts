/**
 * Type declarations for apiService.js
 * Provides TypeScript types for JavaScript API service
 */

import type { ApiResponse } from './device';

declare module '../services/apiService' {
    export function fetchSurveyData(sheet?: string): Promise<ApiResponse>;
    export function fetchSurveyStats(): Promise<any>;
    export function fetchDeviceByCode(surveyCode: string): Promise<any>;
    export function uploadDeviceImage(surveyCode: string, file: File): Promise<any>;
    export function fetchDeviceImages(surveyCode: string): Promise<any>;
}
