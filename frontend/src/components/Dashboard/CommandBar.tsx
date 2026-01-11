/**
 * Command Bar Component
 * 
 * Professional header with search, filters, and actions
 * Matches industrial dashboard design
 */

import React from 'react';
import { Search, MapPin, Layers, Activity, Download, Bell, X } from 'lucide-react';
import type { Filters, FilterCount, DeviceType, DeviceStatus } from '../../types/device';
import './CommandBar.css';

interface CommandBarProps {
    filters: Filters;
    onFilterChange: (updates: Partial<Filters>) => void;
    onResetFilters: () => void;
    filterCount: FilterCount;
    zones: string[];
    deviceTypes: DeviceType[];
    statuses: DeviceStatus[];
    onExport: () => void;
    hasActiveFilters: boolean;
}

export function CommandBar({
    filters,
    onFilterChange,
    onResetFilters,
    filterCount,
    zones,
    deviceTypes,
    statuses,
    onExport,
    hasActiveFilters
}: CommandBarProps) {
    return (
        <header className="command-bar">


            <div className="command-bar-filters">
                {/* Search Input */}
                <div className="filter-control search-control">
                    <Search size={18} className="filter-icon" />
                    <input
                        type="text"
                        placeholder="Search devices or landmarks..."
                        value={filters.searchText}
                        onChange={(e) => onFilterChange({ searchText: e.target.value })}
                        className="search-input"
                    />
                    {filters.searchText && (
                        <button
                            onClick={() => onFilterChange({ searchText: '' })}
                            className="clear-search"
                            aria-label="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Zone Filter */}
                <div className="filter-control">
                    <MapPin size={18} className="filter-icon" />
                    <select
                        value={filters.zone || ''}
                        onChange={(e) => onFilterChange({ zone: e.target.value || null })}
                        className="filter-select"
                    >
                        <option value="">All Zones</option>
                        {zones.map(zone => (
                            <option key={zone} value={zone}>{zone}</option>
                        ))}
                    </select>
                </div>

                {/* Device Type Filter */}
                <div className="filter-control">
                    <Layers size={18} className="filter-icon" />
                    <select
                        value={filters.deviceType || ''}
                        onChange={(e) => onFilterChange({ deviceType: (e.target.value || null) as DeviceType | null })}
                        className="filter-select"
                    >
                        <option value="">All Devices</option>
                        {deviceTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="filter-control">
                    <Activity size={18} className="filter-icon" />
                    <select
                        value={filters.status || ''}
                        onChange={(e) => onFilterChange({ status: (e.target.value || null) as DeviceStatus | null })}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                    <button onClick={onResetFilters} className="reset-filters-btn" title="Reset all filters">
                        <X size={16} />
                        Reset
                    </button>
                )}
            </div>

            <div className="command-bar-actions">
                <button onClick={onExport} className="export-btn" title="Export filtered data">
                    <Download size={18} />
                    <span>Export</span>
                </button>

                <div className="device-count">
                    <span className="count-value">{filterCount.filtered}</span>
                    <span className="count-separator">/</span>
                    <span className="count-total">{filterCount.total}</span>
                </div>

                <button className="notifications-btn" title="Notifications">
                    <Bell size={18} />
                </button>
            </div>
        </header>
    );
}

export default CommandBar;
