import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points, options = {} }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heatLayer = L.heatLayer(points, {
            radius: options.radius || 25,
            blur: options.blur || 15,
            maxZoom: options.maxZoom || 30,
            max: options.max || 1.0,
            gradient: options.gradient || {
                0.0: 'blue',
                0.5: 'lime',
                0.7: 'yellow',
                1.0: 'red'
            },
            ...options
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points, options]);

    return null;
};

export default HeatmapLayer;
