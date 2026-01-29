/**
 * Map Page Component
 * 
 * Professional geospatial dashboard with unified header architecture
 * Relies on AppContext for state management
 */

import React from 'react';
import { ProfessionalMap } from '../components/Map/ProfessionalMap';
import DeviceSidebar from '../components/Map/DeviceSidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
// @ts-ignore
import { useApp } from '../context/AppContext';
import FilterPanel from '../components/Map/FilterPanel';
import './MapPage.css';

export function MapPage() {
    // ... logic remains same ...
    const {
        getFilteredDevices,
        isLoading,
        error,
        selectedDevice,
        setSelectedDevice,
        refreshData
    } = useApp() as any;

    const filteredDevices = typeof getFilteredDevices === 'function' ? getFilteredDevices() : [];

    // safe handlers
    const handleSetSelectedDevice = setSelectedDevice || ((d: any) => console.warn('setSelectedDevice missing', d));
    const handleRefreshData = refreshData || (() => console.warn('refreshData missing'));

    if (isLoading) {
        return <LoadingAnimation fullScreen message="Loading water infrastructure data..." />;
    }

    if (error) {
        return (
            <div className="map-page-error">
                <AlertTriangle size={48} />
                <h2>Error Loading Data</h2>
                <p>{typeof error === 'string' ? error : 'Unknown error occurred'}</p>
                <button className="btn btn-primary" onClick={() => handleRefreshData()}>
                    <RefreshCw size={18} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="map-page">
            <div className="map-page-content">
                <div className="map-page-main">
                    <FilterPanel />
                    <div className="map-container">
                        <ProfessionalMap
                            devices={filteredDevices}
                            onDeviceClick={handleSetSelectedDevice}
                            selectedDevice={selectedDevice}
                        />
                    </div>
                </div>
            </div>

            {/* Device Details Sidebar */}
            {selectedDevice && (
                <DeviceSidebar
                    device={selectedDevice}
                    onClose={() => handleSetSelectedDevice(null)}
                    onImageUpload={() => {
                        // Image upload completion handler
                        handleRefreshData();
                    }}
                />
            )}
        </div>
    );
}

export default MapPage;
