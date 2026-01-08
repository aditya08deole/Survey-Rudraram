/**
 * Table View Page
 * 
 * Displays all devices in a searchable, filterable table with export functionality.
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronUp, 
  ChevronDown,
  Eye,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  ZONE_NAMES, 
  DEVICE_TYPES, 
  STATUS_LIST, 
  getZoneColor,
  getStatusBadgeClass
} from '../utils/constants';
import { 
  exportToExcel, 
  exportToCSV, 
  prepareDevicesForExport,
  hasValidCoordinates 
} from '../utils/helpers';
import DevicePanel from '../components/DevicePanel/DevicePanel';
import './TableView.css';

function TableView() {
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
    hasData,
    devices
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);

  // Dynamically get all column keys from actual data
  const allColumns = useMemo(() => {
    if (!devices || devices.length === 0) return [];
    
    // Get all unique keys from all devices
    const columnSet = new Set();
    devices.forEach(device => {
      Object.keys(device).forEach(key => columnSet.add(key));
    });
    
    return Array.from(columnSet);
  }, [devices]);

  // Format column header (camelCase to Title Case)
  const formatColumnHeader = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Get filtered devices
  const filteredDevices = useMemo(() => {
    let result = getFilteredDevices();

    // Apply local search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        Object.values(d).some(val => 
          val && val.toString().toLowerCase().includes(query)
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [getFilteredDevices, searchQuery, sortConfig]);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters({ [name]: value });
  };

  // Handle export
  const handleExport = (format) => {
    const data = prepareDevicesForExport(filteredDevices);
    if (format === 'excel') {
      exportToExcel(data, 'rudraram_devices');
    } else {
      exportToCSV(data, 'rudraram_devices');
    }
  };

  // Handle view device
  const handleViewDevice = (device) => {
    setSelectedDevice(device);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} /> : 
      <ChevronDown size={14} />;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Working':
        return <CheckCircle size={14} className="status-icon-success" />;
      case 'Not Work':
        return <AlertTriangle size={14} className="status-icon-warning" />;
      case 'Failed':
        return <XCircle size={14} className="status-icon-danger" />;
      default:
        return null;
    }
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v).length;

  if (isLoading) {
    return (
      <div className="table-view-loading">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="table-view-empty">
        <FileSpreadsheet size={64} className="text-gray-400" />
        <h2>No Data Available</h2>
        <p>Upload an Excel file to view device data.</p>
      </div>
    );
  }

  return (
    <div className="table-view">
      {/* Header */}
      <div className="table-header">
        <div className="table-title">
          <h1>Device Table View</h1>
          <span className="device-count">{filteredDevices.length} devices</span>
        </div>

        <div className="table-actions">
          <button 
            className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>

          <div className="export-dropdown">
            <button className="btn btn-secondary">
              <Download size={16} />
              Export
            </button>
            <div className="dropdown-menu">
              <button onClick={() => handleExport('excel')}>
                <FileSpreadsheet size={16} />
                Export to Excel
              </button>
              <button onClick={() => handleExport('csv')}>
                <Download size={16} />
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Survey Code or Landmark..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {showFilters && (
          <div className="filter-bar">
            <select
              value={filters.zone || ''}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
            >
              <option value="">All Zones</option>
              {ZONE_NAMES.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>

            <select
              value={filters.deviceType || ''}
              onChange={(e) => handleFilterChange('deviceType', e.target.value)}
            >
              <option value="">All Device Types</option>
              {DEVICE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {STATUS_LIST.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button className="clear-filters" onClick={resetFilters}>
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {allColumns.map(col => (
                <th 
                  key={col}
                  onClick={() => handleSort(col)} 
                  className="sortable"
                >
                  {formatColumnHeader(col)} {getSortIcon(col)}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length + 1} className="empty-row">
                  <p>No devices match your search criteria</p>
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, idx) => (
                <tr 
                  key={device.surveyCode || idx}
                  className={selectedDevice?.surveyCode === device.surveyCode ? 'selected' : ''}
                >
                  {allColumns.map(col => (
                    <td key={col} className="cell-text">
                      {device[col] !== null && device[col] !== undefined ? device[col].toString() : '-'}
                    </td>
                  ))}
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => handleViewDevice(device)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="table-footer">
        <div className="summary-stats">
          <span>
            <strong>{filteredDevices.length}</strong> Total Records
          </span>
          {filteredDevices.some(d => d.status) && (
            <>
              <span>
                <strong>{filteredDevices.filter(d => d.status === 'Working').length}</strong> Working
              </span>
              <span>
                <strong>{filteredDevices.filter(d => d.status === 'Not Work').length}</strong> Not Working
              </span>
              <span>
                <strong>{filteredDevices.filter(d => d.status === 'Failed').length}</strong> Failed
              </span>
            </>
          )}
          {filteredDevices.some(d => hasValidCoordinates(d)) && (
            <span>
              <strong>{filteredDevices.filter(d => hasValidCoordinates(d)).length}</strong> Mapped
            </span>
          )}
        </div>
      </div>

      {/* Device Panel */}
      {showDevicePanel && selectedDevice && (
        <div className="table-device-panel">
          <DevicePanel
            device={selectedDevice}
            onClose={hideDevicePanel}
          />
        </div>
      )}
    </div>
  );
}

export default TableView;
