import React from 'react';
import { Layers } from 'lucide-react';
import './MapLegend.css';

const MapLegend = () => {
    return (
        <div className="map-legend">
            <div className="legend-header">
                <Layers size={14} />
                <span>Map Legend</span>
            </div>

            <div className="legend-section">
                <div className="legend-title">Device Types</div>
                <div className="legend-item">
                    <span className="legend-symbol borewell"></span>
                    <span>Borewell</span>
                </div>
                <div className="legend-item">
                    <span className="legend-symbol sump">S</span>
                    <span>Sump</span>
                </div>
                <div className="legend-item">
                    <span className="legend-symbol ohsr"></span>
                    <span>OHSR / Tank</span>
                </div>
            </div>

            <div className="legend-divider"></div>

            <div className="legend-section">
                <div className="legend-title">Status</div>
                <div className="legend-item">
                    <span className="legend-dot status-working"></span>
                    <span>Working</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot status-not-working"></span>
                    <span>Not Working</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot status-repair"></span>
                    <span>On Repair / Other</span>
                </div>
            </div>
        </div>
    );
};

export default MapLegend;
