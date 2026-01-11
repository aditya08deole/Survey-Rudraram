/**
 * Navigation Header Component
 * 
 * Professional navigation bar for enterprise dashboard
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Map, LayoutDashboard, Table, BarChart3, MapPin, Layers, FileSpreadsheet, Menu, X } from 'lucide-react';
import './NavigationHeader.css';

export function NavigationHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

                            <NavLink to="/export" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                <FileSpreadsheet size={16} />
                                <span>Export</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavigationHeader;
