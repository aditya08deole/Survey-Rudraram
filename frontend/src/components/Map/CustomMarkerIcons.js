/**
 * REFINED MARKER ICONS (Javascript Version)
 * 
 * Logic:
 * - WORKING -> Mild Neon Glow + Pulse Animation
 * - NOT WORKING / REPAIR -> Normal Flat Color (No Glow)
 * - Labels: Black Text / White Background
 * - Size: Slightly Reduced
 * 
 * @version 4.1.0
 */

import L from 'leaflet';

// ===================================
// CONFIGURATION
// ===================================

const COLORS = {
  GREEN: '#22C55E',  // Working
  RED: '#EF4444',    // Not Working
  BLUE: '#3B82F6',   // Sump Base
  ORANGE: '#F97316', // OHSR Base
  GREY: '#6B7280'    // Other
};

// Reduced Glow - Only for Working status
const GLOW_EFFECT = `0 0 8px rgba(34, 197, 94, 0.6), 0 0 4px white`;

// ===================================
// HELPERS
// ===================================

const getStatusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('working') && !s.includes('not')) return COLORS.GREEN;
  if (s.includes('not') || s.includes('non') || s.includes('failed')) return COLORS.RED;
  return COLORS.GREY;
};

const isWorking = (status) => {
  const s = (status || '').toLowerCase();
  return s.includes('working') && !s.includes('not');
};

const getDeviceType = (type) => {
  const t = (type || '').toUpperCase();
  if (t.includes('SUMP')) return 'SUMP';
  if (t.includes('OHSR') || t.includes('OHT')) return 'OHSR';
  return 'BOREWELL';
};

// ===================================
// ICON FACTORY
// ===================================

const createBorewellIcon = (color, glow) => {
  // Circle with "B" - smaller size (22px)
  const boxShadow = glow ? GLOW_EFFECT : '0 1px 3px rgba(0,0,0,0.3)';
  const pulseClass = glow ? 'pulse-animation' : '';

  return `
        <div class="${pulseClass}" style="
            width: 22px; height: 22px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: ${boxShadow};
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 700; font-family: sans-serif; font-size: 11px;
        ">B</div>
    `;
};

const createSumpIcon = (statusColor, glow) => {
  // Square with "S" - Blue Base (20px)
  const boxShadow = glow ? `0 0 8px ${COLORS.BLUE}` : '0 1px 3px rgba(0,0,0,0.3)';
  // Note: Sump glow is usually on the status dot or main body? 
  // Plan said "Devices breathe". Let's breathe the main body if working?
  // User logic: "sumps and ohsr will be neon but decrese...".
  // I will apply pulse to the main body if glow is active.
  const pulseClass = glow ? 'pulse-animation' : '';

  return `
        <div class="${pulseClass}" style="
            width: 20px; height: 20px;
            background: ${COLORS.BLUE};
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: ${boxShadow};
            display: flex; align-items: center; justify-content: center;
            position: relative;
            color: white; font-weight: 700; font-family: sans-serif; font-size: 11px;
        ">
            S
            <div style="
                position: absolute; bottom: -3px; right: -3px;
                width: 8px; height: 8px;
                background: ${statusColor};
                border-radius: 50%; border: 1.5px solid white;
            "></div>
        </div>
    `;
};

const createOhsrIcon = (statusColor, glow) => {
  // Triangle with "O" - Orange Base
  const filter = glow ? `drop-shadow(0 0 4px ${COLORS.ORANGE})` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))';
  // Triangle pulse is tricky with drop-shadow. 
  // I'll skip class for triangle or try to animate filter?
  // ProfessionalMap.css defines @keyframes for filter? Yes neonPulseOrange.
  // I'll add class if glow.
  const pulseClass = glow ? 'pulse-animation-orange' : '';

  return `
        <div class="${pulseClass}" style="position: relative; width: 24px; height: 22px; display:flex; justify-content:center;">
             <div style="
                width: 0; height: 0;
                border-left: 12px solid transparent;
                border-right: 12px solid transparent;
                border-bottom: 22px solid ${COLORS.ORANGE};
                filter: ${filter};
             "></div>
             <div style="
                position: absolute; top: 10px;
                color: white; font-weight: 700; font-size: 9px; font-family: sans-serif;
             ">O</div>
             <div style="
                position: absolute; bottom: -2px; right: -2px;
                width: 8px; height: 8px;
                background: ${statusColor};
                border-radius: 50%; border: 1.5px solid white;
            "></div>
        </div>
    `;
};

// UPDATED LABEL: White Background, Black Text
const createLabel = (label) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.9);
            color: black; 
            padding: 1px 4px; 
            border-radius: 3px;
            font-size: 10px; 
            font-weight: 600;
            white-space: nowrap; 
            pointer-events: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            border: 1px solid rgba(0,0,0,0.1);
            z-index: 1000;
        ">${label}</div>
    `;
};

// ===================================
// EXPORT
// ===================================

export const getDeviceIcon = (type, status, label) => {
  const deviceType = getDeviceType(type);
  const statusColor = getStatusColor(status);
  const glow = isWorking(status); // Only working devices glow

  let html = '';

  switch (deviceType) {
    case 'SUMP':
      html = createSumpIcon(statusColor, glow);
      break;
    case 'OHSR':
      html = createOhsrIcon(statusColor, glow);
      break;
    case 'BOREWELL':
    default:
      html = createBorewellIcon(statusColor, glow);
      break;
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative; width:24px; height:24px; display:flex; justify-content:center; align-items:center;">
                ${html}
                ${createLabel(label)}
               </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};
