/**
 * Map Component
 * 
 * React-Leaflet map with custom markers for water infrastructure devices.
 */

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, getStatusColor } from '../../utils/constants';
import './MapComponent.css';

// Fix for default marker icons in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Create custom marker icon based on device type and status
 */
const createMarkerIcon = (device) => {
  const statusColor = getStatusColor(device.status);
  const size = 28;
  
  let svgContent;
  
  switch (device.deviceType) {
    case 'Borewell':
      // Circle marker
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${statusColor}" stroke="white" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2}" r="4" fill="white" opacity="0.5"/>
        </svg>
      `;
      break;
    
    case 'Sump':
      // Square marker
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="${size-4}" height="${size-4}" rx="3" fill="${statusColor}" stroke="white" stroke-width="2"/>
          <rect x="${size/2-3}" y="${size/2-3}" width="6" height="6" fill="white" opacity="0.5" rx="1"/>
        </svg>
      `;
      break;
    
    case 'OHT':
      // Triangle marker
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <polygon points="${size/2},3 ${size-3},${size-3} 3,${size-3}" fill="${statusColor}" stroke="white" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2 + 2}" r="3" fill="white" opacity="0.5"/>
        </svg>
      `;
      break;
    
    default:
      // Default circle
      svgContent = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${statusColor}" stroke="white" stroke-width="2"/>
        </svg>
      `;
  }
  
  const svgUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
  
  return L.icon({
    iconUrl: svgUrl,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

/**
 * Component to handle map center updates
 */
function MapCenterHandler({ selectedDevice }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDevice && selectedDevice.lat && selectedDevice.long) {
      map.setView([selectedDevice.lat, selectedDevice.long], 17, {
        animate: true,
        duration: 0.5
      });
    }
  }, [selectedDevice, map]);
  
  return null;
}

/**
 * Main Map Component
 */
function MapComponent({ devices, selectedDevice, onMarkerClick }) {
  const mapRef = useRef(null);

  return (
    <MapContainer
      center={MAP_CONFIG.center}
      zoom={MAP_CONFIG.defaultZoom}
      minZoom={MAP_CONFIG.minZoom}
      maxZoom={MAP_CONFIG.maxZoom}
      className="leaflet-map"
      ref={mapRef}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution={MAP_CONFIG.attribution}
        url={MAP_CONFIG.tileUrl}
      />
      
      <MapCenterHandler selectedDevice={selectedDevice} />
      
      {devices.map((device) => (
        <Marker
          key={device.surveyCode}
          position={[device.lat, device.long]}
          icon={createMarkerIcon(device)}
          eventHandlers={{
            click: () => onMarkerClick(device)
          }}
        >
          <Popup className="custom-popup">
            <div className="popup-content">
              <div className="popup-header">
                <span className="popup-id">{device.surveyCode}</span>
                <span 
                  className="popup-status"
                  style={{ 
                    backgroundColor: getStatusColor(device.status),
                    color: 'white'
                  }}
                >
                  {device.status}
                </span>
              </div>
              <div className="popup-body">
                <p><strong>Type:</strong> {device.deviceType}</p>
                <p><strong>Zone:</strong> {device.zone}</p>
                {device.streetName && (
                  <p><strong>Location:</strong> {device.streetName}</p>
                )}
              </div>
              <div className="popup-footer">
                <button 
                  className="popup-btn"
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
  );
}

export default MapComponent;
