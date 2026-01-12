/**
 * FUTURISTIC CANVAS TOOLS
 * 
 * Features:
 * - Draggable Glass Panel (Framer Motion)
 * - Text Tool with Dynamic Outline
 * - Polyline, Polygon, Circle, Rect, Marker
 * - Collapsible "Dock" Mode
 * - Global Save/Delete
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet-draw';
import {
    Pencil, Square, Circle, Type, Eraser, Save,
    Trash2, RotateCcw, RotateCw, GripHorizontal,
    Minus, Maximize2, MousePointer2
} from 'lucide-react';
import { getMapZones, saveMapZone, deleteAllMapZones } from '../../../services/apiService';
import './CanvasTools.css';

// Colors
const PALETTE = ['#39FF14', '#FF073A', '#00F0FF', '#FF9E00', '#FFFFFF', '#000000'];

const CanvasTools = () => {
    const map = useMap();
    const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [color, setColor] = useState(PALETTE[0]);
    const [saving, setSaving] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!map) return;
        const items = new L.FeatureGroup();
        // @ts-ignore
        map.addLayer(items);
        setDrawnItems(items);

        // Load Zones via API
        getMapZones().then(zones => {
            zones.forEach((z: any) => {
                try {
                    let layer: any;
                    if (z.type === 'polygon') layer = L.polygon(z.geometry, { color: z.color });
                    else if (z.type === 'circle') layer = L.circle(z.geometry, { radius: z.radius, color: z.color });
                    else if (z.type === 'rectangle') layer = L.rectangle(z.geometry, { color: z.color });
                    else if (z.type === 'text') {
                        // Recreate Text Marker
                        layer = L.marker(z.geometry, {
                            icon: L.divIcon({
                                className: 'dynamic-text-label',
                                html: `<div style="color:${z.color}; border-color:${z.color}">${z.text}</div>`,
                                iconSize: [null as any, null as any], // Auto size
                            })
                        });
                        // @ts-ignore
                        layer.textData = z.text;
                    }

                    if (layer) {
                        // @ts-ignore
                        layer.zoneId = z.id;
                        items.addLayer(layer);
                    }
                } catch (e) {
                    console.error('Failed to load zone', z);
                }
            });
        });

        // Event for Text Tool Click
        const handleMapClick = (e: L.LeafletMouseEvent) => {
            // We use a ref or global state check in real app, but for closure scope:
            // This listener is recreated if dependencies change, or we check current tool state ref/attr
        };

        // Since we can't easily access 'activeTool' in a listener attached once, 
        // we use the 'draw:created' event for shapes, but for Text which is custom:
        // We'll rely on the Draw handler if possible, OR standard map click.
        // For simplicity, we'll use a simple "Click to place text" approach if tool is selected.

        return () => {
            // @ts-ignore
            map.removeLayer(items);
        };
    }, [map]);

    // Custom Text Tool Logic
    useEffect(() => {
        if (!map) return;

        const onClick = (e: L.LeafletMouseEvent) => {
            if (activeTool !== 'text') return;

            const text = prompt("Enter label text:");
            if (text && drawnItems) {
                const icon = L.divIcon({
                    className: 'dynamic-text-label',
                    html: `<div style="color:${color}; border-color:${color}">${text}</div>`,
                    // No fixed size makes it dynamic
                });

                const marker = L.marker(e.latlng, { icon });
                // @ts-ignore
                marker.textData = text; // Store for save
                // @ts-ignore
                marker.color = color;

                drawnItems.addLayer(marker);
                setActiveTool(null); // Reset after placing
            }
        };

        map.on('click', onClick);
        return () => { map.off('click', onClick); };
    }, [map, activeTool, drawnItems, color]);

    // Standard Draw Tools
    const startDraw = (type: string) => {
        if (type === 'text') {
            setActiveTool('text');
            return;
        }

        setActiveTool(type);
        // @ts-ignore
        const shapeOptions = { color: color, weight: 3 };

        let drawer: any;
        // @ts-ignore
        if (type === 'polygon') drawer = new L.Draw.Polygon(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'rectangle') drawer = new L.Draw.Rectangle(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'circle') drawer = new L.Draw.Circle(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'marker') drawer = new L.Draw.Marker(map);

        if (drawer) {
            drawer.enable();
            // @ts-ignore
            map.once(L.Draw.Event.CREATED, (e: any) => {
                drawnItems?.addLayer(e.layer);
                setActiveTool(null);
            });
        }
    };

    const handleSave = async () => {
        if (!drawnItems) return;
        setSaving(true);
        const layers = drawnItems.getLayers();

        for (const layer of layers) {
            // @ts-ignore
            if (layer.zoneId) continue;

            const zoneId = crypto.randomUUID();
            let geometry: any;
            let type = 'unknown';
            let radius = 0;
            let text = '';

            // @ts-ignore
            if (layer instanceof L.Polygon) { geometry = layer.getLatLngs(); type = 'polygon'; }
            // @ts-ignore
            else if (layer instanceof L.Circle) { geometry = layer.getLatLng(); radius = layer.getRadius(); type = 'circle'; }
            // @ts-ignore
            else if (layer instanceof L.Rectangle) { geometry = layer.getLatLngs(); type = 'rectangle'; } // Rectangle is polygon subclass
            // @ts-ignore
            else if (layer.textData) { geometry = layer.getLatLng(); type = 'text'; text = layer.textData; }

            if (type !== 'unknown') {
                await saveMapZone({ id: zoneId, type, geometry, radius, color, text });
                // @ts-ignore
                layer.zoneId = zoneId;
            }
        }
        setSaving(false);
    };

    const handleDeleteAll = async () => {
        if (window.confirm('Clear all drawings globally?')) {
            await deleteAllMapZones();
            drawnItems?.clearLayers();
        }
    };

    return (
        <AnimatePresence>
            {!isCollapsed ? (
                <motion.div
                    className="canvas-float-panel"
                    drag
                    dragMomentum={false}
                    initial={{ scale: 0.9, opacity: 0, x: 20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="panel-header">
                        <div className="drag-handle"><GripHorizontal size={14} /> CANVAS</div>
                        <button onClick={() => setIsCollapsed(true)}><Minus size={14} /></button>
                    </div>

                    <div className="tool-grid">
                        <button className={activeTool === 'polygon' ? 'active' : ''} onClick={() => startDraw('polygon')} title="Polygon">
                            <Pencil size={16} />
                        </button>
                        <button className={activeTool === 'rectangle' ? 'active' : ''} onClick={() => startDraw('rectangle')} title="Box">
                            <Square size={16} />
                        </button>
                        <button className={activeTool === 'circle' ? 'active' : ''} onClick={() => startDraw('circle')} title="Circle">
                            <Circle size={16} />
                        </button>
                        <button className={activeTool === 'text' ? 'active' : ''} onClick={() => startDraw('text')} title="Add Text">
                            <Type size={16} />
                        </button>
                    </div>

                    <div className="color-strip">
                        {PALETTE.map(c => (
                            <div
                                key={c}
                                className={`color-dot ${color === c ? 'selected' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>

                    <div className="action-strip">
                        <button className="btn-save" onClick={handleSave} disabled={saving}>
                            <Save size={14} /> {saving ? '...' : 'SAVE'}
                        </button>
                        <button className="btn-clear" onClick={handleDeleteAll}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    className="canvas-toggle-btn"
                    onClick={() => setIsCollapsed(false)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <Pencil size={20} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default CanvasTools;
