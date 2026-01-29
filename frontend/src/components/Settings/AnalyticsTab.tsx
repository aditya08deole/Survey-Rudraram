import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Activity, TrendingUp, ShieldCheck, Database, AlertCircle, Calendar } from 'lucide-react';
import apiService from '../../services/apiService';
import './AnalyticsTab.css';

const AnalyticsTab = () => {
    const [trendData, setTrendData] = useState([]);
    const [healthData, setHealthData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setIsLoading(true);
        try {
            const [trends, health] = await Promise.all([
                apiService.fetchAnalyticsTrends(),
                apiService.fetchAnalyticsHealth()
            ]);

            if (trends.success) setTrendData(trends.data);
            if (health.success) setHealthData(health.data);
        } catch (err) {
            console.error("Failed to load analytics", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="analytics-loading">
                <div className="analytics-spinner"></div>
                <p>Synthesizing infrastructure data...</p>
            </div>
        );
    }

    const avgHealth = healthData.length > 0
        ? Math.round(healthData.reduce((acc: number, curr: any) => acc + curr.score, 0) / healthData.length)
        : 0;

    const totalSynced = trendData.reduce((acc: number, curr: any) => acc + curr.count, 0);

    return (
        <div className="analytics-tab fade-in">
            {/* Header Stats */}
            <div className="analytics-stats-grid">
                <div className="stat-card glass-panel">
                    <div className="stat-icon trend"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Syncs (14d)</span>
                        <span className="stat-value">{totalSynced}</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon health"><ShieldCheck size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Avg. Infrastructure Health</span>
                        <span className="stat-value">{avgHealth}%</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon zones"><Activity size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Sampled Zones</span>
                        <span className="stat-value">{healthData.length}</span>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                {/* 1. Ingestion Trend Line */}
                <div className="chart-wrapper glass-panel">
                    <div className="chart-header">
                        <h3><Calendar size={18} /> Ingestion Trend</h3>
                        <p>Daily devices synchronized from Excel pipeline</p>
                    </div>
                    <div className="chart-area" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="var(--primary-color)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Zone Health Bar Chart */}
                <div className="chart-wrapper glass-panel">
                    <div className="chart-header">
                        <h3><ShieldCheck size={18} /> Zone Health Score</h3>
                        <p>Percentage of 'Working' devices per surveyed zone</p>
                    </div>
                    <div className="chart-area" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={healthData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="zone"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 10, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                    {healthData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.score > 80 ? '#22c55e' : entry.score > 50 ? '#f59e0b' : '#ef4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Health Ranking Table */}
            <div className="health-ranking glass-panel">
                <div className="chart-header">
                    <h3>Zone-wise Infrastructure Integrity</h3>
                </div>
                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>Zone Name</th>
                            <th>Total Devices</th>
                            <th>Working Status</th>
                            <th>Health Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {healthData.map((zone: any, idx: number) => (
                            <tr key={idx}>
                                <td className="font-bold">{zone.zone}</td>
                                <td>{zone.total} Units</td>
                                <td>
                                    <span className="success-text">{zone.working} Active</span>
                                </td>
                                <td>
                                    <div className="mini-health-bar">
                                        <div
                                            className="mini-health-fill"
                                            style={{
                                                width: `${zone.score}%`,
                                                backgroundColor: zone.score > 80 ? '#22c55e' : zone.score > 50 ? '#f59e0b' : '#ef4444'
                                            }}
                                        ></div>
                                        <span>{zone.score}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnalyticsTab;
