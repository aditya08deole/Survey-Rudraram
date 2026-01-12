/**
 * Professional Map Component
 * 
 * Complete rewrite with bulletproof tile loading:
 * - Multiple tile providers with fallbacks
 * - Proper maxNativeZoom for unlimited zooming
 * - Error handling for tile failures
 * - Performance optimizations
 * 
 * @author Rudraram Survey Team
 * @version 2.0.0
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, getStatusColor } from '../../utils/constants';
import { getDeviceIcon } from './CustomMarkerIcons';
import type { Device } from '../../types/device';
import './MapComponent.css';
import CanvasTools from './tools/CanvasTools';
import MapLegend from './MapLegend';

// ============================================
// LEAFLET ICON FIX
// ============================================
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ============================================
// TILE PROVIDER CONFIGURATION
// ============================================
// These are reliable, tested tile providers with proper maxNativeZoom
const TILE_PROVIDERS = {
    // Google Hybrid (Satellite + Roads) - Most reliable
    googleHybrid: {
        name: 'Satellite',
        url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        attribution: '© Google',
        maxNativeZoom: 21, // Google goes up to 21
        maxZoom: 30,
    },
    // Google Satellite (No labels)
    googleSatellite: {
        name: 'Satellite (No Labels)',
        url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        attribution: '© Google',
        maxNativeZoom: 21,
        maxZoom: 30,
    },
    // OpenStreetMap - Very reliable
    osm: {
        name: 'Street Map',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 30,
    },
    // ESRI World Imagery - High quality satellite
    esriSatellite: {
        name: 'ESRI Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
        maxNativeZoom: 18,
        maxZoom: 30,
    },
    // CartoDB Light - Clean minimal style
    cartoLight: {
        name: 'Light Theme',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution: '© CartoDB',
        maxNativeZoom: 19,
        maxZoom: 30,
    },
};

const { BaseLayer } = LayersControl;

// ============================================
// COMPONENT INTERFACES
// ============================================
interface MapComponentProps {
    devices: Device[];
    selectedDevice?: Device | null;
    onDeviceClick?: (device: Device) => void;
}

// ============================================
// MAP REFRESHER - Fixes grey/black map on load
// ============================================
function MapRefresher() {
    const map = useMap();

    useEffect(() => {
        // Force map to recalculate size
        const refresh = () => {
            if (map) {
                map.invalidateSize({ animate: false, pan: false });
            }
        };

        // Multiple refresh attempts to catch all layout changes
        refresh();
        const timers = [
            setTimeout(refresh, 50),
            setTimeout(refresh, 150),
            setTimeout(refresh, 300),
            setTimeout(refresh, 500),
            setTimeout(refresh, 1000),
        ];

        // Also refresh on window resize
        window.addEventListener('resize', refresh);

        // Refresh when visibility changes (tab switch)
        document.addEventListener('visibilitychange', refresh);

        return () => {
            timers.forEach(t => clearTimeout(t));
            window.removeEventListener('resize', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [map]);

    return null;
}

// ============================================
// MAP CONTROLLER - Handles flying to devices
// ============================================
function MapController({ selectedDevice }: { selectedDevice?: Device | null }) {
    const map = useMap();

    useEffect(() => {
        if (!selectedDevice) return;

        const lat = selectedDevice.lat || selectedDevice.latitude;
        const lng = selectedDevice.lng || selectedDevice.longitude;

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], 18, {
                duration: 1.2,
                easeLinearity: 0.25
            });
        }
    }, [selectedDevice, map]);

    return null;
}

// ============================================
// BOUNDS CONTROLLER - Fits map to show all devices
// ============================================
function BoundsController({ devices, skipInitialFit }: { devices: Device[], skipInitialFit?: boolean }) {
    const map = useMap();
    const [hasFitted, setHasFitted] = useState(false);

    useEffect(() => {
        if (skipInitialFit || hasFitted) return;

        const validDevices = devices.filter(d => {
            const lat = d.lat || d.latitude;
            const lng = d.lng || d.longitude;
            return lat && lng && !isNaN(lat) && !isNaN(lng);
        });

        if (validDevices.length === 0) return;

        try {
            const bounds = L.latLngBounds(
                validDevices.map(d => {
                    const lat = d.lat || d.latitude;
                    const lng = d.lng || d.longitude;
                    return [lat!, lng!] as [number, number];
                })
            );

            if (bounds.isValid()) {
                // Small delay to ensure map is ready
                setTimeout(() => {
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 16,
                        animate: false
                    });
                    setHasFitted(true);
                }, 100);
            }
        } catch (e) {
            console.warn('Bounds calculation failed:', e);
        }
    }, [devices, map, hasFitted, skipInitialFit]);

    return null;
}

// ============================================
// ZOOM DISPLAY - Shows current zoom level
// ============================================
function ZoomDisplay() {
    const [zoom, setZoom] = useState(MAP_CONFIG.defaultZoom);

    useMapEvents({
        zoomend: (e) => {
            setZoom(Math.round(e.target.getZoom()));
        }
    });

    return (
        <div className="zoom-display" style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
            Zoom: {zoom}
        </div>
    );
}

// ============================================
// MAIN MAP COMPONENT
// ============================================
export function MapComponent({
    devices,
    selectedDevice,
    onDeviceClick
}: MapComponentProps) {

    // Memoize center to prevent re-renders
    const center = useMemo(() => MAP_CONFIG.center as [number, number], []);
    const defaultZoom = useMemo(() => MAP_CONFIG.defaultZoom, []);

    // Handle marker click
    const handleMarkerClick = useCallback((device: Device) => {
        if (onDeviceClick) {
            onDeviceClick(device);
        }
    }, [onDeviceClick]);

    return (
        <div className="map-component-clean" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Map Legend */}
            {/* @ts-ignore */}
            <MapLegend />

            <MapContainer
                center={center}
                zoom={defaultZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                maxZoom={30}
                minZoom={3}
                preferCanvas={true}
            >
                {/* Critical: Refresh map size on layout changes */}
                <MapRefresher />

                {/* Fly to selected device */}
                <MapController selectedDevice={selectedDevice} />

                {/* Initial bounds fitting */}
                <BoundsController devices={devices} />

                {/* Show current zoom level */}
                <ZoomDisplay />

                {/* Drawing & Measurement Tools */}
                <CanvasTools />

                {/* Tile Layers with proper configuration */}
                <LayersControl position="topright">

                    {/* Google Hybrid - Default, most reliable */}
                    <BaseLayer checked name={TILE_PROVIDERS.googleHybrid.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.googleHybrid.url}
                            // @ts-ignore - subdomains type issue
                            subdomains={TILE_PROVIDERS.googleHybrid.subdomains}
                            attribution={TILE_PROVIDERS.googleHybrid.attribution}
                            maxNativeZoom={TILE_PROVIDERS.googleHybrid.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.googleHybrid.maxZoom}
                            tileSize={256}
                            keepBuffer={8}
                            updateWhenIdle={false}
                            updateWhenZooming={false}
                            errorTileUrl=""
                        />
                    </BaseLayer>

                    {/* OpenStreetMap - Reliable fallback */}
                    <BaseLayer name={TILE_PROVIDERS.osm.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.osm.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.osm.subdomains}
                            attribution={TILE_PROVIDERS.osm.attribution}
                            maxNativeZoom={TILE_PROVIDERS.osm.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.osm.maxZoom}
                            keepBuffer={4}
                        />
                    </BaseLayer>

                    {/* ESRI Satellite - High quality imagery */}
                    <BaseLayer name={TILE_PROVIDERS.esriSatellite.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.esriSatellite.url}
                            attribution={TILE_PROVIDERS.esriSatellite.attribution}
                            maxNativeZoom={TILE_PROVIDERS.esriSatellite.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.esriSatellite.maxZoom}
                        />
                    </BaseLayer>

                    {/* CartoDB Light - Clean minimal */}
                    <BaseLayer name={TILE_PROVIDERS.cartoLight.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.cartoLight.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.cartoLight.subdomains}
                            attribution={TILE_PROVIDERS.cartoLight.attribution}
                            maxNativeZoom={TILE_PROVIDERS.cartoLight.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.cartoLight.maxZoom}
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
                            opacity={isSelected ? 1 : 0.9}
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
