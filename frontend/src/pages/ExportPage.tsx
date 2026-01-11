/**
 * Excel Export Page
 * 
 * Multi-sheet Excel workbook export with professional formatting
 */

import React, { useState, useEffect, useMemo } from 'react';
import { fetchSurveyData } from '../services/apiService';
import { useDeviceFilters } from '../hooks/useDeviceFilters';
import { FileSpreadsheet, Download, Check, Layers } from 'lucide-react';
import type { Device, ApiResponse } from '../types/device';
import * as XLSX from 'xlsx';
import LoadingAnimation from '../components/LoadingAnimation';
import './ExportPage.css';

type SheetType = 'All' | 'Borewell' | 'Sump' | 'OHSR';

export function ExportPage() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSheet, setActiveSheet] = useState<SheetType>('All');
    const [exporting, setExporting] = useState(false);

    const { filteredDevices } = useDeviceFilters(allDevices);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const response = await fetchSurveyData() as unknown as ApiResponse;
        if (response.success) setAllDevices(response.devices);
        setLoading(false);
    };

    // Sheet data
    const sheetData = useMemo(() => {
        if (activeSheet === 'All') return filteredDevices;
        return filteredDevices.filter(d => d.device_type === activeSheet);
    }, [filteredDevices, activeSheet]);

    const sheets = useMemo(() => ({
        'All': filteredDevices,
        'Borewell': filteredDevices.filter(d => d.device_type === 'Borewell'),
        'Sump': filteredDevices.filter(d => d.device_type === 'Sump'),
        'OHSR': filteredDevices.filter(d => d.device_type === 'OHSR' || d.device_type === 'OHT')
    }), [filteredDevices]);

    const handleExport = () => {
        setExporting(true);

        try {
            const wb = XLSX.utils.book_new();

            // Create sheets for each device type
            Object.entries(sheets).forEach(([sheetName, devices]) => {
                if (devices.length === 0) return;

                const data = devices.map(d => ({
                    'Survey Code': d.survey_id || '',
                    'Zone': d.zone || '',
                    'Street / Landmark': d.street || '',
                    'Device Type': d.device_type || '',
                    'Status': d.status || '',
                    'Latitude': d.lat || '',
                    'Longitude': d.lng || '',
                    'Connected Houses': d.houses || 0,
                    'Daily Usage (hrs)': d.usage_hours || '',
                    'Pipe Size (inch)': d.pipe_size || '',
                    'Motor HP': d.motor_hp || '',
                    'Notes': d.notes || ''
                }));

                const ws = XLSX.utils.json_to_sheet(data);

                // Set column widths
                ws['!cols'] = [
                    { wch: 15 }, // Survey Code
                    { wch: 20 }, // Zone
                    { wch: 30 }, // Street
                    { wch: 12 }, // Type
                    { wch: 12 }, // Status
                    { wch: 12 }, // Lat
                    { wch: 12 }, // Lng
                    { wch: 12 }, // Houses
                    { wch: 12 }, // Usage
                    { wch: 12 }, // Pipe
                    { wch: 10 }, // Motor
                    { wch: 40 }  // Notes
                ];

                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `rudraram-survey-${timestamp}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);

            setTimeout(() => setExporting(false), 1000);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data');
            setExporting(false);
        }
    };

    if (loading) {
        return <LoadingAnimation fullScreen message="Loading export data..." />;
    }

    return (
        <div className="export-page">
            <div className="export-header">
                <div className="export-title">
                    <FileSpreadsheet size={40} />
                    <div>
                        <h1>Excel Export</h1>
                        <p>Multi-sheet workbook with formatted data</p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="btn-export-main"
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <div className="spinner" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            Export to Excel
                        </>
                    )}
                </button>
            </div>

            {/* Sheet Tabs */}
            <div className="sheet-tabs">
                {(['All', 'Borewell', 'Sump', 'OHSR'] as SheetType[]).map(sheet => (
                    <button
                        key={sheet}
                        onClick={() => setActiveSheet(sheet)}
                        className={`sheet-tab ${activeSheet === sheet ? 'active' : ''}`}
                    >
                        <Layers size={16} />
                        {sheet}
                        <span className="sheet-count">{sheets[sheet].length}</span>
                    </button>
                ))}
            </div>

            {/* Preview Table */}
            <div className="export-preview">
                <div className="preview-header">
                    <h3>Preview: {activeSheet} Sheet</h3>
                    <span className="preview-count">{sheetData.length} devices</span>
                </div>

                <div className="preview-table-container">
                    <table className="preview-table">
                        <thead>
                            <tr>
                                <th>Survey Code</th>
                                <th>Zone</th>
                                <th>Street</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Lat</th>
                                <th>Lng</th>
                                <th>Houses</th>
                                <th>Usage</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sheetData.slice(0, 10).map((device, idx) => (
                                <tr key={idx}>
                                    <td>{device.survey_id}</td>
                                    <td>{device.zone}</td>
                                    <td>{device.street || '—'}</td>
                                    <td>{device.device_type}</td>
                                    <td>
                                        <span className={`status-badge status-${device.status?.toLowerCase().replace(' ', '-')}`}>
                                            {device.status}
                                        </span>
                                    </td>
                                    <td>{device.lat?.toFixed(6) || '—'}</td>
                                    <td>{device.lng?.toFixed(6) || '—'}</td>
                                    <td>{device.houses || 0}</td>
                                    <td>{device.usage_hours || '—'}</td>
                                    <td className="notes-cell">{device.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sheetData.length > 10 && (
                        <div className="preview-more">
                            + {sheetData.length - 10} more devices...
                        </div>
                    )}
                </div>
            </div>

            {/* Export Info */}
            <div className="export-info">
                <h3>Export Information</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <Check size={16} />
                        <span>Multi-sheet workbook (All, Borewell, Sump, OHSR)</span>
                    </div>
                    <div className="info-item">
                        <Check size={16} />
                        <span>Formatted columns with proper widths</span>
                    </div>
                    <div className="info-item">
                        <Check size={16} />
                        <span>Includes all device data and GPS coordinates</span>
                    </div>
                    <div className="info-item">
                        <Check size={16} />
                        <span>Timestamp in filename for version control</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportPage;
