import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-measure';
import 'leaflet-measure/dist/leaflet-measure.css';

const MeasurementTool = () => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const measureControl = new L.Control.Measure({
            position: 'topright',
            primaryLengthUnit: 'meters',
            secondaryLengthUnit: 'kilometers',
            primaryAreaUnit: 'sqmeters',
            secondaryAreaUnit: 'hectares',
            activeColor: '#3b82f6',
            completedColor: '#2563eb'
        });

        map.addControl(measureControl);

        return () => {
            map.removeControl(measureControl);
        };
    }, [map]);

    return null;
};

export default MeasurementTool;
