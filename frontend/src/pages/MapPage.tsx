/**
 * Map Page Component
 * 
 * Professional geospatial dashboard with unified header architecture
 * Relies on AppContext for state management
 */

import React from 'react';
import MapComponent from '../components/Map/MapComponentClean';
import DeviceSidebar from '../components/Map/DeviceSidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
// @ts-ignore
import { useApp } from '../context/AppContext';
import './MapPage.css';

export function MapPage() {
    // Use Global Context instead of local state
    // @ts-ignore
    const {
        getFilteredDevices,
        isLoading,
        error,
        selectedDevice,
        actions
    } = useApp() as any;

    const filteredDevices = typeof getFilteredDevices === 'function' ? getFilteredDevices() : [];
    const safeActions = actions || { setSelectedDevice: () => { }, refreshData: () => { } };

    if (isLoading) {
        return <LoadingAnimation fullScreen message="Loading water infrastructure data..." />;
    }

    if (error) {
        return (
            <div className="map-page-error">
                <AlertTriangle size={48} />
                <h2>Error Loading Data</h2>
                <p>{typeof error === 'string' ? error : 'Unknown error occurred'}</p>
                <button className="btn btn-primary" onClick={() => safeActions.refreshData()}>
                    <RefreshCw size={18} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="map-page">
            {/* Command Bar Removed - Functions merged into NavigationHeader */}

            <div className="map-page-content">
                {/* Main Content Area */}
                <div className="map-page-main">
                    {/* Map */}
                    <div className="map-container">
                        <MapComponent
                            devices={filteredDevices}
                            onDeviceClick={safeActions.setSelectedDevice}
                            selectedDevice={selectedDevice}
                        />
                    </div>
                </div>
            </div>

            {/* Device Details Sidebar */}
            {selectedDevice && (
                <DeviceSidebar
                    device={selectedDevice}
                    onClose={() => safeActions.setSelectedDevice(null)}
                    onImageUpload={() => {
                        // Image upload completion handler
                        safeActions.refreshData();
                    }}
                />
            )}
        </div>
    );
}

export default MapPage;
