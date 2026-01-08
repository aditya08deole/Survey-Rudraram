/**
 * Map Component
 * 
 * Leaflet map with OpenStreetMap and satellite imagery.
 * Displays Rudraram Village with custom markers for water infrastructure devices.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, getStatusColor } from '../../utils/constants';
import './MapComponent.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


/**
 * Create custom marker icon based on device type and status
 */
const createMarkerIcon = (device) => {
  const statusColor = getStatusColor(device.status);
  const size = 32;
  
  let svgPath;
  
  switch (device.deviceType) {
    case 'Borewell':
      // Circle marker
      svgPath = `M ${size/2} ${size/2} m -${size/3}, 0 a ${size/3},${size/3} 0 1,0 ${size/3*2},0 a ${size/3},${size/3} 0 1,0 -${size/3*2},0`;
      break;
    
    case 'Sump':
      // Square marker  
      svgPath = `M ${size/4} ${size/4} h ${size/2} v ${size/2} h -${size/2} z`;
      break;
    
    case 'OHT':
      // Triangle marker
      svgPath = `M ${size/2} ${size/4} L ${size/4*3} ${size/4*3} L ${size/4} ${size/4*3} z`;
      break;
    
    default:
      // Default circle
      svgPath = `M ${size/2} ${size/2} m -${size/3}, 0 a ${size/3},${size/3} 0 1,0 ${size/3*2},0 a ${size/3},${size/3} 0 1,0 -${size/3*2},0`;
  }
  
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <path d="${svgPath}" fill="${statusColor}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgContent,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};


/**
 * Map controller to handle map instance and interactions
 */
function MapController({ selectedDevice }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDevice && selectedDevice.lat && selectedDevice.long) {
      map.flyTo([selectedDevice.lat, selectedDevice.long], 17);
    }
  }, [selectedDevice, map]);

  return null;
}


/**
 * Main Map Component
 */
function MapComponent({ devices, selectedDevice, onMarkerClick }) {
  const center = useMemo(() => MAP_CONFIG.center, []);
  const zoom = useMemo(() => MAP_CONFIG.defaultZoom, []);

  const { BaseLayer } = LayersControl;

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-map-container"
        zoomControl={true}
        scrollWheelZoom={true}
        maxZoom={22}
        minZoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController selectedDevice={selectedDevice} />
        <LayersControl position="topright">
          {/* Satellite Imagery - Default View */}
          <BaseLayer checked name="Satellite View">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
        {devices.map((device) => (
          <Marker
            key={device.surveyCode}
            position={[device.lat, device.long]}
            icon={createMarkerIcon(device)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(device);
                }
              }
            }}
          >
            <Popup>
              <div className="info-window-content">
                <div className="info-window-header">
                  <span className="info-window-id">{device.surveyCode}</span>
                  <span 
                    className="info-window-status"
                    style={{ 
                      backgroundColor: getStatusColor(device.status),
                      color: 'white'
                    }}
                  >
                    {device.status}
                  </span>
                </div>
                <div className="info-window-body">
                  <p><strong>Type:</strong> {device.deviceType}</p>
                  <p><strong>Zone:</strong> {device.zone}</p>
                  {device.streetName && (
                    <p><strong>Location:</strong> {device.streetName}</p>
                  )}
                </div>
                <div className="info-window-footer">
                  <button 
                    className="info-window-btn"
                    onClick={() => onMarkerClick(device)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
