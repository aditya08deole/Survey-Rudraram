/**
 * Analytics Page - Status Distribution
 * 
 * Professional analytics view with status distribution charts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurveyData } from '../services/apiService';
import { computeStatusDistribution, computeTypeMetrics } from '../types/metrics';
import { BarChart3, PieChart } from 'lucide-react';
import type { Device } from '../types/device';
import LoadingAnimation from '../components/LoadingAnimation';
import './AnalyticsPage.css';

export function AnalyticsPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const statusDistribution = useMemo(() => computeStatusDistribution(allDevices), [allDevices]);
    const typeMetrics = useMemo(() => computeTypeMetrics(allDevices), [allDevices]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const response = await fetchSurveyData();
        if (response.success) setAllDevices(response.devices);
        setLoading(false);
    };

    const handleStatusClick = (status: string) => {
        navigate(`/map?status=${status}`);
    };

    const handleTypeClick = (type: string) => {
        navigate(`/map?deviceType=${type}`);
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading analytics..." />;
    }

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <h1>Status Distribution</h1>
                <p>Operational reliability analysis</p>
            </div>

            <div className="analytics-grid">
                {/* Status Distribution */}
                <div className="analytics-card status-distribution">
                    <div className="card-header">
                        <BarChart3 size={24} />
                        <h2>Status Distribution</h2>
                    </div>

                    <div className="status-bars">
                        {statusDistribution.map(item => (
                            <div
                                key={item.status}
                                className="status-bar-row"
                                onClick={() => handleStatusClick(item.status)}
                            >
                                <div className="status-info">
                                    <div
                                        className="status-dot"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="status-label">{item.status}</span>
                                </div>

                                <div className="status-bar-container">
                                    <div
                                        className="status-bar-fill"
                                        style={{
                                            width: `${item.percent}%`,
                                            backgroundColor: item.color
                                        }}
                                    >
                                        <span className="bar-label">{item.percent.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="status-count">{item.count} devices</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Types */}
                <div className="analytics-card device-types">
                    <div className="card-header">
                        <PieChart size={24} />
                        <h2>Device Types</h2>
                    </div>

                    <div className="type-cards">
                        {typeMetrics.map(type => (
                            <div
                                key={type.type}
                                className="type-card"
                                onClick={() => handleTypeClick(type.type)}
                            >
                                <div className="type-header">
                                    <h3>{type.type}</h3>
                                    <div className="type-count">{type.total}</div>
                                </div>

                                <div className="type-stats">
                                    <div className="stat">
                                        <span className="stat-label">Working</span>
                                        <span className="stat-value success">{type.working}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Not Working</span>
                                        <span className="stat-value warning">{type.notWorking}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Failed</span>
                                        <span className="stat-value danger">{type.failed}</span>
                                    </div>
                                </div>

                                <div className="type-progress">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${type.operationalPercent}%` }}
                                    />
                                </div>
                                <div className="type-percent">{type.operationalPercent.toFixed(0)}% Operational</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;
