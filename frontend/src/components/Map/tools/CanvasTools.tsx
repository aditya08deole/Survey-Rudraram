import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
    Pencil, Type, Square, Circle, Trash2,
    Ruler, MousePointer2, Maximize, ChevronRight, ChevronLeft
} from 'lucide-react';
import './CanvasTools.css';

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
    const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed state

    const drawHandlerRef = useRef<any>(null);
    const editHandlerRef = useRef<any>(null);
    const measurePointsRef = useRef<L.LatLng[]>([]);
    const measureLineRef = useRef<L.Polyline | null>(null);
    const measureTooltipRef = useRef<L.Marker | null>(null);

    // Initialize FeatureGroup for drawn items
    useEffect(() => {
        if (!map) return;

        const items = new L.FeatureGroup();
        // @ts-ignore
        map.addLayer(items);
        setDrawnItems(items);

        return () => {
            // @ts-ignore
            map.removeLayer(items);
        };
    }, [map]);

    // Handle standard Drawing Tools
    const startDrawing = (type: string) => {
        if (drawHandlerRef.current) {
            drawHandlerRef.current.disable();
        }

        // Reset manual measure if active
        resetMeasure();

        setActiveTool(type);

        if (type === 'measure') {
            // Manual Measure Mode
            L.DomUtil.addClass(map.getContainer(), 'crosshair-cursor');
            map.on('click', handleMeasureClick);
            map.on('dblclick', finishMeasure);
            return;
        }

        // Helper to options
        const options = {
            shapeOptions: {
                color: selectedColor,
                weight: 4,
                opacity: 0.7,
                fillOpacity: 0.2
            },
            icon: new L.DivIcon({
                className: 'custom-marker',
                html: `<div style="background:${selectedColor};width:10px;height:10px;border-radius:50%"></div>`
            })
        };

        // @ts-ignore
        const LeafletDraw = L.Draw;

        if (type === 'polygon') {
            drawHandlerRef.current = new LeafletDraw.Polygon(map, options);
        } else if (type === 'polyline') {
            drawHandlerRef.current = new LeafletDraw.Polyline(map, options);
        } else if (type === 'rectangle') {
            drawHandlerRef.current = new LeafletDraw.Rectangle(map, options);
        } else if (type === 'circle') {
            drawHandlerRef.current = new LeafletDraw.Circle(map, options);
        } else if (type === 'marker') {
            drawHandlerRef.current = new LeafletDraw.Marker(map, options);
        }

        if (drawHandlerRef.current) {
            drawHandlerRef.current.enable();
        }
    };

    // MANUAL MEASUREMENT LOGIC
    const handleMeasureClick = (e: any) => {
        const latlng = e.latlng;
        measurePointsRef.current.push(latlng);

        // Draw/Update Line
        if (!measureLineRef.current) {
            measureLineRef.current = L.polyline(measurePointsRef.current, { color: selectedColor, dashArray: '5, 5' }).addTo(map);
        } else {
            measureLineRef.current.setLatLngs(measurePointsRef.current);
        }

        // Calculate total distance
        let totalDistance = 0;
        for (let i = 0; i < measurePointsRef.current.length - 1; i++) {
            totalDistance += measurePointsRef.current[i].distanceTo(measurePointsRef.current[i + 1]);
        }

        // Show Tooltip
        const distanceText = totalDistance > 1000
            ? `${(totalDistance / 1000).toFixed(2)} km`
            : `${totalDistance.toFixed(1)} m`;

        if (measureTooltipRef.current) {
            measureTooltipRef.current.setLatLng(latlng);
            measureTooltipRef.current.setIcon(L.divIcon({
                className: 'measure-tooltip',
                html: `<div class="measure-tag">${distanceText}</div>`
            }));
        } else {
            measureTooltipRef.current = L.marker(latlng, {
                icon: L.divIcon({
                    className: 'measure-tooltip',
                    html: `<div class="measure-tag">${distanceText}</div>`
                })
            }).addTo(map);
        }
    };

    const finishMeasure = () => {
        if (measurePointsRef.current.length > 1 && drawnItems && measureLineRef.current) {
            // Persist the line
            const line = L.polyline(measurePointsRef.current, { color: selectedColor, weight: 3 }).addTo(drawnItems);

            // Add a permanent label at the end
            if (measureTooltipRef.current) {
                const label = L.marker(measurePointsRef.current[measurePointsRef.current.length - 1], {
                    icon: measureTooltipRef.current.getIcon()
                }).addTo(drawnItems);
            }
        }
        resetMeasure();
    };

    const resetMeasure = () => {
        map.off('click', handleMeasureClick);
        map.off('dblclick', finishMeasure);
        L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');

        if (measureLineRef.current) {
            map.removeLayer(measureLineRef.current);
            measureLineRef.current = null;
        }
        if (measureTooltipRef.current) {
            map.removeLayer(measureTooltipRef.current);
            measureTooltipRef.current = null;
        }
        measurePointsRef.current = [];
    };


    // Toggle Edit Mode (Drag/Resize)
    const toggleEditMode = () => {
        if (!map || !drawnItems) return;

        if (isEditMode) {
            // Save & Disable
            if (editHandlerRef.current) {
                editHandlerRef.current.save();
                editHandlerRef.current.disable();
            }
            setIsEditMode(false);
        } else {
            // Enable
            // Turn off other tools
            if (drawHandlerRef.current) drawHandlerRef.current.disable();
            resetMeasure();
            setActiveTool(null);

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

    // Handle Text Tool
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
    }, [activeTool, selectedColor, fontSize, drawnItems]);

    const handleMapClickForText = (e: any) => {
        if (!drawnItems) return;

        const textIcon = L.divIcon({
            className: 'canvas-text-marker',
            html: `
                <div class="text-annotation-wrapper">
                    <div 
                        class="text-annotation" 
                        contenteditable="true" 
                        style="color: ${selectedColor}; font-size: ${fontSize}px; font-weight: bold;"
                    >Click to Edit</div>
                </div>
            `
        });

        const marker = L.marker(e.latlng, {
            icon: textIcon,
            draggable: true
        });

        drawnItems.addLayer(marker);
        setActiveTool(null);
    };

    // Leaflet Draw Created Event
    useEffect(() => {
        const handleCreated = (e: any) => {
            const layer = e.layer;
            if (drawnItems) {
                drawnItems.addLayer(layer);
            }
            setActiveTool(null);
        };

        // @ts-ignore
        const createdEvent = L.Draw.Event.CREATED;
        map.on(createdEvent, handleCreated);
        return () => {
            map.off(createdEvent, handleCreated);
        };
    }, [map, drawnItems]);

    // Clear All
    const clearCanvas = () => {
        if (drawnItems) drawnItems.clearLayers();
        resetMeasure();
    };

    if (isCollapsed) {
        return (
            <div className="canvas-toolbar collapsed" onClick={() => setIsCollapsed(false)}>
                <ChevronLeft size={20} />
            </div>
        );
    }

    return (
        <div className="canvas-toolbar">
            {/* Collapse Button */}
            <div className="tool-group collapse-group">
                <button
                    className="canvas-btn collapse-btn"
                    onClick={() => setIsCollapsed(true)}
                    title="Collapse Toolbar"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Shapes */}
            <div className="tool-group">
                <button
                    className={`canvas-btn ${activeTool === 'pointer' ? 'active' : ''}`}
                    onClick={() => setActiveTool('pointer')}
                    title="Select / Move"
                >
                    <MousePointer2 size={20} />
                </button>
                <button
                    className={`canvas-btn ${activeTool === 'polyline' ? 'active' : ''}`}
                    onClick={() => startDrawing('polyline')}
                    title="Draw Line"
                >
                    <Pencil size={20} />
                </button>
                <button
                    className={`canvas-btn ${activeTool === 'polygon' ? 'active' : ''}`}
                    onClick={() => startDrawing('polygon')}
                    title="Draw Shape"
                >
                    <Square size={20} />
                </button>
                <button
                    className={`canvas-btn ${activeTool === 'circle' ? 'active' : ''}`}
                    onClick={() => startDrawing('circle')}
                    title="Draw Circle"
                >
                    <Circle size={20} />
                </button>
                <button
                    className={`canvas-btn ${activeTool === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTool('text')}
                    title="Add Text"
                >
                    <Type size={20} />
                </button>
                <button
                    className={`canvas-btn ${isEditMode ? 'active' : ''}`}
                    onClick={toggleEditMode}
                    title={isEditMode ? "Finish Editing" : "Edit Shapes (Drag/Resize)"}
                >
                    <Maximize size={20} />
                </button>
            </div>

            {/* Measurement */}
            <div className="tool-group">
                <button
                    className={`canvas-btn ${activeTool === 'measure' ? 'active' : ''}`}
                    onClick={() => startDrawing('measure')}
                    title="Measure Distance (Click Points, Dbl Click to End)"
                >
                    <Ruler size={20} />
                </button>
            </div>

            {/* Styles */}
            <div className="tool-group">
                <div className="color-picker">
                    {COLORS.map(c => (
                        <div
                            key={c}
                            className={`color-dot ${selectedColor === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setSelectedColor(c)}
                        />
                    ))}
                </div>
            </div>

            <div className="tool-group">
                <div className="size-control">
                    <span className="size-label">Size: {fontSize}px</span>
                    <input
                        type="range"
                        min="10"
                        max="60"
                        className="size-slider"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="tool-group">
                <button
                    className="canvas-btn"
                    onClick={clearCanvas}
                    title="Clear All Drawings"
                    style={{ color: '#EF4444' }}
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};

export default CanvasTools;
