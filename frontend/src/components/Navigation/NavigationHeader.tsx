/**
 * Navigation Header Component
 * 
 * Professional navigation bar for enterprise dashboard
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, LayoutDashboard, Table, BarChart3, MapPin, Layers, FileSpreadsheet } from 'lucide-react';
import './NavigationHeader.css';

export function NavigationHeader() {
    return (
        <nav className="navigation-header">
            <div className="nav-brand">
                <div className="brand-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M16 4C16 4 8 8 8 16C8 24 16 28 16 28C16 28 24 24 24 16C24 8 16 4 16 4Z"
                            fill="currentColor" opacity="0.2" />
                        <path d="M16 4V28M8 16C8 8 16 4 16 4C16 4 24 8 24 16C24 24 16 28 16 28C16 28 8 24 8 16Z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="brand-text">
                    <h1>Rudraram Survey</h1>
                    <p>Water Infrastructure Dashboard</p>
                </div>
            </div>

            <div className="nav-links">
                <NavLink to="/map" className="nav-link">
                    <Map size={18} />
                    <span>Map View</span>
                </NavLink>

                <NavLink to="/dashboard" className="nav-link">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/table" className="nav-link">
                    <Table size={18} />
                    <span>Table View</span>
                </NavLink>

                <NavLink to="/analytics" className="nav-link">
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                </NavLink>

                <NavLink to="/zones" className="nav-link">
                    <MapPin size={18} />
                    <span>Zones</span>
                </NavLink>

                <NavLink to="/types" className="nav-link">
                    <Layers size={18} />
                    <span>Device Types</span>
                </NavLink>

                <NavLink to="/export" className="nav-link">
                    <FileSpreadsheet size={18} />
                    <span>Export</span>
                </NavLink>
            </div>
        </nav>
    );
}

export default NavigationHeader;
