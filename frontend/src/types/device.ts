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
    deviceType?: DeviceType | null; // Alternate naming from frontend
    status: DeviceStatus | null;

    // GPS coordinates
    lat: number | null;
    lng: number | null;
    latitude?: number | null;  // Alternate naming from DB
    longitude?: number | null; // Alternate naming from DB
    long?: number | null;      // Legacy naming

    // Operational data
    houses: number | null;
    usage_hours: number | null;

    // Technical specifications
    pipe_size: number | null;
    pipe_size_inch?: number | null;
    motor_hp: number | null;
    depth_ft?: number | null;
    capacity?: string | number | null;
    tank_height_m?: number | null;
    tank_circumference?: number | null;
    power_type?: string | null;
    power_distance_m?: number | null;
    houses_connected?: number | null;
    people_connected?: number | null;
    daily_usage_hrs?: number | null;
    material?: string | null;
    type?: string | null;
    lid_access?: string | null;
    location?: string | null;

    // Maintenance
    notes: string | null;

    // Metadata
    row_index?: number;
    done?: boolean;
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

export interface ApiMetadata {
    total_count: number;
    valid_count: number;
    invalid_count: number;
    validation_errors?: any[];
}

export interface ApiResponse {
    success: boolean;
    devices: Device[];
    metadata?: ApiMetadata | null;
    sheet?: string;
    stats?: Stats | null;
    errors?: string[];
    warnings?: string[];
}

export interface Stats {
    totalDevices: number;
    devicesWithCoordinates: number;
    byZone: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
}
