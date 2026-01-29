import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './FilterPanel.css';

const FilterPanel = () => {
    const { filters, setFilters, resetFilters, zones, stats } = useApp() as any;
    const [isOpen, setIsOpen] = useState(false);

    const deviceTypes = ['Borewell', 'Sump', 'OHSR'];
    const statuses = ['Working', 'Not Working', 'Unknown'];

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ [key]: value });
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div className={`filter-panel-wrapper ${isOpen ? 'open' : ''}`}>
            <button
                className="filter-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Filter Devices"
            >
                <Filter size={20} />
                {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                <span className="toggle-text">{isOpen ? 'Close Filters' : 'Filter View'}</span>
            </button>

            {isOpen && (
                <div className="filter-content glass-effect">
                    <div className="filter-header">
                        <h4>🔍 Advanced Filters</h4>
                        <button className="reset-link" onClick={resetFilters}>Reset All</button>
                    </div>

                    <div className="filter-groups">
                        {/* Zone Filter */}
                        <div className="filter-group">
                            <label>📍 Zone</label>
                            <select
                                value={filters.zone}
                                onChange={(e) => handleFilterChange('zone', e.target.value)}
                            >
                                <option value="">All Zones</option>
                                {zones.map((z: any) => (
                                    <option key={z.name} value={z.name}>{z.name} ({z.deviceCount})</option>
                                ))}
                            </select>
                        </div>

                        {/* Device Type Filter */}
                        <div className="filter-group">
                            <label>🏗️ Device Type</label>
                            <div className="filter-chips">
                                <button
                                    className={`chip ${filters.deviceType === '' ? 'active' : ''}`}
                                    onClick={() => handleFilterChange('deviceType', '')}
                                >
                                    All
                                </button>
                                {deviceTypes.map(type => (
                                    <button
                                        key={type}
                                        className={`chip ${filters.deviceType === type ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('deviceType', type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="filter-group">
                            <label>🚦 Status</label>
                            <div className="filter-chips">
                                <button
                                    className={`chip ${filters.status === '' ? 'active' : ''}`}
                                    onClick={() => handleFilterChange('status', '')}
                                >
                                    All
                                </button>
                                {statuses.map(status => (
                                    <button
                                        key={status}
                                        className={`chip ${filters.status === status ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('status', status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
