/**
 * FUTURISTIC HUD (Heads-Up Display)
 * 
 * Floating, draggble glass widgets for mission-critical data.
 * Built with Framer Motion.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CloudRain, AlertTriangle, Layers, X, GripHorizontal } from 'lucide-react';
import { fetchSurveyStats } from '../../services/apiService';
import './HeadsUpDisplay.css';

// Widget Types
type WidgetType = 'STATS' | 'WEATHER' | 'ALERTS';

interface HUDProps {
    visible?: boolean;
}

const HeadsUpDisplay = ({ visible = true }: HUDProps) => {
    // State
    const [stats, setStats] = useState<any>(null);
    const [weather, setWeather] = useState<any>(null);
    const [activeWidgets, setActiveWidgets] = useState<WidgetType[]>(['STATS', 'WEATHER']);

    // Fetch Data
    useEffect(() => {
        // Load System Stats
        const loadStats = async () => {
            const data = await fetchSurveyStats();
            setStats((data as any).stats || data);
        };

        // Load Weather (Open-Meteo Free API)
        const loadWeather = async () => {
            try {
                const res = await fetch(
                    'https://api.open-meteo.com/v1/forecast?latitude=17.5586&longitude=78.1661&current_weather=true'
                );
                const data = await res.json();
                setWeather(data.current_weather);
            } catch (e) {
                console.error("Weather load failed", e);
            }
        };

        loadStats();
        loadWeather();

        // Refresh every 30s
        const interval = setInterval(() => {
            loadStats();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    return (
        <div className="hud-overlay">
            {/* Widget Container */}
            <AnimatePresence>
                {activeWidgets.includes('STATS') && (
                    <HUDWidget
                        key="stats"
                        title="SYSTEM STATUS"
                        icon={<Activity size={16} />}
                        onClose={() => setActiveWidgets(p => p.filter(w => w !== 'STATS'))}
                        initialPos={{ x: 20, y: 20 }}
                    >
                        <div className="stat-grid">
                            <div className="stat-item neon-green">
                                <span className="stat-val">{stats?.totalDevices || 0}</span>
                                <span className="stat-label">DEVICES</span>
                            </div>
                            <div className="stat-item neon-orange">
                                <span className="stat-val">{stats?.byType?.OHSR || 0}</span>
                                <span className="stat-label">OHSR</span>
                            </div>
                            <div className="stat-item neon-blue">
                                <span className="stat-val">{stats?.byType?.SUMP || 0}</span>
                                <span className="stat-label">SUMPS</span>
                            </div>
                            <div className="stat-item neon-red">
                                <span className="stat-val">{stats?.byStatus?.NOT_WORKING || 0}</span>
                                <span className="stat-label">ALERTS</span>
                            </div>
                        </div>
                    </HUDWidget>
                )}

                {activeWidgets.includes('WEATHER') && (
                    <HUDWidget
                        key="weather"
                        title="LOCAL COND."
                        icon={<CloudRain size={16} />}
                        onClose={() => setActiveWidgets(p => p.filter(w => w !== 'WEATHER'))}
                        initialPos={{ x: 20, y: 220 }}
                    >
                        <div className="weather-display">
                            {weather ? (
                                <>
                                    <div className="temp">{weather.temperature}°C</div>
                                    <div className="wind">Wind: {weather.windspeed} km/h</div>
                                    <div className="loc">Rudraram, TS</div>
                                </>
                            ) : (
                                <div className="loading-text">Scanning Atmos...</div>
                            )}
                        </div>
                    </HUDWidget>
                )}
            </AnimatePresence>

            {/* Control Bar (Bottom Center) - To reopen widgets */}
            <div className="hud-dock">
                {!activeWidgets.includes('STATS') && (
                    <button onClick={() => setActiveWidgets(p => [...p, 'STATS'])} title="Show Stats">
                        <Activity size={20} />
                    </button>
                )}
                {!activeWidgets.includes('WEATHER') && (
                    <button onClick={() => setActiveWidgets(p => [...p, 'WEATHER'])} title="Show Weather">
                        <CloudRain size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

// Reusable Draggable Widget
const HUDWidget = ({ title, icon, children, onClose, initialPos }: any) => {
    return (
        <motion.div
            className="hud-widget glass-panel"
            drag
            dragMomentum={false}
            initial={initialPos}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileDrag={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
        >
            <div className="widget-header">
                <div className="header-left">
                    <GripHorizontal size={14} className="drag-handle" />
                    {icon}
                    <span className="title">{title}</span>
                </div>
                <button onClick={onClose} className="close-btn"><X size={14} /></button>
            </div>
            <div className="widget-content">
                {children}
            </div>
        </motion.div>
    );
};

export default HeadsUpDisplay;
