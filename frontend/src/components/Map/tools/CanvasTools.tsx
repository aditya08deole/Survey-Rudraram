import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-measure';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-measure/dist/leaflet-measure.css';
import {
    Pencil, Type, Square, Circle, Trash2,
    Ruler, MousePointer2
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
    const drawHandlerRef = useRef<any>(null);
    const measureControlRef = useRef<any>(null);

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

        setActiveTool(type);

        if (type === 'measure') {
            if (!measureControlRef.current) {
                // @ts-ignore
                const measureControl = new L.Control.Measure({
                    position: 'topleft',
                    primaryLengthUnit: 'meters',
                    activeColor: selectedColor,
                    completedColor: selectedColor
                });
                measureControlRef.current = measureControl;
                // @ts-ignore
                map.addControl(measureControl);
            }
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
        return () => map.off(createdEvent, handleCreated);
    }, [map, drawnItems]);

    // Clear All
    const clearCanvas = () => {
        if (drawnItems) drawnItems.clearLayers();
    };

    return (
        <div className="canvas-toolbar">
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
            </div>

            {/* Measurement */}
            <div className="tool-group">
                <button
                    className={`canvas-btn ${activeTool === 'measure' ? 'active' : ''}`}
                    onClick={() => startDrawing('measure')}
                    title="Measure Distance"
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
