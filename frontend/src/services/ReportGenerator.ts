import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Device } from '../types/device';

/**
 * ReportGenerator
 * 
 * Provides professional PDF generation for device profiles.
 */
export const generateDeviceReport = (device: Device) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // 1. Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Survey Report: Infrastructure Mapping', 15, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 15, 30);

    // 2. Device Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(`${device.device_type || 'Device'} - ${device.survey_id}`, 15, 55);

    // 3. Technical Specifications Table
    const tableData = [
        ['Zone', device.zone || 'N/A'],
        ['Location', device.street || device.location || 'N/A'],
        ['Status', device.status || 'N/A'],
        ['GPS Coordinates', `${device.lat || '—'}, ${device.lng || '—'}`],
        ['Motor HP', device.motor_hp || '—'],
        ['Pipe Size', device.pipe_size_inch || device.pipe_size || '—'],
        ['Daily Usage', device.daily_usage_hrs || device.usage_hours || '—'],
        ['Connected Houses', device.houses_connected || device.houses || '—'],
        ['Capacity', device.capacity || '—'],
        ['Height', device.tank_height_m ? `${device.tank_height_m}m` : '—'],
        ['Material', device.material || '—'],
        ['Lid Access', device.lid_access || '—'],
    ];

    autoTable(doc, {
        startY: 65,
        head: [['Field', 'Value']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10, cellPadding: 3 }
    });

    // 4. Notes Section
    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    doc.setFontSize(14);
    doc.text('Field Notes', 15, finalY + 15);
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(device.notes || 'No notes recorded for this device.', 180);
    doc.text(splitNotes, 15, finalY + 25);

    // 5. Footer
    const pageCount = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Rudraram Survey Dashboard | Confidential', 105, 285, { align: 'center' });
    }

    doc.save(`Survey_Report_${device.survey_id}.pdf`);
};
