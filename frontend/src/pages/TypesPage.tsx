/**
 * Device Types Page - Asset Composition
 * 
 * Device type analysis with clickable type cards
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurveyData } from '../services/apiService';
import { computeTypeMetrics } from '../types/metrics';
import { Layers, Circle, Square, Triangle } from 'lucide-react';
import type { Device, ApiResponse } from '../types/device';
import LoadingAnimation from '../components/LoadingAnimation';
import './TypesPage.css';

export function TypesPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const typeMetrics = useMemo(() => computeTypeMetrics(allDevices), [allDevices]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const response = await fetchSurveyData() as unknown as ApiResponse;
        if (response.success) setAllDevices(response.devices);
        setLoading(false);
    };

    const handleTypeClick = (type: string) => {
        navigate(`/map?deviceType=${type}`);
    };

    const getTypeIcon = (type: string) => {
        if (type === 'Borewell') return <Circle size={32} />;
        if (type === 'Sump') return <Square size={32} />;
        if (type === 'OHSR' || type === 'OHT') return <Triangle size={32} />;
        return <Layers size={32} />;
    };

    const getTypeColor = (type: string) => {
        if (type === 'Borewell') return '#22C55E';
        if (type === 'Sump') return '#3B82F6';
        if (type === 'OHSR' || type === 'OHT') return '#F97316';
        return '#6b7280';
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading device types..." />;
    }

    return (
        <div className="types-page">
            <div className="types-header">
                <div>
                    <h1>Device Type Distribution</h1>
                    <p>Asset composition and reliability analysis</p>
                </div>
            </div>

            <div className="type-cards-grid">
                {typeMetrics.map(type => (
                    <div
                        key={type.type}
                        className="type-card-large"
                        onClick={() => handleTypeClick(type.type)}
                    >
                        <div className="type-card-header">
                            <div
                                className="type-icon-large"
                                style={{ color: getTypeColor(type.type) }}
                            >
                                {getTypeIcon(type.type)}
                            </div>
                            <div className="type-title">
                                <h2>{type.type}</h2>
                                <p>{type.total} devices</p>
                            </div>
                        </div>

                        <div className="type-metrics-grid">
                            <div className="type-metric">
                                <div className="metric-icon success">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{type.working}</div>
                                    <div className="metric-label">Working</div>
                                </div>
                            </div>

                            <div className="type-metric">
                                <div className="metric-icon warning">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{type.notWorking}</div>
                                    <div className="metric-label">Not Working</div>
                                </div>
                            </div>

                            <div className="type-metric">
                                <div className="metric-icon danger">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{type.failed}</div>
                                    <div className="metric-label">Failed</div>
                                </div>
                            </div>

                            <div className="type-metric">
                                <div className="metric-icon info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{type.housesServed.toLocaleString()}</div>
                                    <div className="metric-label">Houses</div>
                                </div>
                            </div>
                        </div>

                        <div className="type-operational-bar">
                            <div
                                className="operational-fill"
                                style={{
                                    width: `${type.operationalPercent}%`,
                                    backgroundColor: getTypeColor(type.type)
                                }}
                            />
                        </div>

                        <div className="type-operational-text">
                            <span className="operational-value">{type.operationalPercent.toFixed(1)}%</span>
                            <span className="operational-label">Operational Rate</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TypesPage;
