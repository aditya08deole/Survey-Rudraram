/**
 * Filter Panel Component (Reusable)
 */

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { ZONE_NAMES, DEVICE_TYPES, STATUS_LIST } from '../../utils/constants';
import './FilterPanel.css';

function FilterPanel({ 
  filters, 
  onFilterChange, 
  onReset,
  showSearch = true 
}) {
  const handleChange = (name, value) => {
    onFilterChange({ [name]: value });
  };

  const activeCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="filter-panel-component">
      {showSearch && (
        <div className="filter-field">
          <label>Search</label>
          <div className="search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Survey Code or Landmark..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="filter-field">
        <label>Zone</label>
        <select
          value={filters.zone || ''}
          onChange={(e) => handleChange('zone', e.target.value)}
        >
          <option value="">All Zones</option>
          {ZONE_NAMES.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label>Device Type</label>
        <select
          value={filters.deviceType || ''}
          onChange={(e) => handleChange('deviceType', e.target.value)}
        >
          <option value="">All Types</option>
          {DEVICE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label>Status</label>
        <select
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS_LIST.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {activeCount > 0 && (
        <button className="reset-btn" onClick={onReset}>
          <RotateCcw size={14} />
          Clear Filters ({activeCount})
        </button>
      )}
    </div>
  );
}

export default FilterPanel;
