import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const DrawingTools = () => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems,
                remove: true
            },
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true
                },
                polyline: {
                    metric: true
                },
                rect: false,
                circle: false,
                marker: true,
                circlemarker: false
            }
        });

        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);

            // Potential callback for saving the GeoJSON
            const geojson = layer.toGeoJSON();
            console.log('Shape drawn:', geojson);
        });

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED);
        };
    }, [map]);

    return null;
};

export default DrawingTools;
