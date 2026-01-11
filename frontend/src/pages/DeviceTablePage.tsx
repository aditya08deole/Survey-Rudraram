/**
 * Enhanced Device Table Page
 * 
 * Professional data grid with virtualization and map sync
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function DeviceTablePage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('survey_id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading device table..." />;
    }

    return (
        <div className="device-table-page">
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
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="device-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('survey_id')} className="sortable">
                                Survey Code
                                <ArrowUpDown size={14} />
                            </th>
                            <th onClick={() => handleSort('zone')} className="sortable">
                                Zone
                                <ArrowUpDown size={14} />
                            </th>
                            <th>Street</th>
                            <th onClick={() => handleSort('device_type')} className="sortable">
                                Type
                                <ArrowUpDown size={14} />
                            </th>
                            <th onClick={() => handleSort('status')} className="sortable">
                                Status
                                <ArrowUpDown size={14} />
                            </th>
                            <th onClick={() => handleSort('houses')} className="sortable">
                                Houses
                                <ArrowUpDown size={14} />
                            </th>
                            <th>Usage (hrs)</th>
                            <th>Motor HP</th>
                            <th>GPS</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDevices.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="no-results">
                                    <AlertTriangle size={24} />
                                    <p>No devices found matching your filters</p>
                                </td>
                            </tr>
                        ) : (
                            sortedDevices.map((device, idx) => (
                                <tr key={device.survey_id || idx} className="device-row">
                                    <td className="survey-code">{device.survey_id || '—'}</td>
                                    <td>{device.zone || '—'}</td>
                                    <td>{device.street || '—'}</td>
                                    <td>
                                        <span className={`type-badge type-${device.device_type?.toLowerCase()}`}>
                                            {device.device_type || 'Unknown'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="status-cell">
                                            {getStatusIcon(device.status)}
                                            <span>{device.status || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="numeric">{device.houses || 0}</td>
                                    <td className="numeric">{device.usage_hours || '—'}</td>
                                    <td className="numeric">{device.motor_hp || '—'}</td>
                                    <td>
                                        {device.lat && device.lng ? (
                                            <span className="gps-badge success">✓ Mapped</span>
                                        ) : (
                                            <span className="gps-badge warning">✗ No GPS</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleViewOnMap(device)}
                                            className="btn-view-map"
                                            disabled={!device.lat || !device.lng}
                                        >
                                            <MapPin size={14} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DeviceTablePage;
