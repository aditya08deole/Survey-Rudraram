/**
 * Advanced Map Component with deck.gl
 * 
 * Features:
 * - 3D Hexagon Layer for device density
 * - Heatmap visualization
 * - Scatterplot with elevation
 * - Smooth animations and transitions
 */

import React, { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Layers, Map as MapIcon, Zap } from 'lucide-react';
import { MAP_CONFIG, getStatusColor } from '../../utils/constants';
import './AdvancedMapComponent.css';

// Mapbox token placeholder (OpenStreetMap doesn't require token)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

function AdvancedMapComponent({ devices, selectedDevice, onDeviceClick }) {
  const [viewState, setViewState] = useState({
    longitude: MAP_CONFIG.center[1],
    latitude: MAP_CONFIG.center[0],
    zoom: MAP_CONFIG.defaultZoom,
    pitch: 45, // 3D view angle
    bearing: 0
  });

  const [layerVisibility, setLayerVisibility] = useState({
    scatterplot: true,
    hexagon: false,
    heatmap: false
  });

  // Transform devices to deck.gl format
  const deckData = useMemo(() => {
    return devices
      .filter(d => d.lat && d.long)
      .map(device => ({
        position: [device.long, device.lat],
        color: hexToRgb(getStatusColor(device.status)),
        radius: 50,
        device: device
      }));
  }, [devices]);

  // Helper: Convert hex color to RGB array
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [150, 150, 150];
  }

  // Scatterplot Layer (device markers)
  const scatterplotLayer = new ScatterplotLayer({
    id: 'scatterplot-layer',
    data: deckData,
    visible: layerVisibility.scatterplot,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 5,
    radiusMaxPixels: 50,
    lineWidthMinPixels: 2,
    getPosition: d => d.position,
    getRadius: d => d.radius,
    getFillColor: d => d.color,
    getLineColor: [255, 255, 255],
    onClick: info => {
      if (info.object && onDeviceClick) {
        onDeviceClick(info.object.device);
      }
    },
    updateTriggers: {
      getFillColor: [devices]
    },
    transitions: {
      getPosition: 600,
      getRadius: 300,
      getFillColor: 300
    }
  });

  // Hexagon Layer (density visualization)
  const hexagonLayer = new HexagonLayer({
    id: 'hexagon-layer',
    data: deckData,
    visible: layerVisibility.hexagon,
    pickable: true,
    extruded: true,
    radius: 100,
    elevationScale: 20,
    getPosition: d => d.position,
    colorRange: [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78]
    ],
    opacity: 0.8,
    coverage: 0.9,
    onClick: info => {
      if (info.object) {
        console.log('Hexagon clicked:', info.object);
      }
    }
  });

  // Heatmap Layer (intensity)
  const heatmapLayer = new HeatmapLayer({
    id: 'heatmap-layer',
    data: deckData,
    visible: layerVisibility.heatmap,
    getPosition: d => d.position,
    getWeight: d => 1,
    radiusPixels: 50,
    intensity: 1,
    threshold: 0.05,
    opacity: 0.6,
    colorRange: [
      [0, 0, 255, 0],
      [0, 255, 255, 128],
      [0, 255, 0, 192],
      [255, 255, 0, 224],
      [255, 0, 0, 255]
    ]
  });

  const layers = [hexagonLayer, heatmapLayer, scatterplotLayer];

  const toggleLayer = (layerName) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <div className="advanced-map-wrapper">
      {/* Layer Controls */}
      <div className="map-layer-controls">
        <div className="layer-controls-header">
          <Layers size={18} />
          <span>Map Layers</span>
        </div>
        <div className="layer-controls-body">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.scatterplot}
              onChange={() => toggleLayer('scatterplot')}
            />
            <span className="layer-icon">📍</span>
            <span>Markers</span>
          </label>
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.hexagon}
              onChange={() => toggleLayer('hexagon')}
            />
            <span className="layer-icon">⬡</span>
            <span>Density (3D)</span>
          </label>
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layerVisibility.heatmap}
              onChange={() => toggleLayer('heatmap')}
            />
            <span className="layer-icon">🔥</span>
            <span>Heatmap</span>
          </label>
        </div>
      </div>

      {/* Deck.GL Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({ object }) => {
          if (object && object.device) {
            const device = object.device;
            return {
              html: `
                <div class="deck-tooltip">
                  <strong>${device.surveyCode}</strong><br/>
                  Type: ${device.deviceType}<br/>
                  Status: ${device.status}<br/>
                  Zone: ${device.zone}
                </div>
              `,
              style: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }
            };
          }
          return null;
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          mapboxAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>

      {/* Device Count Badge */}
      <div className="advanced-map-badge">
        <Zap size={16} />
        <span>{devices.length} devices</span>
      </div>
    </div>
  );
}

export default AdvancedMapComponent;
