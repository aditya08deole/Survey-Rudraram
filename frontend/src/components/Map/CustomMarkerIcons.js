import L from 'leaflet';
import './MapComponent.css';

// Type Colors (Fixed per legend)
const TYPE_COLORS = {
  BOREWELL: '#22C55E', // Green
  SUMP: '#3B82F6',     // Blue
  OHSR: '#F97316'      // Orange
};

// Status Colors (Fixed per legend)
const STATUS_COLORS = {
  WORKING: '#4ADE80',    // Light Green dot
  NOT_WORKING: '#EF4444', // Red dot
  REPAIR: '#9CA3AF'      // Grey dot
};

const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.REPAIR;
  const s = status.toLowerCase();
  if (s.includes('not') || s.includes('non') || s.includes('failed')) return STATUS_COLORS.NOT_WORKING;
  if (s.includes('working')) return STATUS_COLORS.WORKING;
  return STATUS_COLORS.REPAIR;
};

export const getDeviceIcon = (type, status, label) => {
  const statusColor = getStatusColor(status);
  const t = (type || '').toLowerCase();

  let mainHtml = '';
  // Default config
  let shapeColor = TYPE_COLORS.BOREWELL;

  // 1. Determine Shape and Main Color based on TYPE
  if (t.includes('sump')) {
    shapeColor = TYPE_COLORS.SUMP;
    // Blue Square with S
    mainHtml = `<div style="
        width: 20px;
        height: 20px;
        background-color: ${shapeColor};
        border-radius: 4px; 
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 800; font-family: sans-serif; font-size: 11px;
      ">S</div>`;
  }
  else if (t.includes('ohsr') || t.includes('oht') || t.includes('overhead')) {
    shapeColor = TYPE_COLORS.OHSR;
    // Orange Triangle
    mainHtml = `<div style="
        width: 0; 
        height: 0; 
        border-left: 11px solid transparent;
        border-right: 11px solid transparent;
        border-bottom: 22px solid ${shapeColor};
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        position: relative; top: -2px;
      "></div>`;
    // Note: Triangle using borders allows clean sharp edges. 
    // border-bottom color is the fill.
  }
  else {
    // Default: Borewell (Green Circle)
    shapeColor = TYPE_COLORS.BOREWELL;
    mainHtml = `<div style="
        width: 18px;
        height: 18px;
        background-color: ${shapeColor};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      "></div>`;
  }

  // 2. Status Badge (The dot)
  const badgeHtml = `<div style="
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background-color: ${statusColor};
      border: 1.5px solid white;
      border-radius: 50%;
      z-index: 10;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    "></div>`;

  // 3. Label HTML
  const labelHtml = label ?
    `<div style="
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      pointer-events: none;
      z-index: 5;
      border: 1px solid rgba(0,0,0,0.1);
    ">${label}</div>` : '';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
             ${mainHtml}
             ${badgeHtml}
             ${labelHtml}
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};
