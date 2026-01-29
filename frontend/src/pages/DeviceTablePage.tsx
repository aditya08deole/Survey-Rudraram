import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { fetchSurveyData } from '../services/apiService';
import { useDeviceFilters } from '../hooks/useDeviceFilters';
import {
    Search, Filter, Download, MapPin, CheckCircle,
    XCircle, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import type { Device, ApiResponse } from '../types/device';
import LoadingAnimation from '../components/LoadingAnimation';
import './DeviceTablePage.css';

type SortField = 'survey_id' | 'zone' | 'device_type' | 'status' | 'houses';
type SortDirection = 'asc' | 'desc';

// Row Component Props for this specific react-window version
interface DeviceRowProps {
    index: number;
    style: React.CSSProperties;
}

export function DeviceTablePage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('survey_id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const containerRef = useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = useState(1200);
    const navigate = useNavigate();

    const {
        filters,
        updateFilter,
        resetFilters,
        hasActiveFilters,
        filteredDevices,
        filterCount
    } = useDeviceFilters(allDevices);

    useEffect(() => {
        loadData();

        // Handle responsive width for virtualization
        const updateWidth = () => {
            if (containerRef.current) {
                setTableWidth(containerRef.current.offsetWidth);
            }
        };

        window.addEventListener('resize', updateWidth);
        updateWidth();
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const loadData = async () => {
        const response = await fetchSurveyData('All', 'excel') as unknown as ApiResponse;
        if (response.success) setAllDevices(response.devices);
        setLoading(false);
    };

    // Sorted devices
    const sortedDevices = useMemo(() => {
        const sorted = [...filteredDevices];
        sorted.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredDevices, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleViewOnMap = (device: Device) => {
        navigate(`/map?survey_id=${device.survey_id}`);
    };

    const getStatusIcon = (status: string | null) => {
        if (status === 'Working') return <CheckCircle size={16} className="status-icon success" />;
        if (status === 'Not Working') return <AlertTriangle size={16} className="status-icon warning" />;
        if (status === 'Failed') return <XCircle size={16} className="status-icon danger" />;
        return <span className="status-icon neutral">—</span>;
    };

    // Virtualized Row Component
    const DeviceRow = ({ index, style, ...rest }: any) => {
        const device = sortedDevices[index];
        if (!device) return null;
        return (
            <div className="virtual-row" style={style} {...rest}>
                <div className="virtual-cell survey-code">{device.survey_id || '—'}</div>
                <div className="virtual-cell">{device.zone || '—'}</div>
                <div className="virtual-cell">{device.street || '—'}</div>
                <div className="virtual-cell">
                    <span className={`type-badge type-${device.device_type?.toLowerCase()}`}>
                        {device.device_type || 'Unknown'}
                    </span>
                </div>
                <div className="virtual-cell">
                    <div className="status-cell">
                        {getStatusIcon(device.status)}
                        <span>{device.status || 'Unknown'}</span>
                    </div>
                </div>
                <div className="virtual-cell numeric">{device.houses || 0}</div>
                <div className="virtual-cell numeric">{device.usage_hours || '—'}</div>
                <div className="virtual-cell numeric">{device.motor_hp || '—'}</div>
                <div className="virtual-cell">
                    {device.lat && device.lng ? (
                        <span className="gps-badge success">✓ Mapped</span>
                    ) : (
                        <span className="gps-badge warning">✗ No GPS</span>
                    )}
                </div>
                <div className="virtual-cell">
                    <button
                        onClick={() => handleViewOnMap(device)}
                        className="btn-view-map"
                        disabled={!device.lat || !device.lng}
                    >
                        <MapPin size={14} />
                        View
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading device table..." />;
    }

    return (
        <div className="device-table-page" ref={containerRef}>
            {/* Header */}
            <div className="table-header">
                <div className="table-title">
                    <h1>Device Operations Table</h1>
                    <p>Complete device registry with {filterCount.total} devices</p>
                </div>

                <div className="table-actions">
                    <div className="search-box-table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={filters.searchText}
                            onChange={(e) => updateFilter('searchText', e.target.value)}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="btn-reset">
                            <Filter size={18} />
                            Reset Filters
                        </button>
                    )}

                    <button onClick={() => navigate('/export')} className="btn-export">
                        <Download size={18} />
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Filter Summary */}
            <div className="filter-summary">
                <span className="result-count">
                    Showing <strong>{filterCount.filtered}</strong> of <strong>{filterCount.total}</strong> devices
                </span>
                <span className="perf-badge">🚀 Virtualized</span>
            </div>

            {/* Virtualized Table */}
            <div className="table-container virtualized">
                <div className="table-sticky-header">
                    <div className="header-cell sortable" onClick={() => handleSort('survey_id')}>Survey Code <ArrowUpDown size={12} /></div>
                    <div className="header-cell sortable" onClick={() => handleSort('zone')}>Zone <ArrowUpDown size={12} /></div>
                    <div className="header-cell">Street</div>
                    <div className="header-cell sortable" onClick={() => handleSort('device_type')}>Type <ArrowUpDown size={12} /></div>
                    <div className="header-cell sortable" onClick={() => handleSort('status')}>Status <ArrowUpDown size={12} /></div>
                    <div className="header-cell sortable" onClick={() => handleSort('houses')}>Houses <ArrowUpDown size={12} /></div>
                    <div className="header-cell">Usage</div>
                    <div className="header-cell">HP</div>
                    <div className="header-cell">GPS</div>
                    <div className="header-cell">Actions</div>
                </div>

                {sortedDevices.length === 0 ? (
                    <div className="no-results-view">
                        <AlertTriangle size={32} />
                        <p>No devices found matching your filters</p>
                    </div>
                ) : (
                    <List
                        rowCount={sortedDevices.length}
                        rowHeight={60}
                        style={{ height: 600, width: tableWidth }}
                        className="virtual-list"
                        rowComponent={DeviceRow}
                        rowProps={{}}
                    />
                )}
            </div>
        </div>
    );
}

export default DeviceTablePage;
