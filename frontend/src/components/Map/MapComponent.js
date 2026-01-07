/**
 * Map Component
 * 
 * Google Maps with custom markers for water infrastructure devices.
 * Displays Rudraram Village with satellite imagery.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MAP_CONFIG, getStatusColor } from '../../utils/constants';
import './MapComponent.css';

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
  
  const svgUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
  
  return {
    url: svgUrl,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size/2, size/2)
  };
};

/**
 * Main Map Component
 */
function MapComponent({ devices, selectedDevice, onMarkerClick }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAP_CONFIG.googleMapsApiKey,
    libraries: ['places']
  });

  // Map options
  const mapOptions = {
    mapTypeId: 'hybrid', // Satellite view with labels
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
    },
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
  };

  // Handle map load
  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((device) => {
    setSelectedMarker(device);
    if (onMarkerClick) {
      onMarkerClick(device);
    }
  }, [onMarkerClick]);

  // Center map on selected device
  useEffect(() => {
    if (mapInstance && selectedDevice && selectedDevice.lat && selectedDevice.long) {
      mapInstance.panTo({ lat: selectedDevice.lat, lng: selectedDevice.long });
      mapInstance.setZoom(17);
      setSelectedMarker(selectedDevice);
    }
  }, [selectedDevice, mapInstance]);

  if (loadError) {
    return (
      <div className="map-error">
        <p>Error loading Google Maps</p>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          Please check your internet connection and try again
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName="google-map-container"
      center={{ lat: MAP_CONFIG.center[0], lng: MAP_CONFIG.center[1] }}
      zoom={MAP_CONFIG.defaultZoom}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {devices.map((device) => (
        <Marker
          key={device.surveyCode}
          position={{ lat: device.lat, lng: device.long }}
          icon={createMarkerIcon(device)}
          onClick={() => handleMarkerClick(device)}
          title={`${device.surveyCode} - ${device.deviceType}`}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.long }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="info-window-content">
            <div className="info-window-header">
              <span className="info-window-id">{selectedMarker.surveyCode}</span>
              <span 
                className="info-window-status"
                style={{ 
                  backgroundColor: getStatusColor(selectedMarker.status),
                  color: 'white'
                }}
              >
                {selectedMarker.status}
              </span>
            </div>
            <div className="info-window-body">
              <p><strong>Type:</strong> {selectedMarker.deviceType}</p>
              <p><strong>Zone:</strong> {selectedMarker.zone}</p>
              {selectedMarker.streetName && (
                <p><strong>Location:</strong> {selectedMarker.streetName}</p>
              )}
            </div>
            <div className="info-window-footer">
              <button 
                className="info-window-btn"
                onClick={() => onMarkerClick(selectedMarker)}
              >
                View Details
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default MapComponent;
