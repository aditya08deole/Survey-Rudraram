/**
 * Filter Sidebar Component
 * 
 * Left sidebar with collapsible filters matching reference design
 */

import React, { useState } from 'react';
import { Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Filters, FilterCount, DeviceType, DeviceStatus } from '../../types/device';
import './FilterSidebar.css';

interface FilterSidebarProps {
    filters: Filters;
    onFilterChange: (updates: Partial<Filters>) => void;
    zones: string[];
    deviceTypes: DeviceType[];
    statuses: DeviceStatus[];
    filterCount: FilterCount;
}

export function FilterSidebar({
    filters,
    onFilterChange,
    zones,
    deviceTypes,
    statuses,
    filterCount
}: FilterSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`filter-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-title">
                    <Filter size={18} />
                    <span>Filters</span>
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="collapse-btn"
                    aria-label={isCollapsed ? "Expand filters" : "Collapse filters"}
                >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="sidebar-content">
                    {/* Search Section */}
                    <div className="filter-section">
                        <label className="filter-label">SEARCH</label>
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search done or landmarks..."
                                value={filters.searchText}
                                onChange={(e) => onFilterChange({ searchText: e.target.value })}
                                className="search-input-sidebar"
                            />
                        </div>
                    </div>

                    {/* Zone Filter */}
                    <div className="filter-section">
                        <label className="filter-label">ZONE</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="zone"
                                    checked={filters.zone === null}
                                    onChange={() => onFilterChange({ zone: null })}
                                />
                                <span className="radio-label">
                                    <span className="indicator all-indicator" />
                                    All Zones
                                </span>
                            </label>
                            {zones.map(zone => (
                                <label key={zone} className="radio-option">
                                    <input
                                        type="radio"
                                        name="zone"
                                        checked={filters.zone === zone}
                                        onChange={() => onFilterChange({ zone })}
                                    />
                                    <span className="radio-label">
                                        <span className="indicator zone-indicator" />
                                        {zone}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Device Type Filter */}
                    <div className="filter-section">
                        <label className="filter-label">DEVICE TYPE</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="deviceType"
                                    checked={filters.deviceType === null}
                                    onChange={() => onFilterChange({ deviceType: null })}
                                />
                                <span className="radio-label">
                                    <span className="indicator all-indicator" />
                                    All Types
                                </span>
                            </label>
                            {deviceTypes.map(type => (
                                <label key={type} className="radio-option">
                                    <input
                                        type="radio"
                                        name="deviceType"
                                        checked={filters.deviceType === type}
                                        onChange={() => onFilterChange({ deviceType: type as DeviceType })}
                                    />
                                    <span className="radio-label">
                                        <span className={`indicator type-indicator type-${type.toLowerCase()}`} />
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="filter-section">
                        <label className="filter-label">STATUS</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={filters.status === null}
                                    onChange={() => onFilterChange({ status: null })}
                                />
                                <span className="radio-label">
                                    <span className="indicator all-indicator" />
                                    All Status
                                </span>
                            </label>
                            {statuses.map(status => (
                                <label key={status} className="radio-option">
                                    <input
                                        type="radio"
                                        name="status"
                                        checked={filters.status === status}
                                        onChange={() => onFilterChange({ status: status as DeviceStatus })}
                                    />
                                    <span className="radio-label">
                                        <span className={`indicator status-indicator status-${status.toLowerCase().replace(' ', '-')}`} />
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Device Count */}
                    <div className="device-count-box">
                        <div className="count-display">
                            <span className="count-number">{filterCount.filtered}</span>
                            <span className="count-text">of {filterCount.total} devices</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default FilterSidebar;
