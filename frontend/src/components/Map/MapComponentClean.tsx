/**
 * Map Component - FIXED VERSION
 * 
 * Fixes applied based on analysis:
 * 1. Uses Esri World Imagery (reliable, no API key)
 * 2. Proper maxNativeZoom on all TileLayers
 * 3. invalidateSize() on baselayerchange
 * 4. Sensible zoom limits (maxZoom: 20)
 * 5. Proper container sizing
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap, useMapEvents } from 'react-leaflet';
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
 * MapInitializer - Handles map setup and invalidateSize on events
 */
function MapInitializer() {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Force size recalculation - critical for preventing grey tiles
        const invalidate = () => {
            map.invalidateSize({ animate: false, pan: false });
        };

        // Initial invalidation with delays to catch all layout changes
        invalidate();
        const t1 = setTimeout(invalidate, 100);
        const t2 = setTimeout(invalidate, 300);
        const t3 = setTimeout(invalidate, 500);

        // CRITICAL: Invalidate when base layer changes - fixes grey tiles on layer switch
        const onBaseLayerChange = () => {
            setTimeout(invalidate, 200);
        };
        map.on('baselayerchange', onBaseLayerChange);

        // Invalidate on window resize
        window.addEventListener('resize', invalidate);

        // Invalidate when tab becomes visible
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                setTimeout(invalidate, 100);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            map.off('baselayerchange', onBaseLayerChange);
            window.removeEventListener('resize', invalidate);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [map]);

    return null;
}

/**
 * MapController - Flies to selected device
 */
function MapController({ selectedDevice }: { selectedDevice?: Device | null }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedDevice) return;

        const lat = selectedDevice.lat || selectedDevice.latitude;
        const lng = selectedDevice.lng || selectedDevice.longitude;

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], 17, { duration: 1 });
        }
    }, [selectedDevice, map]);

    return null;
}

/**
 * Main Map Component
 */
export function MapComponent({
    devices,
    selectedDevice,
    onDeviceClick
}: MapComponentProps) {

    const center = useMemo(() => MAP_CONFIG.center as [number, number], []);
    const { standard, satellite, terrain } = MAP_CONFIG.tileProviders;

    const handleMarkerClick = useCallback((device: Device) => {
        if (onDeviceClick) {
            onDeviceClick(device);
        }
    }, [onDeviceClick]);

    return (
        <div
            className="map-component-clean"
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                minHeight: '400px'  // Ensure container has height
            }}
        >
            {/* @ts-ignore */}
            <MapLegend />

            <MapContainer
                center={center}
                zoom={MAP_CONFIG.defaultZoom}
                minZoom={MAP_CONFIG.minZoom}
                maxZoom={MAP_CONFIG.maxZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
            >
                {/* CRITICAL: Initializer handles invalidateSize */}
                <MapInitializer />
                <MapController selectedDevice={selectedDevice} />
                <CanvasTools />

                <LayersControl position="topright">
                    {/* Satellite - Esri World Imagery (default) */}
                    <BaseLayer checked name="Satellite">
                        <TileLayer
                            url={satellite.url}
                            attribution={satellite.attribution}
                            maxNativeZoom={satellite.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                            tileSize={256}
                        />
                    </BaseLayer>

                    {/* Street Map - OpenStreetMap */}
                    <BaseLayer name="Street Map">
                        <TileLayer
                            url={standard.url}
                            attribution={standard.attribution}
                            maxNativeZoom={standard.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                        />
                    </BaseLayer>

                    {/* Terrain - OpenTopoMap */}
                    <BaseLayer name="Terrain">
                        <TileLayer
                            url={terrain.url}
                            attribution={terrain.attribution}
                            maxNativeZoom={terrain.maxNativeZoom}
                            maxZoom={MAP_CONFIG.maxZoom}
                        />
                    </BaseLayer>
                </LayersControl>

                {/* Device Markers */}
                {devices.map((device, idx) => {
                    const lat = device.lat || device.latitude;
                    const lng = device.lng || device.longitude;

                    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                    const isSelected = selectedDevice?.survey_id === device.survey_id;
                    const deviceType = device.device_type || device.deviceType || 'Unknown';
                    const label = device.original_name || device.survey_id || `Device ${idx + 1}`;

                    return (
                        <Marker
                            key={device.survey_id || `device-${idx}`}
                            position={[lat, lng]}
                            icon={getDeviceIcon(deviceType, device.status, label)}
                            opacity={isSelected ? 1 : 0.85}
                            zIndexOffset={isSelected ? 1000 : 0}
                            eventHandlers={{
                                click: () => handleMarkerClick(device)
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapComponent;
