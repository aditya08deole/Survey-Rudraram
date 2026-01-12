/**
 * Map Component (TypeScript - Fixed)
 * 
 * Clean map rendering with all fixes applied:
 * - HTTPS tiles
 * - maxNativeZoom for ultra zoom (30+)
 * - MapRefresher for layout stability
 * - Performance optimizations
 */

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../utils/constants';
import { getDeviceIcon } from './CustomMarkerIcons';
import type { Device } from '../../types/device';
import './MapComponent.css';
import CanvasTools from './tools/CanvasTools';
import MapLegend from './MapLegend';

// Fix Leaflet default marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { BaseLayer } = LayersControl;

interface MapComponentProps {
    devices: Device[];
    selectedDevice?: Device | null;
    onDeviceClick?: (device: Device) => void;
}

/**
 * MapRefresher - Fixes grey/black map by forcing size recalculation
 */
function MapRefresher() {
    const map = useMap();

    useEffect(() => {
        const resizeMap = () => {
            if (map) {
                map.invalidateSize();
            }
        };

        // Run immediately and after delays to catch animations/transitions
        resizeMap();
        const t1 = setTimeout(resizeMap, 100);
        const t2 = setTimeout(resizeMap, 300);
        const t3 = setTimeout(resizeMap, 1000);

        // Listen for window resize
        window.addEventListener('resize', resizeMap);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', resizeMap);
        };
    }, [map]);

    return null;
}

/**
 * MapController - Handles flying to selected device
 */
function MapController({ selectedDevice }: { selectedDevice?: Device | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedDevice && selectedDevice.lat && selectedDevice.lng) {
            map.flyTo([selectedDevice.lat, selectedDevice.lng], 18, {
                duration: 1.5
            });
        }
    }, [selectedDevice, map]);

    return null;
}

/**
 * BoundsController - Fit map to device bounds using props (not DOM)
 */
function BoundsController({ devices }: { devices: Device[] }) {
    const map = useMap();

    useEffect(() => {
        const validDevices = devices.filter(d => d.lat && d.lng);
        if (validDevices.length > 0) {
            try {
                const bounds = L.latLngBounds(
                    validDevices.map(d => [d.lat!, d.lng!] as [number, number])
                );
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                }
            } catch (e) {
                console.warn('Could not fit bounds:', e);
            }
        }
    }, [devices, map]);

    return null;
}

/**
 * Main Map Component - All fixes applied
 */
export function MapComponent({
    devices,
    selectedDevice,
    onDeviceClick
}: MapComponentProps) {

    // Memoize center to prevent unnecessary re-renders
    const center = useMemo(() => MAP_CONFIG.center as [number, number], []);

    return (
        <div className="map-component-clean">
            {/* Map Legend */}
            {/* @ts-ignore */}
            <MapLegend />

            <MapContainer
                center={center}
                zoom={MAP_CONFIG.defaultZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
                maxZoom={MAP_CONFIG.maxZoom}
                minZoom={MAP_CONFIG.minZoom}
            >
                {/* Critical: MapRefresher fixes black/grey map */}
                <MapRefresher />
                <MapController selectedDevice={selectedDevice} />
                <BoundsController devices={devices} />

                {/* Advanced Canvas Tools */}
                <CanvasTools />

                <LayersControl position="topright">
                    {/* Google Hybrid (Satellite + Labels) - HTTPS with maxNativeZoom */}
                    <BaseLayer checked name="Satellite Hybrid">
                        <TileLayer
                            attribution={MAP_CONFIG.tileProviders.satellite.attribution}
                            url={MAP_CONFIG.tileProviders.satellite.url}
                            maxNativeZoom={MAP_CONFIG.tileProviders.satellite.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                            keepBuffer={8}
                            updateWhenIdle={false}
                            updateWhenZooming={false}
                        />
                    </BaseLayer>

                    {/* OpenStreetMap */}
                    <BaseLayer name="OpenStreetMap">
                        <TileLayer
                            attribution={MAP_CONFIG.tileProviders.standard.attribution}
                            url={MAP_CONFIG.tileProviders.standard.url}
                            maxNativeZoom={MAP_CONFIG.tileProviders.standard.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                            keepBuffer={4}
                        />
                    </BaseLayer>

                    {/* Terrain */}
                    <BaseLayer name="Terrain">
                        <TileLayer
                            attribution={MAP_CONFIG.tileProviders.terrain.attribution}
                            url={MAP_CONFIG.tileProviders.terrain.url}
                            maxNativeZoom={MAP_CONFIG.tileProviders.terrain.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                        />
                    </BaseLayer>
                </LayersControl>

                {/* Device Markers */}
                {devices.map((device, idx) => {
                    if (!device.lat || !device.lng) return null;

                    const isSelected = selectedDevice?.survey_id === device.survey_id;

                    return (
                        <Marker
                            key={device.survey_id || idx}
                            position={[device.lat, device.lng]}
                            icon={getDeviceIcon(device.device_type, device.status, device.original_name || device.survey_id)}
                            opacity={isSelected ? 1 : 0.9}
                            zIndexOffset={isSelected ? 1000 : 0}
                            eventHandlers={{
                                click: () => {
                                    if (onDeviceClick) {
                                        onDeviceClick(device);
                                    }
                                }
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapComponent;
