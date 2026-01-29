import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity as ActivityIcon, ArrowUpRight, Camera,
    FileText, RefreshCw, Clock
} from 'lucide-react';
import type { Device } from '../../types/device';
import './ActivityStream.css';

type ActivityType = 'PHOTO' | 'NOTE' | 'SYNC';

interface Activity {
    id: string;
    type: ActivityType;
    device: Device;
    timestamp: string;
    message: string;
    user: string;
}

interface ActivityStreamProps {
    devices: Device[];
    onActivityClick?: (device: Device) => void;
}

/**
 * ActivityStream Component
 * Provides a live feed of field actions (Photos, Notes, Syncs)
 */
const ActivityStream: React.FC<ActivityStreamProps> = ({ devices, onActivityClick }) => {
    const [activities, setActivities] = useState<Activity[]>([]);

    // Generate mock activity based on real device data for instant "Live" feel
    useEffect(() => {
        if (!devices || devices.length === 0) return;

        // Initially create a few activities from recent devices
        const initialActivities: Activity[] = devices
            .filter(d => d.notes)
            .slice(0, 5)
            .map((d, i) => ({
                id: `act-${d.survey_id}-${i}`,
                type: 'NOTE' as ActivityType,
                device: d,
                timestamp: new Date().toISOString(),
                message: d.notes ? `Observation updated: "${d.notes.substring(0, 30)}..."` : 'Asset telemetry synced',
                user: 'Field Team'
            }));

        setActivities(initialActivities);

        // Dynamic "Live" Simulation every 20 seconds
        const interval = setInterval(() => {
            const randomDevice = devices[Math.floor(Math.random() * devices.length)];
            const types: ActivityType[] = ['SYNC', 'PHOTO', 'NOTE'];
            const type = types[Math.floor(Math.random() * types.length)];

            const newActivity: Activity = {
                id: `act-${Date.now()}`,
                type,
                device: randomDevice,
                timestamp: new Date().toISOString(),
                message: getMessage(type, randomDevice),
                user: 'Field Tech'
            };

            setActivities(prev => {
                const updated = [newActivity, ...prev];
                return updated.slice(0, 10);
            });
        }, 20000);

        return () => clearInterval(interval);
    }, [devices]);

    const getMessage = (type: ActivityType, device: Device) => {
        const name = device.original_name || device.survey_id;
        if (type === 'PHOTO') return `New photo ingested for ${name}`;
        if (type === 'NOTE') return `Intelligence updated for asset ${name}`;
        return `Health heartbeat received from ${name}`;
    };

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case 'PHOTO': return <Camera size={14} className="text-cyan-400" />;
            case 'NOTE': return <FileText size={14} className="text-amber-400" />;
            default: return <RefreshCw size={14} className="text-emerald-400" />;
        }
    };

    return (
        <div className="activity-stream-overlay">
            <div className="stream-header">
                <div className="stream-title">
                    <ActivityIcon size={16} className="pulse-icon" />
                    <span>Operational Intelligence</span>
                </div>
                <div className="live-badge">
                    <span className="dot" />
                    LIVE
                </div>
            </div>

            <div className="stream-content">
                <AnimatePresence initial={false}>
                    {activities.map((act) => (
                        <motion.div
                            key={act.id}
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            className="activity-card"
                            onClick={() => onActivityClick?.(act.device)}
                        >
                            <div className="card-top">
                                <span className={`type-tag ${act.type.toLowerCase()}`}>
                                    {getIcon(act.type)}
                                    {act.type}
                                </span>
                                <span className="time-ago">
                                    <Clock size={10} />
                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="card-body">
                                <p className="message">{act.message}</p>
                                <div className="card-footer">
                                    <span className="asset-ref">{act.device.original_name || act.device.survey_id}</span>
                                    <button className="fly-btn">
                                        <ArrowUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityStream;
