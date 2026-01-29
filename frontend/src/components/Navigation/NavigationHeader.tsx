/**
 * Navigation Header Component
 * 
 * Unified Header: Brand + Filters + Navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Map as MapIcon, LayoutDashboard, Table, BarChart3, MapPin, Layers,
    FileSpreadsheet, Menu, X, Search, Filter, Bell, Download, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { syncExcelData } from '../../services/apiService';
import './NavigationHeader.css';

export function NavigationHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const handleSync = async () => {
        if (!window.confirm("This will overwrite database records with data from the Master Excel file. Continue?")) return;

        setIsSyncing(true);
        try {
            await syncExcelData();
            alert("Sync started! Updates will appear shortly.");
            // Optionally reload page or re-fetch data after a delay
        } catch (error) {
            alert("Sync failed. Check console for details.");
        } finally {
            setIsSyncing(false);
        }
    };

    // Context State
    // @ts-ignore
    const {
        filters,
        setFilters,
        zones,
        stats,
        getFilteredDevices,
        devices
    } = useApp() as any;

    const actions = { setFilters };

    const isMapPage = location.pathname === '/map';
    // Defensive checks
    const safeGetFilteredDevices = typeof getFilteredDevices === 'function' ? getFilteredDevices : () => [];
    const filteredCount = isMapPage ? safeGetFilteredDevices().length : 0;
    const totalCount = isMapPage && devices ? devices.length : 0;

    // Derived lists (fallback to defaults if stats not loaded)
    const deviceTypes = stats?.deviceTypes?.map((t: any) => t.type) || ['Borewell', 'Sump', 'OHSR'];
    const statusList = ['Working', 'Not Working', 'Repair', 'Unknown'];
    const zoneList = Array.isArray(zones) ? zones.map((z: any) => z.name) : [];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleFilterChange = (key: string, value: any) => {
        actions.setFilters({ ...filters, [key]: value });
    };

    return (
        <nav className="navigation-header">
            {/* 1. Brand Section */}
            <div className="nav-brand">
                <div className="brand-icon">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <path d="M16 4C16 4 8 8 8 16C8 24 16 28 16 28C16 28 24 24 24 16C24 8 16 4 16 4Z"
                            fill="currentColor" opacity="0.2" />
                        <path d="M16 4V28M8 16C8 8 16 4 16 4C16 4 24 8 24 16C24 24 16 28 16 28C16 28 8 24 8 16Z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="brand-text">
                    <h1>Rudraram Survey</h1>
                    {/* Hide subtitle on small screens or when filters active */}
                    <p className={isMapPage ? 'hidden-when-tight' : ''}>Water Infrastructure Dashboard</p>
                </div>
            </div>

            {/* 2. Unified Controls (Only on Map Page) */}
            {isMapPage && (
                <div className="unified-controls">
                    {/* Search */}
                    <div className="header-input-group">
                        <Search size={14} className="header-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="header-input"
                        />
                    </div>

                    {/* Zone Select */}
                    <div className="header-input-group">
                        <MapPin size={14} className="header-icon" />
                        <select
                            value={filters.zone || ''}
                            onChange={(e) => handleFilterChange('zone', e.target.value || null)}
                            className="header-select"
                        >
                            <option value="">All Zones</option>
                            {zoneList.map((z: string) => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    {/* Type Select */}
                    <div className="header-input-group">
                        <Layers size={14} className="header-icon" />
                        <select
                            value={filters.deviceType || ''}
                            onChange={(e) => handleFilterChange('deviceType', e.target.value || null)}
                            className="header-select"
                        >
                            <option value="">All Types</option>
                            {deviceTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Status Select */}
                    <div className="header-input-group">
                        <Filter size={14} className="header-icon" />
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value || null)}
                            className="header-select"
                        >
                            <option value="">All Status</option>
                            {statusList.map((s: string) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* 3. Actions & Navigation */}
            <div className="nav-right-section">

                {/* Stats & Export (Map Only) */}
                {isMapPage && (
                    <div className="header-actions">
                        <button
                            className={`header-action-btn sync-btn ${isSyncing ? 'spinning' : ''}`}
                            title="Sync from Excel"
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                        </button>
                        <button className="header-action-btn export-btn" title="Export">
                            <Download size={14} />
                            <span>Export</span>
                        </button>
                        <div className="header-stat-pill">
                            <span className="current">{filteredCount}</span>
                            <span className="sep">/</span>
                            <span className="total">{totalCount}</span>
                        </div>
                        <button className="header-icon-btn">
                            <Bell size={16} />
                        </button>
                    </div>
                )}

                <div className="nav-divider"></div>

                {/* Navigation Links */}
                <div className="nav-links">
                    <NavLink to="/map" className="nav-link">
                        <MapIcon size={18} />
                        <span>Map</span>
                    </NavLink>

                    <NavLink to="/dashboard" className="nav-link">
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </NavLink>

                    <div className="nav-dropdown" ref={dropdownRef}>
                        <button
                            className={`nav-link menu-btn ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                            <span>More</span>
                        </button>

                        {isMenuOpen && (
                            <div className="dropdown-menu">
                                <NavLink to="/table" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                    <Table size={16} />
                                    <span>Table View</span>
                                </NavLink>

                                <NavLink to="/analytics" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                    <BarChart3 size={16} />
                                    <span>Analytics</span>
                                </NavLink>

                                <NavLink to="/zones" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                    <MapPin size={16} />
                                    <span>Zones</span>
                                </NavLink>

                                <NavLink to="/types" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                    <Layers size={16} />
                                    <span>Device Types</span>
                                </NavLink>

                                {/* Export is available in main bar for Map, but keep here for others */}
                                {!isMapPage && (
                                    <NavLink to="/export" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                        <FileSpreadsheet size={16} />
                                        <span>Export</span>
                                    </NavLink>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default NavigationHeader;
