/**
 * WORLD-CLASS MAP COMPONENT
 * 
 * Features:
 * - 5 Tile Providers (Sat: 22x, Street: 28x)
 * - Canvas Tools Integration
 * - Spotlight Integration (New)
 * - Stability Controller
 * - Smooth Animations
 * 
 * @version 5.1.0
 */

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDeviceIcon } from './CustomMarkerIcons';
import CanvasTools from './tools/CanvasTools';
import HeatmapLayer from './HeatmapLayer';
import ActivityStream from './ActivityStream';
import AssetInspector from './AssetInspector';
import ElevationProfile from './ElevationProfile';
import TimelineSlider from './TimelineSlider';

import Spotlight from '../Command/Spotlight';
import type { Device } from '../../types/device';
import './ProfessionalMap.css';

// ===================================
// CONFIGURATION
// ===================================
const CONFIG = {
    center: [17.558599, 78.166078] as [number, number],
    defaultZoom: 15,
    minZoom: 10, // Prevent zooming out to world level (keep focus on Rudraram)
    maxZoomGlobal: 24, // Optimized max for vector
    maxZoomSatellite: 22,
};

// ===================================
// TILE PROVIDERS
// ===================================
const TILE_PROVIDERS = {
    satellite: {
        name: '🛰️ Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
        maxNativeZoom: 19,
        maxZoom: 22 // Cap here
    },
    street: {
        name: '🗺️ Street Map',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap',
        maxNativeZoom: 19,
        maxZoom: 28
    },
    carto: {
        name: '✨ Modern',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution: '© CartoDB',
        maxNativeZoom: 20,
        maxZoom: 28
    },
    dark: {
        name: '🌑 Dark Mode',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution: '© CartoDB',
        maxNativeZoom: 20,
        maxZoom: 28
    },
    terrain: {
        name: '⛰️ Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenTopoMap',
        maxNativeZoom: 17,
        maxZoom: 24
    }
};

// Fix Leaflet Icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const { BaseLayer } = LayersControl;

interface MapProps {
    devices: Device[];
    selectedDevice?: Device | null;
    onDeviceClick?: (device: Device | null) => void;
}

// Stability & Auto-Refresh
function MapStability() {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const refresh = () => map.invalidateSize({ animate: false });

        refresh();
        const t1 = setTimeout(refresh, 200);
        const t2 = setTimeout(refresh, 1000);

        map.on('baselayerchange', () => setTimeout(refresh, 100));
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [map]);
    return null;
}

// Fly To Device
function FlyToController({ device }: { device?: Device | null }) {
    const map = useMap();
    useEffect(() => {
        if (!device) return;
        const lat = Number(device.lat || device.latitude);
        const lng = Number(device.lng || device.longitude);
        if (lat && lng) map.flyTo([lat, lng], 18, { duration: 1.5 });
    }, [device, map]);
    return null;
}

// Layer Controller Helper
// Helps switch layers programmatically via Spotlight
function LayerSwitcher({ activeLayer }: { activeLayer: string }) {
    const map = useMap();
    useEffect(() => {
        // This is a bit hacky as LayersControl manages its own state
        // To properly switch, we might need to find the layer control or just force add layer
        // Ideally, we rely on the `checked` prop in LayersControl.
        // But LayersControl only respects `checked` on initial render in some versions.
        // Let's try to manually add the layer if needed, or trust re-render.
        // For now, simpler approach: rely on the BaseLayer 'checked' prop which we are controlling via state.
    }, [activeLayer, map]);
    return null;
}

// Main Component
export function ProfessionalMap({ devices, selectedDevice, onDeviceClick }: MapProps) {
    const [activeLayer, setActiveLayer] = useState('satellite');
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [timelineDate, setTimelineDate] = useState<Date>(new Date());

    // Filter devices based on timeline
    const filteredByTime = useMemo(() => {
        return devices.filter(d => {
            // If no timestamp, assume it's always visible for now
            if (!d.done) return true;
            const itemDate = new Date(Date.now() - (Math.random() * 10000000000)); // Simulating history for demo
            return itemDate <= timelineDate;
        });
    }, [devices, timelineDate]);

    // Prepare heatmap points: [lat, lng, intensity]
    const heatmapPoints = useMemo(() =>
        filteredByTime
            .map(d => {
                const lat = Number(d.lat || d.latitude);
                const lng = Number(d.lng || d.longitude);
                return (lat && lng) ? [lat, lng, 1.0] as [number, number, number] : null;
            })
            .filter((p): p is [number, number, number] => p !== null)
        , [filteredByTime]);

    // Prevent propagation when clicking markers
    const handleMarkerClick = useCallback((e: any, device: Device) => {
        L.DomEvent.stopPropagation(e);
        onDeviceClick?.(device);
    }, [onDeviceClick]);

    const handleCommand = (cmd: string) => {
        if (cmd === 'LAYER_SATELLITE') setActiveLayer('satellite');
        if (cmd === 'LAYER_STREET') setActiveLayer('street');
        if (cmd === 'TOGGLE_HEATMAP') setShowHeatmap(!showHeatmap);
        if (cmd === 'CLEAR') onDeviceClick?.({} as Device);
    };

    return (
        <div className="professional-map">
            <Spotlight
                devices={devices}
                onDeviceSelect={(d) => onDeviceClick?.(d)}
                onCommand={handleCommand}
            />

            <MapContainer
                center={CONFIG.center}
                zoom={CONFIG.defaultZoom}
                minZoom={CONFIG.minZoom}
                maxZoom={CONFIG.maxZoomGlobal}
                className="map-main"
                zoomControl={false}
            >
                <MapStability />
                <FlyToController device={selectedDevice} />
                <ZoomControl position="bottomright" />

                {/* Canvas Tools Overlay */}
                <CanvasTools />

                {/* Operational Intelligence Feed */}
                <ActivityStream
                    devices={devices}
                    onActivityClick={(d) => onDeviceClick?.(d)}
                />

                <AssetInspector
                    device={selectedDevice || null}
                    onClose={() => onDeviceClick?.(null)}
                />

                {/* Terrain Intelligence Panel */}
                {selectedDevice && (
                    <ElevationProfile
                        source={selectedDevice}
                        destination={devices.find(d => d.survey_id !== selectedDevice.survey_id) || null}
                    />
                )}

                {/* Timeline Progress Slider */}
                <TimelineSlider
                    onDateChange={(date) => setTimelineDate(date)}
                />

                {/* Heatmap Layer */}
                {showHeatmap && (
                    <HeatmapLayer
                        points={heatmapPoints}
                        options={{
                            radius: 40,
                            blur: 25,
                            max: 1.0,
                            gradient: {
                                0.2: 'rgba(0, 240, 255, 0.2)', // Laser Cyan
                                0.4: 'rgba(0, 255, 156, 0.4)', // Emerald
                                0.6: 'rgba(255, 179, 0, 0.6)', // Gold
                                0.8: 'rgba(255, 61, 104, 0.8)' // Ruby
                            }
                        }}
                    />
                )}

                <LayersControl position="bottomright">
                    {/* Satellite */}
                    <BaseLayer checked={activeLayer === 'satellite'} name={TILE_PROVIDERS.satellite.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.satellite.url}
                            attribution={TILE_PROVIDERS.satellite.attribution}
                            maxNativeZoom={TILE_PROVIDERS.satellite.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.satellite.maxZoom}
                            eventHandlers={{ add: () => setActiveLayer('satellite') }}
                        />
                    </BaseLayer>

                    {/* Street */}
                    <BaseLayer checked={activeLayer === 'street'} name={TILE_PROVIDERS.street.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.street.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.street.subdomains}
                            attribution={TILE_PROVIDERS.street.attribution}
                            maxNativeZoom={TILE_PROVIDERS.street.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.street.maxZoom}
                            eventHandlers={{ add: () => setActiveLayer('street') }}
                        />
                    </BaseLayer>

                    {/* Modern */}
                    <BaseLayer name={TILE_PROVIDERS.carto.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.carto.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.carto.subdomains}
                            attribution={TILE_PROVIDERS.carto.attribution}
                            maxNativeZoom={TILE_PROVIDERS.carto.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.carto.maxZoom}
                        />
                    </BaseLayer>

                    {/* Dark */}
                    <BaseLayer name={TILE_PROVIDERS.dark.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.dark.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.dark.subdomains}
                            attribution={TILE_PROVIDERS.dark.attribution}
                            maxNativeZoom={TILE_PROVIDERS.dark.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.dark.maxZoom}
                        />
                    </BaseLayer>

                    {/* Terrain */}
                    <BaseLayer name={TILE_PROVIDERS.terrain.name}>
                        <TileLayer
                            url={TILE_PROVIDERS.terrain.url}
                            // @ts-ignore
                            subdomains={TILE_PROVIDERS.terrain.subdomains}
                            attribution={TILE_PROVIDERS.terrain.attribution}
                            maxNativeZoom={TILE_PROVIDERS.terrain.maxNativeZoom}
                            maxZoom={TILE_PROVIDERS.terrain.maxZoom}
                        />
                    </BaseLayer>

                    {/* Heatmap Toggle Overlay */}
                    <LayersControl.Overlay checked={showHeatmap} name="🔥 Heatmap Density">
                        <LayerSwitcher activeLayer={showHeatmap ? 'heatmap' : 'none'} />
                    </LayersControl.Overlay>
                </LayersControl>

                {/* Pinpoint Device Markers */}
                {filteredByTime.map((device, idx) => {
                    const lat = Number(device.lat || device.latitude);
                    const lng = Number(device.lng || device.longitude);
                    if (!lat || !lng) return null;

                    const isSelected = selectedDevice?.survey_id === device.survey_id;
                    const type = device.device_type || 'BOREWELL';
                    const label = device.original_name || device.survey_id;

                    return (
                        <Marker
                            key={device.survey_id || idx}
                            position={[lat, lng]}
                            icon={getDeviceIcon(device)}
                            opacity={isSelected ? 1 : 0.85}
                            zIndexOffset={isSelected ? 2000 : 1000} // Higher than heatmap
                            eventHandlers={{
                                click: (e) => handleMarkerClick(e, device)
                            }}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

const ProfessionalMapMemo = React.memo(ProfessionalMap);
export default ProfessionalMapMemo;
