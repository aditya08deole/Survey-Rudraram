/**
 * Map Component
 * 
 * Leaflet map with OpenStreetMap and satellite imagery.
 * Displays Rudraram Village with custom markers for water infrastructure devices.
 * Features: Clustering, Search, Filters, Heatmap, Accessibility
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap } from 'react-leaflet';
import { Eye, Search, Filter, Download, X } from 'lucide-react';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, getStatusColor, STATUS_CONFIG } from '../../utils/constants';
import { getDeviceIcon } from './CustomMarkerIcons';
import DeviceSidebar from './DeviceSidebar';
import DrawingTools from './tools/DrawingTools';
import MeasurementTool from './tools/MeasurementTool';
import './MapComponent.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


/**
 * Create custom marker icon based on device type and status with neon glow
 */
const createMarkerIcon = (device, isSelected = false) => {
  const statusColor = getStatusColor(device.status);
  const size = 36;

  let svgPath;
  let deviceType = device.deviceType || device.type;

  // Infer device type from Type, surveyCode, or originalName
  if (!deviceType) {
    const checkStr = ((device.surveyCode || '') + (device.originalName || '') + (device.surveyCodeId || '')).toUpperCase();
    if (checkStr.includes('BW') || checkStr.includes('BORE')) {
      deviceType = 'Borewell';
    } else if (checkStr.includes('SM') || checkStr.includes('SUMP')) {
      deviceType = 'Sump';
    } else if (checkStr.includes('OH') || checkStr.includes('OHT') || checkStr.includes('OHSR') || checkStr.includes('CMSR')) {
      deviceType = 'OHT';
    }
  }

  switch (deviceType) {
    case 'Borewell':
      // Circle with center dot (water well)
      svgPath = `
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${statusColor}" stroke="white" stroke-width="3"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 6}" fill="white"/>
      `;
      break;

    case 'Sump':
      // Square with rounded corners
      svgPath = `
        <rect x="${size / 4}" y="${size / 4}" width="${size / 2}" height="${size / 2}" rx="4" fill="${statusColor}" stroke="white" stroke-width="3"/>
      `;
      break;

    case 'OHT':
    case 'OHSR':
    case 'CMSR':
      // Triangle (elevated tank)
      svgPath = `
        <polygon points="${size / 2},${size / 5} ${size * 0.8},${size * 0.75} ${size * 0.2},${size * 0.75}" fill="${statusColor}" stroke="white" stroke-width="3"/>
      `;
      break;

    default:
      // Default circle
      svgPath = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${statusColor}" stroke="white" stroke-width="3"/>`;
  }

  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${device.surveyCode || Math.random()}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow-${device.surveyCode || Math.random()})">
        ${svgPath}
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svgContent,
    className: `custom-marker-icon neon-marker${isSelected ? ' selected' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};


// Map Refresher to fix rendering issues (grey/black map)
function MapRefresher() {
  const map = useMap();
  useEffect(() => {
    // Trigger invalidateSize to ensure map fills the container correctly
    // This fixes issues where the map renders in a small box or not at all
    const resizeMap = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    // Run immediately and after delays to catch animation frames
    resizeMap();
    const t1 = setTimeout(resizeMap, 100);
    const t2 = setTimeout(resizeMap, 500);

    // Also listen for window resize
    window.addEventListener('resize', resizeMap);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', resizeMap);
    };
  }, [map]);
  return null;
}

/**
 * Map controller to handle map instance and interactions
 */
function MapController({ selectedDevice }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDevice) {
      // Handle both lowercase (lat/long) and capitalized (Latitude/Longitude) column names
      const lat = selectedDevice.latitude || selectedDevice.lat;
      const lng = selectedDevice.longitude || selectedDevice.long;
      if (lat && lng) {
        map.flyTo([lat, lng], 18, {
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [selectedDevice, map]);

  return null;
}


/**
 * Main Map Component with Search, Filters, and Accessibility
 */
function MapComponent({ devices, selectedDevice, onMarkerClick }) {
  const center = useMemo(() => MAP_CONFIG.center, []);
  const zoom = useMemo(() => MAP_CONFIG.defaultZoom, []);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilters, setStatusFilters] = useState({
    'Working': true,
    'Not Work': true,
    'Failed': true
  });
  const [selectedDeviceType, setSelectedDeviceType] = useState('All'); // Dropdown for device type
  const [activeDevice, setActiveDevice] = useState(null); // For floating panel
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(-1);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const mapRef = useRef(null);

  // Helper function to detect device type from survey code or properties
  const getDeviceTypeFromCode = (device) => {
    // 1. Explicit Property Check (Prioritize backend fields)
    const rawType = device.device_type || device.deviceType || device.type;
    if (rawType) {
      const t = rawType.toUpperCase();
      if (t === 'BOREWELL' || t.includes('BORE')) return 'Borewell';
      if (t === 'SUMP' || t.includes('SUMP')) return 'Sump';
      if (t === 'OHSR' || t === 'OHT' || t.includes('OVERHEAD') || t.includes('TANK')) return 'OHSR';
    }

    // 2. Fallback to tableName if available
    if (device.tableName === 'borewells') return 'Borewell';
    if (device.tableName === 'sumps') return 'Sump';
    if (device.tableName === 'overhead_tanks') return 'OHSR';

    // 3. Fallback to Survey Code / Name Parsing
    const code = (device.surveyCode || device.originalName || '').toUpperCase();
    if (code.includes('BW') || code.includes('BORE')) return 'Borewell';
    if (code.includes('SM') || code.includes('SUMP')) return 'Sump';
    if (code.includes('OH') || code.includes('OHSR') || code.includes('OHT')) return 'OHSR';

    return 'Unknown';
  };

  // Filter devices based on search, status, and device type dropdown
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        const searchableText = [
          device.originalName,
          device.surveyCode,
          device.surveyCodeId,
          device.location,
          device.zone
        ].filter(Boolean).join(' ').toLowerCase();

        // Normalize Waddera/Waddera Colony search
        let effectiveQuery = query;
        if (query.includes('waddera')) {
          effectiveQuery = 'waddera';
        }

        if (!searchableText.includes(effectiveQuery)) return false;
      }

      // Status filter
      if (device.status && !statusFilters[device.status]) return false;

      // Device type dropdown filter
      if (selectedDeviceType !== 'All') {
        const deviceType = getDeviceTypeFromCode(device);
        if (selectedDeviceType !== deviceType) return false;
      }

      // Must have coordinates
      const lat = device.latitude || device.lat;
      const lng = device.longitude || device.long;
      return lat && lng;
    });
  }, [devices, searchQuery, statusFilters, selectedDeviceType]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedDeviceIndex(prev =>
          prev < filteredDevices.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedDeviceIndex(prev =>
          prev > 0 ? prev - 1 : filteredDevices.length - 1
        );
      } else if (e.key === 'Enter' && selectedDeviceIndex >= 0) {
        e.preventDefault();
        const device = filteredDevices[selectedDeviceIndex];
        if (device && onMarkerClick) {
          onMarkerClick(device);
        }
      } else if (e.key === 'Escape') {
        setSelectedDeviceIndex(-1);
        setShowFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredDevices, selectedDeviceIndex, onMarkerClick]);

  // Auto-refresh indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Export map as image
  const exportMapImage = async () => {
    const mapElement = document.querySelector('.leaflet-container');
    if (!mapElement) return;

    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `rudraram-map-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to export map:', error);
      alert('Failed to export map image');
    }
  };

  const toggleStatusFilter = (status) => {
    setStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const { BaseLayer } = LayersControl;

  return (
    <div className="map-wrapper" role="application" aria-label="Interactive Map of Water Infrastructure">
      {/* Search Overlay */}
      <div className="map-search-overlay">
        <div className="search-box-map">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search devices, locations, zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search devices on map"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="device-type-dropdown">
          <label htmlFor="deviceTypeSelect" style={{ marginRight: '8px', fontSize: '14px', fontWeight: '500' }}>
            Device Type:
          </label>
          <select
            id="deviceTypeSelect"
            value={selectedDeviceType}
            onChange={(e) => setSelectedDeviceType(e.target.value)}
            className="device-type-select"
          >
            <option value="All">All Devices</option>
            <option value="Borewell">Borewells</option>
            <option value="Sump">Sumps</option>
            <option value="OHSR">Overhead Tanks (OHSR)</option>
          </select>
        </div>

        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <Filter size={18} />
          Filters
        </button>

        <button
          className="export-map-btn"
          onClick={exportMapImage}
          aria-label="Export map as image"
          title="Export Map as Image"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="map-filters-panel" role="group" aria-label="Filters">
          <h4>Filter by Status</h4>
          {Object.keys(statusFilters).map(status => (
            <label key={status} className="filter-checkbox">
              <input
                type="checkbox"
                checked={statusFilters[status]}
                onChange={() => toggleStatusFilter(status)}
                aria-label={`Show ${status} devices`}
              />
              <span
                className="status-indicator"
                style={{ backgroundColor: STATUS_CONFIG[status]?.color }}
              />
              <span>{status}</span>
              <span className="device-count">
                ({devices.filter(d => d.status === status).length})
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Info Bar */}
      <div className="map-info-bar">
        <span className="device-count-badge">
          {filteredDevices.length} of {devices.length} devices
        </span>
        <span className="last-update-indicator">
          Updated: {lastUpdate.toLocaleTimeString()}
        </span>
        <span className="keyboard-hint" title="Use arrow keys to navigate">
          ⌨️ Navigation: ← → ↑ ↓
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-map-container"
        zoomControl={true}
        scrollWheelZoom={true}
        maxZoom={22}
        minZoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <MapRefresher />
        <MapController selectedDevice={selectedDevice} />
        <DrawingTools />
        <MeasurementTool />
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

        {/* Device Markers - Individual View Only */}
        {filteredDevices.map((device, idx) => {
          const lat = device.latitude || device.lat;
          const lng = device.longitude || device.long;
          if (!lat || !lng) return null;

          // Use helper function to detect device type
          const deviceType = getDeviceTypeFromCode(device);
          const deviceName = device.originalName || device.surveyCode || device.surveyCodeId || 'Unknown Device';

          return (
            <Marker
              key={`${device.surveyCode}-${idx}`}
              position={[lat, lng]}
              icon={getDeviceIcon(deviceType, device.status)}
              opacity={selectedDeviceIndex === idx ? 1 : 0.9}
              zIndexOffset={selectedDeviceIndex === idx ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  setSelectedDeviceIndex(idx);
                  setActiveDevice(device);
                  if (onMarkerClick) onMarkerClick(device);
                }
              }}
            />
          );
        })}

        {/* Device Sidebar */}
        {activeDevice && (
          <DeviceSidebar
            device={activeDevice}
            onClose={() => {
              setActiveDevice(null);
              setSelectedDeviceIndex(-1);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapComponent;

