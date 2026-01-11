import L from 'leaflet';
import './MapComponent.css';

// Type Colors (Fixed per legend)
const TYPE_COLORS = {
  BOREWELL: '#22C55E', // Green (fallback)
  SUMP: '#3B82F6',     // Blue
  OHSR: '#F97316'      // Orange
};

// Status Colors (Badge System)
const STATUS_COLORS = {
  WORKING: '#4ADE80',    // Light Green dot
  NOT_WORKING: '#EF4444', // Red dot
  REPAIR: '#9CA3AF'      // Grey dot
};

// Borewell Specific Neon Colors
const BOREWELL_COLORS = {
  WORKING: '#39FF14',    // Neon Green
  NOT_WORKING: '#FF3131', // Neon Red
  OTHER: '#808080'       // Grey
};

const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.REPAIR;
  const s = status.toLowerCase();
  if (s.includes('not') || s.includes('non') || s.includes('failed')) return STATUS_COLORS.NOT_WORKING;
  if (s.includes('working')) return STATUS_COLORS.WORKING;
  return STATUS_COLORS.REPAIR;
};

const getBorewellConfig = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('working') && !s.includes('not')) {
    return { color: BOREWELL_COLORS.WORKING, glow: true };
  }
  if (s.includes('not') || s.includes('non') || s.includes('failed')) {
    return { color: BOREWELL_COLORS.NOT_WORKING, glow: true };
  }
  return { color: BOREWELL_COLORS.OTHER, glow: false };
};

export const getDeviceIcon = (type, status, label) => {
  const t = (type || '').toLowerCase();

  // Label HTML (Text below icon) - Common for all
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


  // CASE 1: BOREWELL (Custom Neon Logic, No Badge)
  if (!t.includes('sump') && !t.includes('ohsr') && !t.includes('oht') && !t.includes('overhead')) {
    // It's a Borewell (or unknown/default)
    const { color, glow } = getBorewellConfig(status);
    const boxShadow = glow
      ? `0 0 6px ${color}, 0 0 10px ${color}, inset 0 0 4px rgba(255,255,255,0.5)`
      : `0 1px 3px rgba(0,0,0,0.3)`;

    const iconHtml = `<div style="
        width: 18px;
        height: 18px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: ${boxShadow};
      "></div>`;

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
               ${iconHtml}
               ${labelHtml}
             </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  }

  // CASE 2: SUMP / OHSR (Badge System)
  const statusColor = getStatusColor(status);
  let mainHtml = '';
  let shapeColor = TYPE_COLORS.SUMP; // Default to Sump color if falling through here but theoretically handled

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
  else {
    // OHSR / OHT
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
  }

  // Status Badge
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
