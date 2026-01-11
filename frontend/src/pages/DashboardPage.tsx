/**
 * Dashboard Page - Executive KPIs
 * 
 * Professional executive dashboard with clickable KPI cards
 * Click any card to filter and navigate to map
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurveyData } from '../services/apiService';
import { computeSystemMetrics } from '../types/metrics';
import {
    RefreshCw, Map, Activity, CheckCircle, AlertTriangle,
    XCircle, MapPin, Clock, TrendingUp
} from 'lucide-react';
import type { Device, ApiResponse } from '../types/device';
import LoadingAnimation from '../components/LoadingAnimation';
import './DashboardPage.css';

export function DashboardPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const metrics = useMemo(() => computeSystemMetrics(allDevices), [allDevices]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchSurveyData() as unknown as ApiResponse;
            if (response.success) {
                setAllDevices(response.devices);
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (filterType: string, filterValue: any) => {
        // Navigate to map with filter in URL params
        const params = new URLSearchParams();
        params.set(filterType, filterValue);
        navigate(`/map?${params.toString()}`);
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading dashboard..." />;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={48} />
                <h2>Error Loading Dashboard</h2>
                <p>{error}</p>
                <button onClick={loadData} className="btn-retry">
                    <RefreshCw size={18} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Hero Banner */}
            <div className="hero-banner">
                <div className="hero-content">
                    <h1>Rudraram Village</h1>
                    <p>Water Infrastructure Mapping Dashboard</p>
                    <span className="hero-subtitle">Itikyala Municipality, Telangana</span>
                </div>
                <div className="hero-actions">
                    <button onClick={loadData} className="btn-refresh">
                        <RefreshCw size={18} />
                        <span>Refresh Data</span>
                    </button>
                    <button onClick={() => navigate('/map')} className="btn-view-map">
                        <Map size={18} />
                        <span>View Map</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards Row */}
            <div className="summary-row">
                <div className="summary-card">
                    <div className="summary-label">Total Devices</div>
                    <div className="summary-value">{metrics.totalDevices}</div>
                </div>
                <div className="summary-card success">
                    <div className="summary-label">Working</div>
                    <div className="summary-value">{metrics.working}</div>
                </div>
                <div className="summary-card warning">
                    <div className="summary-label">Not Working</div>
                    <div className="summary-value">{metrics.notWorking}</div>
                </div>
                <div className="summary-card danger">
                    <div className="summary-label">Failed</div>
                    <div className="summary-value">{metrics.failed}</div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="kpi-grid">
                {/* Total Devices */}
                <div className="kpi-card primary" onClick={() => navigate('/map')}>
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper primary">
                            <Activity size={24} />
                        </div>
                        <span className="kpi-badge">TOTAL</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.totalDevices}</div>
                        <div className="kpi-label">Total Devices</div>
                        <div className="kpi-description">Across all zones</div>
                    </div>
                </div>

                {/* Working Devices */}
                <div className="kpi-card success" onClick={() => handleCardClick('status', 'Working')}>
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper success">
                            <CheckCircle size={24} />
                        </div>
                        <span className="kpi-badge success">OPERATIONAL</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.working}</div>
                        <div className="kpi-label">Working</div>
                        <div className="kpi-description">{metrics.operationalPercent.toFixed(1)}% operational</div>
                    </div>
                </div>

                {/* Not Working */}
                <div className="kpi-card warning" onClick={() => handleCardClick('status', 'Not Working')}>
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper warning">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="kpi-badge warning">ATTENTION</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.notWorking}</div>
                        <div className="kpi-label">Not Working</div>
                        <div className="kpi-description">Need attention</div>
                    </div>
                </div>

                {/* Failed */}
                <div className="kpi-card danger" onClick={() => handleCardClick('status', 'Failed')}>
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper danger">
                            <XCircle size={24} />
                        </div>
                        <span className="kpi-badge danger">CRITICAL</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.failed}</div>
                        <div className="kpi-label">Failed</div>
                        <div className="kpi-description">Critical issues</div>
                    </div>
                </div>

                {/* System Health Score */}
                <div className="kpi-card health">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper health">
                            <TrendingUp size={24} />
                        </div>
                        <span className="kpi-badge">REAL-TIME</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.systemHealthScore}%</div>
                        <div className="kpi-label">System Health Score</div>
                        <div className="kpi-description">
                            {metrics.systemHealthScore >= 90 ? 'Excellent performance' :
                                metrics.systemHealthScore >= 70 ? 'Good performance' :
                                    'Needs improvement'}
                        </div>
                    </div>
                </div>

                {/* Houses Connected */}
                <div className="kpi-card info">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <span className="kpi-badge info">CONNECTED</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.housesServed.toLocaleString()}</div>
                        <div className="kpi-label">Houses Connected</div>
                        <div className="kpi-description">Serving community</div>
                    </div>
                </div>

                {/* GPS Located */}
                <div className="kpi-card mapped">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper mapped">
                            <MapPin size={24} />
                        </div>
                        <span className="kpi-badge">MAPPED</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{metrics.mappedDevices}</div>
                        <div className="kpi-label">GPS Located Devices</div>
                        <div className="kpi-description">
                            {metrics.unmappedDevices > 0
                                ? `${metrics.unmappedDevices} unmapped`
                                : 'All devices mapped'}
                        </div>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="kpi-card time">
                    <div className="kpi-header">
                        <div className="kpi-icon-wrapper time">
                            <Clock size={24} />
                        </div>
                        <span className="kpi-badge">UPDATED</span>
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value time-value">
                            {metrics.lastUpdated.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                        <div className="kpi-label">Last Data Refresh</div>
                        <div className="kpi-description">
                            {metrics.lastUpdated.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
