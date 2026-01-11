import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
    Pencil, Type, Square, Circle, Trash2,
    Ruler, MousePointer2, Maximize, ChevronRight, ChevronLeft, Save, RefreshCw
} from 'lucide-react';
import './CanvasTools.css';
import { getMapZones, saveMapZone, deleteMapZone, updateMapZone } from '../../../services/apiService';

// Colors for the palette
const COLORS = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#6366F1', // Indigo
    '#000000', // Black
    '#FFFFFF'  // White
];

const CanvasTools = () => {
    const map = useMap();
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [fontSize, setFontSize] = useState(16);
    const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    const drawHandlerRef = useRef<any>(null);
    const editHandlerRef = useRef<any>(null);
    const deleteHandlerRef = useRef<any>(null);
    const measurePointsRef = useRef<L.LatLng[]>([]);
    const measureLineRef = useRef<L.Polyline | null>(null);
    const measureTooltipRef = useRef<L.Marker | null>(null);

    // Initialize FeatureGroup and Load Zones
    useEffect(() => {
        if (!map) return;

        const items = new L.FeatureGroup();
        // @ts-ignore
        map.addLayer(items);
        setDrawnItems(items);

        loadZones(items);

        return () => {
            // @ts-ignore
            map.removeLayer(items);
        };
    }, [map]);

    const loadZones = async (group: L.FeatureGroup) => {
        const zones = await getMapZones();
        zones.forEach((z: any) => {
            try {
                // Convert stored LatLngs to Leaflet Layer
                const latlngs = z.geometry;
                let layer: any;

                const options = {
                    color: z.color,
                    weight: 2,
                    fillOpacity: 0.05,
                    className: 'zone-glow', // Glow effect
                    interactive: false // Default non-interactive (click-through)
                };

                if (z.type === 'polygon') layer = L.polygon(latlngs, options);
                else if (z.type === 'rectangle') layer = L.rectangle(latlngs, options);
                else if (z.type === 'circle') layer = L.circle(latlngs, { ...options, radius: z.radius }); // Radius for circle
                else if (z.type === 'polyline') layer = L.polyline(latlngs, { ...options, fill: false });
                else if (z.type === 'text') {
                    // Reconstruct text marker
                    const icon = L.divIcon({
                        className: 'canvas-text-marker',
                        html: `<div class="text-annotation-wrapper"><div class="text-annotation" style="color:${z.color};font-size:${z.fontSize || 16}px;font-weight:bold">${z.label}</div></div>`
                    });
                    // @ts-ignore
                    layer = L.marker(latlngs, { icon, draggable: false });
                    // @ts-ignore
                    layer.zoneData = z;
                }

                if (layer) {
                    // @ts-ignore
                    layer.zoneId = z.id;
                    group.addLayer(layer);
                }
            } catch (e) {
                console.error("Failed to render zone", z, e);
            }
        });
    };

    const handleSave = async () => {
        if (!drawnItems) return;
        setSaving(true);

        const layers = drawnItems.getLayers();

        for (const layer of layers) {
            // @ts-ignore
            if (layer.zoneId) continue; // Already saved

            const zoneId = crypto.randomUUID();
            let geometry: any;
            let type = 'unknown';
            let radius = 0;
            let textLabel = "";

            // @ts-ignore
            if (layer instanceof L.Polygon) {
                // @ts-ignore
                geometry = layer.getLatLngs();
                type = 'polygon';
                // Check if rectangle (Leaflet draw sometimes makes polygons)
            }
            // @ts-ignore
            if (layer instanceof L.Circle) {
                // @ts-ignore
                geometry = layer.getLatLng();
                // @ts-ignore
                radius = layer.getRadius();
                type = 'circle';
            }
            // @ts-ignore
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                // @ts-ignore
                geometry = layer.getLatLngs();
                type = 'polyline';
            }

            // Text Handling
            // @ts-ignore
            if (layer instanceof L.Marker && layer.options.icon?.options?.className === 'canvas-text-marker') {
                // @ts-ignore
                const html = layer.getElement()?.innerText || "Text";
                textLabel = html;
                // @ts-ignore
                geometry = layer.getLatLng();
                type = 'text';
            }

            if (type !== 'unknown') {
                const zone = {
                    id: zoneId,
                    type,
                    geometry,
                    radius,
                    label: textLabel,
                    color: selectedColor,
                    fontSize: fontSize
                };

                await saveMapZone(zone);
                // @ts-ignore
                layer.zoneId = zoneId;
                // Apply 'saved' styling
                // @ts-ignore
                if (layer.setStyle) {
                    // @ts-ignore
                    layer.setStyle({ className: 'zone-glow', interactive: isEditMode });
                }
            }
        }
        setSaving(false);
        // Refresh to ensure sync
        if (drawnItems) {
            drawnItems.clearLayers();
            loadZones(drawnItems);
        }
    };

    // Handle standard Drawing Tools
    const startDrawing = (type: string) => {
        if (drawHandlerRef.current) drawHandlerRef.current.disable();
        resetMeasure();
        setActiveTool(type);

        if (type === 'measure') {
            L.DomUtil.addClass(map.getContainer(), 'crosshair-cursor');
            map.on('click', handleMeasureClick);
            map.on('dblclick', finishMeasure);
            return;
        }

        const options = {
            shapeOptions: {
                color: selectedColor,
                weight: 4,
                opacity: 0.7,
                fillOpacity: 0.05,
            }
        };

        // @ts-ignore
        const LeafletDraw = L.Draw;
        if (type === 'polygon') drawHandlerRef.current = new LeafletDraw.Polygon(map, options);
        else if (type === 'polyline') drawHandlerRef.current = new LeafletDraw.Polyline(map, options);
        else if (type === 'rectangle') drawHandlerRef.current = new LeafletDraw.Rectangle(map, options);
        else if (type === 'circle') drawHandlerRef.current = new LeafletDraw.Circle(map, options);

        if (drawHandlerRef.current) drawHandlerRef.current.enable();
    };

    // MANUAL MEASURE (Kept same as before)
    const handleMeasureClick = (e: any) => {
        const latlng = e.latlng;
        measurePointsRef.current.push(latlng);
        if (!measureLineRef.current) {
            measureLineRef.current = L.polyline(measurePointsRef.current, { color: selectedColor, dashArray: '5, 5' }).addTo(map);
        } else {
            measureLineRef.current.setLatLngs(measurePointsRef.current);
        }
        let totalDistance = 0;
        for (let i = 0; i < measurePointsRef.current.length - 1; i++) {
            totalDistance += measurePointsRef.current[i].distanceTo(measurePointsRef.current[i + 1]);
        }
        const text = totalDistance > 1000 ? `${(totalDistance / 1000).toFixed(2)} km` : `${totalDistance.toFixed(1)} m`;
        if (measureTooltipRef.current) {
            measureTooltipRef.current.setLatLng(latlng);
            measureTooltipRef.current.setIcon(L.divIcon({ className: 'measure-tooltip', html: `<div class="measure-tag">${text}</div>` }));
        } else {
            measureTooltipRef.current = L.marker(latlng, { icon: L.divIcon({ className: 'measure-tooltip', html: `<div class="measure-tag">${text}</div>` }) }).addTo(map);
        }
    };

    const finishMeasure = () => {
        if (measurePointsRef.current.length > 1 && drawnItems) {
            L.polyline(measurePointsRef.current, { color: selectedColor, weight: 3 }).addTo(drawnItems);
            if (measureTooltipRef.current) {
                L.marker(measurePointsRef.current[measurePointsRef.current.length - 1], { icon: measureTooltipRef.current.getIcon() }).addTo(drawnItems);
            }
        }
        resetMeasure();
    };
    const resetMeasure = () => {
        map.off('click', handleMeasureClick);
        map.off('dblclick', finishMeasure);
        L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');
        if (measureLineRef.current) map.removeLayer(measureLineRef.current);
        if (measureTooltipRef.current) map.removeLayer(measureTooltipRef.current);
        measurePointsRef.current = [];
        measureLineRef.current = null;
        measureTooltipRef.current = null;
    };

    const toggleEditMode = () => {
        if (!map || !drawnItems) return;

        if (isEditMode) {
            // Save Changes from Edit
            if (editHandlerRef.current) {
                editHandlerRef.current.save();
                editHandlerRef.current.disable();
            }

            // Auto-save edited zones
            drawnItems.eachLayer((layer: any) => {
                if (layer.zoneId) {
                    let geometry: any;
                    // @ts-ignore
                    if (layer.getLatLngs) geometry = layer.getLatLngs();
                    // @ts-ignore
                    else if (layer.getLatLng) geometry = layer.getLatLng();

                    if (geometry) {
                        // We only update geometry for now, preserving other props is harder without full state
                        // But we attached 'zoneData' to layer in loadZones!
                        const z = layer.zoneData || {};
                        const updatedZone = {
                            ...z,
                            id: layer.zoneId,
                            geometry: geometry,
                            // Ensure type matches
                        };
                        updateMapZone(layer.zoneId, updatedZone);
                    }
                }
            });

            // Re-disable interaction
            drawnItems.eachLayer((layer: any) => {
                if (layer.setStyle) layer.setStyle({ interactive: false }); // Click-through
                if (layer.dragging) layer.dragging.disable();
            });
            setIsEditMode(false);
        } else {
            if (drawHandlerRef.current) drawHandlerRef.current.disable();
            resetMeasure();
            setActiveTool(null);
            if (isDeleteMode) toggleDeleteMode();

            // Enable interaction
            drawnItems.eachLayer((layer: any) => {
                if (layer.setStyle) layer.setStyle({ interactive: true });
                if (layer.dragging) layer.dragging.enable();
            });

            // @ts-ignore
            if (!editHandlerRef.current) {
                // @ts-ignore
                editHandlerRef.current = new L.EditToolbar.Edit(map, {
                    featureGroup: drawnItems,
                    selectedPathOptions: {
                        dashArray: '10, 10',
                        fill: true,
                        fillColor: '#fe57a1',
                        fillOpacity: 0.1,
                        maintainColor: false
                    }
                });
            }
            editHandlerRef.current.enable();
            setIsEditMode(true);
        }
    };

    const toggleDeleteMode = () => {
        if (!map || !drawnItems) return;

        if (isDeleteMode) {
            if (deleteHandlerRef.current) {
                deleteHandlerRef.current.save();
                deleteHandlerRef.current.disable();
            }
            setIsDeleteMode(false);
        } else {
            // Disable other tools
            resetMeasure();
            setActiveTool(null);
            if (isEditMode) toggleEditMode(); // Switch off edit mode

            // @ts-ignore
            if (!deleteHandlerRef.current) {
                // @ts-ignore
                deleteHandlerRef.current = new L.EditToolbar.Delete(map, {
                    featureGroup: drawnItems
                });
            }
            deleteHandlerRef.current.enable();
            setIsDeleteMode(true);
        }
    };

    // Handle Text
    useEffect(() => {
        if (activeTool !== 'text') {
            map.off('click', handleMapClickForText);
            L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');
            return;
        }
        L.DomUtil.addClass(map.getContainer(), 'crosshair-cursor');
        map.on('click', handleMapClickForText);
        return () => {
            map.off('click', handleMapClickForText);
            L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');
        };
    }, [activeTool, selectedColor, fontSize]);

    const handleMapClickForText = (e: any) => {
        if (!drawnItems) return;
        const icon = L.divIcon({
            className: 'canvas-text-marker',
            html: `<div class="text-annotation-wrapper"><div class="text-annotation" contenteditable="true" style="color:${selectedColor};font-size:${fontSize}px;font-weight:bold">Click Edit</div></div>`
        });
        const marker = L.marker(e.latlng, { icon, draggable: true }).addTo(drawnItems);
        setActiveTool(null);
    };

    // Created Event
    useEffect(() => {
        const handleCreated = (e: any) => {
            if (drawnItems) drawnItems.addLayer(e.layer);
            setActiveTool(null);
        };
        // @ts-ignore
        map.on(L.Draw.Event.CREATED, handleCreated);
        // @ts-ignore
        return () => { map.off(L.Draw.Event.CREATED, handleCreated); };
    }, [map, drawnItems]);

    // Update Font Size of existing selection (basic implementation)
    useEffect(() => {
        // This is tricky without 'selection' concept. 
        // We will just assume this setting applies to NEXT text.
        // Or if in edit mode, maybe update all text? No that's bad.
    }, [fontSize]);

    const clearCanvas = async () => {
        if (!drawnItems) return;

        // Only clear UNSAVED items
        const layers = drawnItems.getLayers();
        layers.forEach((layer: any) => {
            if (!layer.zoneId) {
                drawnItems.removeLayer(layer);
            }
        });
        resetMeasure();
    };

    // Explicit Delete Saved Zone
    const clearAllZones = async () => {
        if (!window.confirm("Delete ALL saved zones globally?")) return;
        // This would require a delete-all endpoint or loop
        // implementing single delete for now via Edit Mode context menu would be better but complex.
        // For now, simpler: Clear UNSAVED.
        // To delete SAVED: User must use Edit Mode -> Delete.
        // But Leaflet Draw Delete removes from map. We need to catch that event and call API.
    };

    // Catch Deletion
    useEffect(() => {
        const handleDeleted = (e: any) => {
            const layers = e.layers;
            layers.eachLayer((layer: any) => {
                if (layer.zoneId) {
                    deleteMapZone(layer.zoneId);
                }
            });
        };
        // @ts-ignore
        map.on(L.Draw.Event.DELETED, handleDeleted);
        // @ts-ignore
        return () => { map.off(L.Draw.Event.DELETED, handleDeleted); };
    }, [map]);


    if (isCollapsed) {
        return (
            <div className="canvas-toolbar collapsed" onClick={() => setIsCollapsed(false)}>
                <ChevronLeft size={20} />
            </div>
        );
    }

    return (
        <div className="canvas-toolbar">
            <div className="tool-group collapse-group">
                <button className="canvas-btn collapse-btn" onClick={() => setIsCollapsed(true)}>
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="tool-group">
                <button className={`canvas-btn ${activeTool === 'pointer' ? 'active' : ''}`} onClick={() => setActiveTool('pointer')} title="Pointer">
                    <MousePointer2 size={20} />
                </button>
                <button className={`canvas-btn ${activeTool === 'polyline' ? 'active' : ''}`} onClick={() => startDrawing('polyline')} title="Line">
                    <Pencil size={20} />
                </button>
                <button className={`canvas-btn ${activeTool === 'polygon' ? 'active' : ''}`} onClick={() => startDrawing('polygon')} title="Shape">
                    <Square size={20} />
                </button>
                <button className={`canvas-btn ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => startDrawing('circle')} title="Circle">
                    <Circle size={20} />
                </button>
                <button className={`canvas-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} title="Text">
                    <Type size={20} />
                </button>
                <button className={`canvas-btn ${isEditMode ? 'active' : ''}`} onClick={toggleEditMode} title="Edit Mode (Drag/Resize)">
                    <Maximize size={20} />
                </button>
            </div>

            <div className="tool-group">
                <button className={`canvas-btn ${activeTool === 'measure' ? 'active' : ''}`} onClick={() => startDrawing('measure')} title="Measure">
                    <Ruler size={20} />
                </button>
            </div>

            <div className="tool-group">
                <div className="color-picker">
                    {COLORS.map(c => (
                        <div key={c} className={`color-dot ${selectedColor === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => setSelectedColor(c)} />
                    ))}
                </div>
            </div>

            <div className="tool-group">
                <div className="size-control">
                    <span className="size-label">Size: {fontSize}px</span>
                    <input type="range" min="10" max="60" className="size-slider" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} />
                </div>
            </div>

            <div className="tool-group">
                <button className="canvas-btn" onClick={handleSave} title="Save Zones Globally" style={{ color: '#10B981' }}>
                    {saving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />}
                </button>
                <button
                    className={`canvas-btn ${isDeleteMode ? 'active' : ''}`}
                    onClick={toggleDeleteMode}
                    title="Delete Mode (Click shapes to remove)"
                    style={{ color: '#EF4444' }}
                >
                    <Trash2 size={20} />
                </button>
                <button
                    className="canvas-btn"
                    onClick={clearCanvas}
                    title="Clear Unsaved Only"
                    style={{ color: '#F59E0B' }}
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>
    );
};

export default CanvasTools;
