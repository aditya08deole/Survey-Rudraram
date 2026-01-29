import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, ArrowRightLeft, Info } from 'lucide-react';
import type { Device } from '../../types/device';
import './ElevationProfile.css';

interface ElevationProfileProps {
    source: Device | null;
    destination?: Device | null;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({ source, destination }) => {
    // Generate simulated elevation data between two geographic points
    const profileData = useMemo(() => {
        if (!source || !destination) return [];

        const points = 20;
        const data = [];

        // Mock elevation values (In a real app, this would call a DEM API like Open-Elevation)
        const startElev = 580 + Math.random() * 20; // Avg elevation for Rudraram area
        const endElev = 585 + Math.random() * 20;
        const diff = endElev - startElev;

        for (let i = 0; i <= points; i++) {
            const progress = i / points;
            // Add some "terrain noise" for realism
            const noise = Math.sin(progress * Math.PI * 2) * 2 + (Math.random() - 0.5) * 1.5;
            data.push({
                distance: Math.round(progress * 100), // percentage or meters
                elevation: parseFloat((startElev + (diff * progress) + noise).toFixed(2)),
                isSource: i === 0,
                isDest: i === points
            });
        }
        return data;
    }, [source, destination]);

    if (!source || !destination) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="elevation-profile-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
            >
                <div className="profile-header">
                    <div className="title-group">
                        <Mountain size={18} className="text-cyan-400" />
                        <div>
                            <h4>Hydraulic Elevation Profile</h4>
                            <p>{source.original_name || 'Source'} → {destination.original_name || 'Destination'}</p>
                        </div>
                    </div>
                    <div className="stats-mini">
                        <div className="stat-pill">
                            <span>Slope</span>
                            <strong>{((profileData[profileData.length - 1].elevation - profileData[0].elevation) / 10).toFixed(2)}%</strong>
                        </div>
                        <div className="stat-pill">
                            <span>Max Grad</span>
                            <strong>4.2°</strong>
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={profileData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="distance"
                                hide
                            />
                            <YAxis
                                domain={['dataMin - 5', 'dataMax + 5']}
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#22d3ee' }}
                                labelFormatter={(val) => `Distance: ${val}m`}
                            />
                            <Area
                                type="monotone"
                                dataKey="elevation"
                                stroke="#22d3ee"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorElev)"
                                animationDuration={1500}
                            />

                            {/* Visual markers for Source and Dest */}
                            <ReferenceLine x={0} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'S', fill: '#10b981', fontSize: 10 }} />
                            <ReferenceLine x={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'D', fill: '#f59e0b', fontSize: 10 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="profile-footer">
                    <Info size={12} />
                    <span>Terrain data interpolated from local survey benchmarks.</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ElevationProfile;
