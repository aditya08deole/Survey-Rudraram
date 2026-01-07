/**
 * Map View Page
 * 
 * Full-screen interactive map with filtering and device details.
 */

import React, { useState, useCallback } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MapComponent from '../components/Map/MapComponent';
import DevicePanel from '../components/DevicePanel/DevicePanel';
import { ZONE_NAMES, DEVICE_TYPES, STATUS_LIST } from '../utils/constants';
import './MapView.css';

function MapView() {
  const { 
    getFilteredDevices,
    filters,
    setFilters,
    resetFilters,
    selectedDevice,
    setSelectedDevice,
    showDevicePanel,
    hideDevicePanel,
    isLoading,
    hasData
  } = useApp();

  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Get filtered and mapped devices
  const filteredDevices = getFilteredDevices();
  const mappedDevices = filteredDevices.filter(d => 
    d.lat && d.long && !isNaN(d.lat) && !isNaN(d.long)
  );

  // Handle marker click
  const handleMarkerClick = useCallback((device) => {
    setSelectedDevice(device);
  }, [setSelectedDevice]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setFilters({ search: value });
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters({ [filterName]: value });
  };

  // Clear all filters
  const handleClearFilters = () => {
    resetFilters();
    setSearchQuery('');
  };

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(v => v).length;

  if (isLoading) {
    return (
      <div className="map-view-loading">
        <div className="spinner"></div>
        <p>Loading map data...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="map-view-empty">
        <p>No data available. Please upload an Excel file first.</p>
      </div>
    );
  }

  return (
    <div className="map-view">
      {/* Filter Panel */}
      <aside className={`filter-sidebar ${showFilterPanel ? 'open' : 'closed'}`}>
        <div className="filter-header">
          <h3>
            <Filter size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </h3>
          <button 
            className="filter-close-btn"
            onClick={() => setShowFilterPanel(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="filter-content">
          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Survey Code or Landmark..."
                value={searchQuery}
                onChange={handleSearch}
                className="form-input search-input"
              />
            </div>
          </div>

          {/* Zone Filter */}
          <div className="filter-group">
            <label>Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
              className="form-select"
            >
              <option value="">All Zones</option>
              {ZONE_NAMES.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Device Type Filter */}
          <div className="filter-group">
            <label>Device Type</label>
            <select
              value={filters.deviceType}
              onChange={(e) => handleFilterChange('deviceType', e.target.value)}
              className="form-select"
            >
              <option value="">All Types</option>
              {DEVICE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-select"
            >
              <option value="">All Status</option>
              {STATUS_LIST.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button 
              className="btn btn-secondary btn-sm clear-filters-btn"
              onClick={handleClearFilters}
            >
              <RotateCcw size={14} />
              Clear All Filters
            </button>
          )}
        </div>

        {/* Device Count */}
        <div className="filter-footer">
          <div className="device-count-info">
            <span className="count-value">{mappedDevices.length}</span>
            <span className="count-label">devices on map</span>
          </div>
          <div className="device-count-info">
            <span className="count-value">{filteredDevices.length - mappedDevices.length}</span>
            <span className="count-label">unmapped</span>
          </div>
        </div>
      </aside>

      {/* Filter Toggle Button (when panel is closed) */}
      {!showFilterPanel && (
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilterPanel(true)}
        >
          <Filter size={20} />
          {activeFilterCount > 0 && (
            <span className="filter-badge-floating">{activeFilterCount}</span>
          )}
        </button>
      )}

      {/* Map Container */}
      <div className="map-container">
        <MapComponent
          devices={mappedDevices}
          selectedDevice={selectedDevice}
          onMarkerClick={handleMarkerClick}
        />

        {/* Map Legend */}
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-section">
            <span className="legend-title">Device Types</span>
            <div className="legend-item">
              <span className="legend-marker marker-circle"></span>
              Borewell
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-square"></span>
              Sump
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-triangle"></span>
              OHT
            </div>
          </div>
          <div className="legend-section">
            <span className="legend-title">Status</span>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#22C55E' }}></span>
              Working
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#F97316' }}></span>
              Not Working
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#EF4444' }}></span>
              Failed
            </div>
          </div>
        </div>
      </div>

      {/* Device Detail Panel */}
      {showDevicePanel && selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          onClose={hideDevicePanel}
        />
      )}
    </div>
  );
}

export default MapView;
