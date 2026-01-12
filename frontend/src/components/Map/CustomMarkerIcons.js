/**
 * REFINED MARKER ICONS (Strict User Request)
 * 
 * Logic:
 * - BOREWELL: Circle + 'B'. Color depends on status (Green=Working, Red=Failed).
 * - SUMP: Square + 'S'. Always Blue. Neon if Working.
 * - OHSR: Triangle + 'O'. Always Orange. Neon if Working.
 * - NO STATUS DOTS (Removed as per feedback).
 * 
 * @version 5.0.0
 */

import L from 'leaflet';

// ===================================
// CONFIGURATION
// ===================================

const COLORS = {
  GREEN: '#22C55E',  // Working Borewell
  RED: '#EF4444',    // Failed Borewell/Device
  BLUE: '#00F0FF',   // Sump (Cyan/Blue)
  ORANGE: '#FF9E00', // OHSR
  GREY: '#6B7280'    // Unknown
};

// Glow Strings
const GLOW = {
  GREEN: `0 0 10px ${COLORS.GREEN}, 0 0 5px white`,
  BLUE: `0 0 10px ${COLORS.BLUE}, 0 0 5px white`,
  ORANGE: `drop-shadow(0 0 6px ${COLORS.ORANGE}) drop-shadow(0 0 3px white)`
};

// ===================================
// HELPERS
// ===================================

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

const createBorewellIcon = (status, label) => {
  const working = isWorking(status);
  const color = working ? COLORS.GREEN : COLORS.RED;
  const boxShadow = working ? GLOW.GREEN : '0 1px 3px rgba(0,0,0,0.5)';
  const pulseClass = working ? 'pulse-animation' : '';

  return `
        <div class="${pulseClass}" style="
            width: 22px; height: 22px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: ${boxShadow};
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-family: sans-serif; font-size: 11px;
            letter-spacing: -0.5px;
        ">B</div>
    `;
};

const createSumpIcon = (status, label) => {
  const working = isWorking(status);
  const color = COLORS.BLUE; // Always Blue as requested
  const boxShadow = working ? GLOW.BLUE : '0 1px 3px rgba(0,0,0,0.5)';
  const pulseClass = working ? 'pulse-animation' : '';

  // Square shape
  return `
        <div class="${pulseClass}" style="
            width: 20px; height: 20px;
            background: ${color};
            border-radius: 3px; /* Slightly rounded square */
            border: 2px solid white;
            box-shadow: ${boxShadow};
            display: flex; align-items: center; justify-content: center;
            color: black; /* Black text on Cyan pops better, or white? User asked for neon blue. */
            font-weight: 800; font-family: sans-serif; font-size: 11px;
        ">S</div>
    `;
};

const createOhsrIcon = (status, label) => {
  const working = isWorking(status);
  const color = COLORS.ORANGE;
  const filter = working ? GLOW.ORANGE : 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))';
  const pulseClass = working ? 'pulse-animation-orange' : '';

  // Triangle shape constructed via borders
  return `
        <div class="${pulseClass}" style="position: relative; width: 26px; height: 24px; display:flex; justify-content:center;">
             <div style="
                width: 0; height: 0;
                border-left: 13px solid transparent;
                border-right: 13px solid transparent;
                border-bottom: 24px solid ${color};
                filter: ${filter};
             "></div>
             <div style="
                position: absolute; top: 11px;
                color: white; font-weight: 800; font-size: 10px; font-family: sans-serif;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
             ">O</div>
        </div>
    `;
};

// Label: White bg, Black text
const createLabel = (label) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 28px; left: 50%; transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            color: black; 
            padding: 1px 5px; 
            border-radius: 4px;
            font-size: 10px; 
            font-weight: 700;
            white-space: nowrap; 
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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

  let html = '';

  switch (deviceType) {
    case 'SUMP':
      html = createSumpIcon(status, label);
      break;
    case 'OHSR':
      html = createOhsrIcon(status, label);
      break;
    case 'BOREWELL':
    default:
      html = createBorewellIcon(status, label);
      break;
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative; width:26px; height:26px; display:flex; justify-content:center; align-items:center;">
                ${html}
                ${createLabel(label)}
               </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};
