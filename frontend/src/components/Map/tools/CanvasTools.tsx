/**
 * PROFESSIONAL CANVAS TOOLS
 * 
 * Features:
 * - Draggable Panel (White Glass Theme)
 * - Proper Draw Handlers (No re-clicking needed)
 * - More Shapes: Polygon, Rectangle, Circle, Polyline, Marker
 * - Text Tool with Dynamic Sizing
 * - Undo/Redo with History Stack
 * - Delete All
 * - Edit Mode Toggle
 * - Collapsible
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
    Pencil, Square, Circle, Type, Trash2, Save,
    RotateCcw, RotateCw, Minus, Edit3,
    MapPin, Slash, GripVertical
} from 'lucide-react';
import { getMapZones, saveMapZone, deleteAllMapZones } from '../../../services/apiService';
import './CanvasTools.css';

const COLORS = ['#39FF14', '#FF073A', '#00F0FF', '#FF9E00', '#FFFFFF', '#000000'];

const CanvasTools = () => {
    const map = useMap();
    const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [color, setColor] = useState(COLORS[0]);
    const [saving, setSaving] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // History for Undo/Redo
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const currentDrawer = useRef<any>(null);

    // Initialize Feature Group
    useEffect(() => {
        if (!map) return;

        const items = new L.FeatureGroup();
        map.addLayer(items);
        setDrawnItems(items);

        // Load saved zones
        getMapZones().then((zones: any[]) => {
            zones.forEach((z) => {
                try {
                    let layer: L.Layer | null = null;
                    if (z.type === 'polygon') layer = L.polygon(z.geometry, { color: z.color });
                    else if (z.type === 'rectangle') layer = L.rectangle(z.geometry, { color: z.color });
                    else if (z.type === 'circle') layer = L.circle(z.geometry, { radius: z.radius, color: z.color });
                    else if (z.type === 'polyline') layer = L.polyline(z.geometry, { color: z.color });
                    else if (z.type === 'marker') layer = L.marker(z.geometry);

                    if (layer) {
                        (layer as any).zoneId = z.id;
                        items.addLayer(layer);
                    }
                } catch (e) { console.error('Zone load error', e); }
            });
            takeSnapshot(items);
        });

        return () => { map.removeLayer(items); };
    }, [map]);

    // Snapshot for History
    const takeSnapshot = useCallback((items: L.FeatureGroup) => {
        const geo = items.toGeoJSON();
        const snap = JSON.stringify(geo);
        setHistory(prev => [...prev.slice(0, historyIndex + 1), snap]);
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    // Keyboard shortcut for snapshot
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (drawnItems) { // Ensure drawnItems is available before taking snapshot
                    takeSnapshot(drawnItems);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [takeSnapshot, drawnItems]); // Add drawnItems to dependencies for the snapshot

    // Draw Event Handler
    useEffect(() => {
        if (!map || !drawnItems) return;

        const onCreate = (e: any) => {
            drawnItems.addLayer(e.layer);
            takeSnapshot(drawnItems);
            setActiveTool(null);
            currentDrawer.current = null;
        };

        map.on('draw:created', onCreate);
        return () => { map.off('draw:created', onCreate); };
    }, [map, drawnItems, takeSnapshot]);

    // Start Drawing
    const startDraw = (type: string) => {
        if (!map) return;

        // Cancel any existing drawer
        if (currentDrawer.current) {
            currentDrawer.current.disable();
            currentDrawer.current = null;
        }

        // If clicking same tool, just deselect
        if (activeTool === type) {
            setActiveTool(null);
            return;
        }

        setActiveTool(type);
        const shapeOptions = { color, weight: 3, fillOpacity: 0.3 };

        let drawer: any = null;

        // @ts-ignore
        if (type === 'polygon') drawer = new L.Draw.Polygon(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'rectangle') drawer = new L.Draw.Rectangle(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'circle') drawer = new L.Draw.Circle(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'polyline') drawer = new L.Draw.Polyline(map, { shapeOptions });
        // @ts-ignore
        else if (type === 'marker') drawer = new L.Draw.Marker(map);

        if (drawer) {
            drawer.enable();
            currentDrawer.current = drawer;
        }
    };

    // Text Tool
    useEffect(() => {
        if (!map || !drawnItems) return;

        const onClick = (e: L.LeafletMouseEvent) => {
            if (activeTool !== 'text') return;

            const text = prompt('Enter text label:');
            if (!text) return;

            const icon = L.divIcon({
                className: 'canvas-text-label',
                html: `<div style="
                    background: rgba(0,0,0,0.8);
                    color: ${color};
                    padding: 4px 10px;
                    border-radius: 4px;
                    border: 2px solid ${color};
                    font-weight: 700;
                    font-size: 13px;
                    white-space: nowrap;
                ">${text}</div>`,
            });

            const marker = L.marker(e.latlng, { icon, draggable: editMode });
            (marker as any).textData = text;
            (marker as any).textColor = color;
            drawnItems.addLayer(marker);
            takeSnapshot(drawnItems);
            setActiveTool(null);
        };

        map.on('click', onClick);
        return () => { map.off('click', onClick); };
    }, [map, drawnItems, activeTool, color, editMode, takeSnapshot]);

    // Toggle Edit Mode
    const toggleEdit = () => {
        if (!drawnItems) return;
        setEditMode(!editMode);

        drawnItems.eachLayer((layer: any) => {
            if (layer.dragging) {
                if (!editMode) layer.dragging.enable();
                else layer.dragging.disable();
            }
        });
    };

    // Undo
    const undo = () => {
        if (historyIndex <= 0 || !drawnItems) return;
        const prevSnap = history[historyIndex - 1];
        restoreFromGeoJSON(prevSnap);
        setHistoryIndex(historyIndex - 1);
    };

    // Redo
    const redo = () => {
        if (historyIndex >= history.length - 1 || !drawnItems) return;
        const nextSnap = history[historyIndex + 1];
        restoreFromGeoJSON(nextSnap);
        setHistoryIndex(historyIndex + 1);
    };

    const restoreFromGeoJSON = (geoStr: string) => {
        if (!drawnItems) return;
        drawnItems.clearLayers();
        try {
            const geo = JSON.parse(geoStr);
            L.geoJSON(geo).eachLayer((layer) => drawnItems.addLayer(layer));
        } catch (e) { console.error('Restore error', e); }
    };

    // Save All
    const handleSave = async () => {
        if (!drawnItems) return;
        setSaving(true);

        const layers = drawnItems.getLayers();
        for (const layer of layers) {
            if ((layer as any).zoneId) continue;

            const zoneId = crypto.randomUUID();
            let geometry: any, type = 'unknown', radius = 0, text = '';

            if (layer instanceof L.Polygon) { geometry = (layer as any).getLatLngs(); type = 'polygon'; }
            else if (layer instanceof L.Circle) { geometry = layer.getLatLng(); radius = layer.getRadius(); type = 'circle'; }
            else if (layer instanceof L.Polyline) { geometry = (layer as any).getLatLngs(); type = 'polyline'; }
            else if ((layer as any).textData) { geometry = (layer as any).getLatLng(); type = 'text'; text = (layer as any).textData; }
            else if (layer instanceof L.Marker) { geometry = layer.getLatLng(); type = 'marker'; }

            if (type !== 'unknown') {
                await saveMapZone({ id: zoneId, type, geometry, radius, color, text });
                (layer as any).zoneId = zoneId;
            }
        }
        setSaving(false);
    };

    // Delete All
    const handleDeleteAll = async () => {
        if (!window.confirm('Delete all drawings?')) return;
        await deleteAllMapZones();
        drawnItems?.clearLayers();
        setHistory([]);
        setHistoryIndex(-1);
    };

    if (collapsed) {
        return (
            <motion.button
                className="canvas-toggle-btn"
                onClick={() => setCollapsed(false)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
            >
                <Pencil size={18} />
            </motion.button>
        );
    }

    return (
        <motion.div
            className="canvas-panel"
            drag
            dragMomentum={false}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className="canvas-header">
                <GripVertical size={12} />
                <span>CANVAS</span>
                <button onClick={() => setCollapsed(true)}><Minus size={12} /></button>
            </div>

            <div className="canvas-tools">
                <button className={activeTool === 'polygon' ? 'active' : ''} onClick={() => startDraw('polygon')} title="Polygon">
                    <Pencil size={14} />
                </button>
                <button className={activeTool === 'rectangle' ? 'active' : ''} onClick={() => startDraw('rectangle')} title="Rectangle">
                    <Square size={14} />
                </button>
                <button className={activeTool === 'circle' ? 'active' : ''} onClick={() => startDraw('circle')} title="Circle">
                    <Circle size={14} />
                </button>
                <button className={activeTool === 'polyline' ? 'active' : ''} onClick={() => startDraw('polyline')} title="Line">
                    <Slash size={14} />
                </button>
                <button className={activeTool === 'marker' ? 'active' : ''} onClick={() => startDraw('marker')} title="Marker">
                    <MapPin size={14} />
                </button>
                <button className={activeTool === 'text' ? 'active' : ''} onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')} title="Text">
                    <Type size={14} />
                </button>
            </div>

            <div className="canvas-colors">
                {COLORS.map(c => (
                    <div
                        key={c}
                        className={`color-swatch ${color === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>

            <div className="canvas-actions">
                <button onClick={undo} title="Undo" disabled={historyIndex <= 0}>
                    <RotateCcw size={14} />
                </button>
                <button onClick={redo} title="Redo" disabled={historyIndex >= history.length - 1}>
                    <RotateCw size={14} />
                </button>
                <button onClick={toggleEdit} className={editMode ? 'active' : ''} title="Edit Mode">
                    <Edit3 size={14} />
                </button>
                <button onClick={handleDeleteAll} className="delete-btn" title="Delete All">
                    <Trash2 size={14} />
                </button>
            </div>

            <button className="save-btn" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'SAVE'}
            </button>
        </motion.div>
    );
};

export default CanvasTools;
