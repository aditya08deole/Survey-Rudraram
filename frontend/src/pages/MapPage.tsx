/**
 * Map Page Component
 * 
 * Professional geospatial dashboard with command-bar architecture
 * Single source of truth for all filtering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDeviceFilters } from '../hooks/useDeviceFilters';
import { fetchSurveyData } from '../services/apiService';
import CommandBar from '../components/Dashboard/CommandBar';
import FilterSidebar from '../components/Dashboard/FilterSidebar';
import MapComponent from '../components/Map/MapComponent';
import DeviceSidebar from '../components/Map/DeviceSidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { Device, DeviceType, DeviceStatus } from '../types/device';
import * as XLSX from 'xlsx';
import './MapPage.css';

export function MapPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [metadata, setMetadata] = useState<any>(null);

    // Single source of truth for filtering
    const {
        filters,
        updateFilters,
        resetFilters,
        hasActiveFilters,
        filteredDevices,
        filterCount
    } = useDeviceFilters(allDevices);

    // Fetch devices on mount
    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchSurveyData();

            if (response.success) {
                setAllDevices(response.devices);
                setMetadata(response.metadata);
            } else {
                setError(response.errors?.[0] || 'Failed to load devices');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique values for dropdowns
    const zones = useMemo(() =>
        [...new Set(allDevices.map(d => d.zone).filter(Boolean))] as string[],
        [allDevices]
    );

    const deviceTypes = useMemo(() =>
        [...new Set(allDevices.map(d => d.device_type).filter(Boolean))] as DeviceType[],
        [allDevices]
    );

    const statuses = useMemo(() =>
        [...new Set(allDevices.map(d => d.status).filter(Boolean))] as DeviceStatus[],
        [allDevices]
    );

    // Export filtered devices to Excel
    const handleExport = () => {
        try {
            // Prepare data for export
            const exportData = filteredDevices.map(device => ({
                'Survey Code': device.survey_id,
                'Zone': device.zone || '',
                'Street / Landmark': device.street || '',
                'Device Type': device.device_type || '',
                'Status': device.status || '',
                'Latitude': device.lat || '',
                'Longitude': device.lng || '',
                'Connected Houses': device.houses || '',
                'Daily Usage (hrs)': device.usage_hours || '',
                'Pipe Size (inch)': device.pipe_size || '',
                'Motor HP': device.motor_hp || '',
                'Notes': device.notes || ''
            }));

            // Create workbook
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Filtered Devices');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `rudraram-survey-filtered-${timestamp}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data');
        }
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading water infrastructure data..." />;
    }

    if (error) {
        return (
            <div className="map-page-error">
                <AlertTriangle size={48} />
                <h2>Error Loading Data</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={loadDevices}>
                    <RefreshCw size={18} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="map-page">
            {/* Command Bar Header */}
            <CommandBar
                filters={filters}
                onFilterChange={updateFilters}
                onResetFilters={resetFilters}
                filterCount={filterCount}
                zones={zones}
                deviceTypes={deviceTypes}
                statuses={statuses}
                onExport={handleExport}
                hasActiveFilters={hasActiveFilters}
            />

            <div className="map-page-content">
                {/* Left Sidebar Filters */}
                <FilterSidebar
                    filters={filters}
                    onFilterChange={updateFilters}
                    zones={zones}
                    deviceTypes={deviceTypes}
                    statuses={statuses}
                    filterCount={filterCount}
                />

                {/* Main Content Area */}
                <div className="map-page-main">
                    {/* Map */}
                    <div className="map-container">
                        <MapComponent
                            devices={filteredDevices}
                            onDeviceClick={setSelectedDevice}
                            selectedDevice={selectedDevice}
                        />
                    </div>

                    {/* Validation Metrics (if available) */}
                    {metadata && metadata.invalid_count > 0 && (
                        <div className="validation-alert">
                            <AlertTriangle size={16} />
                            <span>
                                {metadata.invalid_count} devices hidden due to missing GPS coordinates or invalid data
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Device Details Sidebar */}
            {selectedDevice && (
                <DeviceSidebar
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                />
            )}
        </div>
    );
}

export default MapPage;
