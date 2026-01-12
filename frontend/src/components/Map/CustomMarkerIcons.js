/**
 * ULTRA NEON MARKER ICONS
 * 
 * High-intensity neon glow effects for maximum visibility
 * Shapes: Cylinder (Borewell), Cube (Sump), Pyramid (OHSR) represented 2D
 * 
 * @version 3.0.0
 */

import L from 'leaflet';

// ===================================
// NEON PALETTE
// ===================================
const NEON = {
  GREEN: '#39FF14',
  RED: '#FF073A',
  BLUE: '#00F0FF',
  ORANGE: '#FF9E00',
  GREY: '#A0A0A0'
};

const GLOW = {
  STRONG: (color: string) => `0 0 10px ${color}, 0 0 20px ${color}, inset 0 0 5px rgba(255,255,255,0.8)`,
  SOFT: (color: string) => `0 0 8px ${color}, 0 0 12px ${color}`
};

// ===================================
// HELPERS
// ===================================

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('working') && !s.includes('not')) return NEON.GREEN;
  if (s.includes('not') || s.includes('non') || s.includes('failed')) return NEON.RED;
  return NEON.GREY;
};

const getDeviceType = (type: string) => {
  const t = (type || '').toUpperCase();
  if (t.includes('SUMP')) return 'SUMP';
  if (t.includes('OHSR') || t.includes('OHT')) return 'OHSR';
  return 'BOREWELL';
};

// ===================================
// ICON FACTORY
// ===================================

const createBorewellIcon = (color: string, label: string) => {
  // Circle with "B"
  return `
        <div style="
            width: 26px; height: 26px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: ${GLOW.STRONG(color)};
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-family: monospace; font-size: 14px;
            text-shadow: 0 1px 2px black;
        ">B</div>
    `;
};

const createSumpIcon = (label: string, statusColor: string) => {
  // Square with "S" - Blue Base
  const base = NEON.BLUE;
  return `
        <div style="
            width: 24px; height: 24px;
            background: ${base};
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: ${GLOW.STRONG(base)};
            display: flex; align-items: center; justify-content: center;
            position: relative;
            color: white; font-weight: 800; font-family: monospace; font-size: 14px;
            text-shadow: 0 1px 2px black;
        ">
            S
            <div style="
                position: absolute; bottom: -4px; right: -4px;
                width: 10px; height: 10px;
                background: ${statusColor};
                border-radius: 50%; border: 1px solid white;
                box-shadow: ${GLOW.SOFT(statusColor)};
            "></div>
        </div>
    `;
};

const createOhsrIcon = (label: string, statusColor: string) => {
  // Triangle with "O" - Orange Base
  const base = NEON.ORANGE;
  return `
        <div style="position: relative; width: 30px; height: 28px; display:flex; justify-content:center;">
             <div style="
                width: 0; height: 0;
                border-left: 15px solid transparent;
                border-right: 15px solid transparent;
                border-bottom: 26px solid ${base};
                filter: drop-shadow(0 0 8px ${base});
             "></div>
             <div style="
                position: absolute; top: 12px;
                color: white; font-weight: 800; font-size: 11px;
                text-shadow: 0 1px 2px black;
             ">O</div>
             <div style="
                position: absolute; bottom: -2px; right: 0;
                width: 10px; height: 10px;
                background: ${statusColor};
                border-radius: 50%; border: 1px solid white;
                box-shadow: ${GLOW.SOFT(statusColor)};
            "></div>
        </div>
    `;
};

const createLabel = (label: string) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white; padding: 2px 6px; border-radius: 4px;
            font-size: 10px; white-space: nowrap; pointer-events: none;
            backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);
        ">${label}</div>
    `;
};

// ===================================
// EXPORT
// ===================================

export const getDeviceIcon = (type: string, status: string, label: string) => {
  const deviceType = getDeviceType(type);
  const statusColor = getStatusColor(status);
  let html = '';

  switch (deviceType) {
    case 'SUMP':
      html = createSumpIcon(label, statusColor);
      break;
    case 'OHSR':
      html = createOhsrIcon(label, statusColor);
      break;
    case 'BOREWELL':
    default:
      html = createBorewellIcon(statusColor, label);
      break;
  }

  return L.divIcon({
    className: 'neon-marker',
    html: `<div style="position:relative; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">
                ${html}
                ${createLabel(label)}
               </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};
