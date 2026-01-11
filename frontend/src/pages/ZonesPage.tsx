/**
 * Zones Page - Geographic Segmentation
 * 
 * Zone-wise operational intelligence with clickable cards
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSurveyData } from '../services/apiService';
import { computeZoneMetrics } from '../types/metrics';
import { MapPin, AlertTriangle } from 'lucide-react';
import type { Device } from '../types/device';
import LoadingAnimation from '../components/LoadingAnimation';
import './ZonesPage.css';

export function ZonesPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const zoneMetrics = useMemo(() => computeZoneMetrics(allDevices), [allDevices]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const response = await fetchSurveyData();
        if (response.success) setAllDevices(response.devices);
        setLoading(false);
    };

    const handleZoneClick = (zone: string) => {
        navigate(`/map?zone=${encodeURIComponent(zone)}`);
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading zones..." />;
    }

    return (
        <div className="zones-page">
            <div className="zones-header">
                <div>
                    <h1>Zone-wise Operations</h1>
                    <p>Geographic segmentation and area-wise health analysis</p>
                </div>
                <div className="zones-summary">
                    <span className="summary-item">
                        <strong>{zoneMetrics.length}</strong> Zones
                    </span>
                    <span className="summary-item">
                        <strong>{allDevices.length}</strong> Total Devices
                    </span>
                </div>
            </div>

            <div className="zone-cards-grid">
                {zoneMetrics.map(zone => (
                    <div
                        key={zone.zone}
                        className={`zone-card health-${zone.healthColor}`}
                        onClick={() => handleZoneClick(zone.zone)}
                    >
                        <div className="zone-header">
                            <div className="zone-icon">
                                <MapPin size={24} />
                            </div>
                            <h3>{zone.zone}</h3>
                            {zone.healthColor === 'red' && (
                                <AlertTriangle size={18} className="warning-icon" />
                            )}
                        </div>

                        <div className="zone-stats-grid">
                            <div className="zone-stat">
                                <div className="stat-label">Total Devices</div>
                                <div className="stat-value">{zone.totalDevices}</div>
                            </div>

                            <div className="zone-stat success">
                                <div className="stat-label">Working</div>
                                <div className="stat-value">{zone.working}</div>
                            </div>

                            <div className="zone-stat warning">
                                <div className="stat-label">Not Working</div>
                                <div className="stat-value">{zone.notWorking}</div>
                            </div>

                            <div className="zone-stat danger">
                                <div className="stat-label">Failed</div>
                                <div className="stat-value">{zone.failed}</div>
                            </div>
                        </div>

                        <div className="zone-houses">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <span>{zone.housesServed.toLocaleString()} houses served</span>
                        </div>

                        <div className="zone-progress-bar">
                            <div
                                className={`progress-fill health-${zone.healthColor}`}
                                style={{ width: `${zone.operationalPercent}%` }}
                            />
                        </div>

                        <div className="zone-operational">
                            <span className="operational-percent">{zone.operationalPercent.toFixed(0)}%</span>
                            <span className="operational-label">Operational</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ZonesPage;
