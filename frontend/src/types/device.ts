/**
 * Device Type Definitions
 * Canonical types matching backend schema
 */

export type DeviceType = 'Borewell' | 'Sump' | 'OHSR' | 'OHT';

export type DeviceStatus = 'Working' | 'Not Working' | 'On Repair' | 'Failed';

export interface Device {
    // Core identification
    survey_id: string;
    original_name: string | null;

    // Location
    zone: string | null;
    street: string | null;

    // Device information
    device_type: DeviceType | null;
    status: DeviceStatus | null;

    // GPS coordinates
    lat: number | null;
    lng: number | null;

    // Operational data
    houses: number | null;
    usage_hours: number | null;

    // Technical specifications
    pipe_size: number | null;
    motor_hp: number | null;

    // Maintenance
    notes: string | null;

    // Metadata
    row_index?: number;
}

export interface Filters {
    searchText: string;
    zone: string | null;
    deviceType: DeviceType | null;
    status: DeviceStatus | null;
}

export interface FilterCount {
    total: number;
    filtered: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    devices?: Device[];
    metadata?: ApiMetadata;
    error?: string;
    errors?: string[];
}

export interface ApiMetadata {
    sheet_name: string;
    total_rows: number;
    valid_count: number;
    invalid_count: number;
    validation_rate: number;
    error_breakdown: Record<string, number>;
    header_validation: {
        valid: boolean;
        missing_headers: string[];
        extra_headers: string[];
        warnings: string[];
    };
    cached_at: string;
}

export interface Stats {
    totalDevices: number;
    devicesWithCoordinates: number;
    byZone: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
}
