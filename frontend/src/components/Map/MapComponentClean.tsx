/**
 * Map Component (TypeScript - Simplified)
 * 
 * Clean map rendering - NO internal filtering
 * Receives filtered devices as props
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../utils/constants';
import { getDeviceIcon } from './CustomMarkerIcons';
import type { Device } from '../../types/device';
import './MapComponent.css';
import CanvasTools from './tools/CanvasTools';
import MapLegend from './MapLegend';

// Fix Leaflet default marker icon issue (TypeScript workaround)
// @ts-ignore - Leaflet types don't include _getIconUrl but it exists at runtime
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
 * Map controller to handle map instance and interactions
 */
function MapController({ selectedDevice }: { selectedDevice?: Device | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedDevice && selectedDevice.lat && selectedDevice.lng) {
            map.flyTo([selectedDevice.lat, selectedDevice.lng], 17, {
                duration: 1
            });
        }
    }, [selectedDevice, map]);

    // Auto-fit bounds when devices change
    useEffect(() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon');
        if (markers.length > 0) {
            try {
                const bounds = L.latLngBounds(
                    Array.from(markers).map((marker: any) => {
                        const lat = parseFloat(marker.getAttribute('data-lat') || '0');
                        const lng = parseFloat(marker.getAttribute('data-lng') || '0');
                        return [lat, lng] as [number, number];
                    }).filter(([lat, lng]) => lat && lng)
                );

                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            } catch (e) {
                console.warn('Could not fit bounds:', e);
            }
        }
    }, [map]);

    return null;
}

/**
 * Main Map Component
 * CLEAN VERSION - No internal filtering, just renders what it receives
 */


export function MapComponent({
    devices,
    selectedDevice,
    onDeviceClick
}: MapComponentProps) {

    return (
        <div className="map-component-clean">
            {/* Map Legend - Placed outside to avoid Leaflet context issues */}
            {/* @ts-ignore */}
            <MapLegend />

            <MapContainer
                center={MAP_CONFIG.center as [number, number]}
                zoom={MAP_CONFIG.defaultZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
            >
                <MapController selectedDevice={selectedDevice} />

                {/* Advanced Canvas Tools (Drawing, Text, Measure) */}
                <CanvasTools />

                <LayersControl position="topright">

                    {/* Google Hybrid (Satellite + Labels) */}
                    <BaseLayer checked name="Satellite (Hybrid)">
                        <TileLayer
                            attribution='&copy; Google Maps'
                            url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
                            maxZoom={22}
                        />
                    </BaseLayer>

                    {/* OpenStreetMap - Street View */}
                    <BaseLayer name="OpenStreetMap">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={22}
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
                            // Store lat/lng for bounds calculation
                            {...({ 'data-lat': device.lat, 'data-lng': device.lng } as any)}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapComponent;
