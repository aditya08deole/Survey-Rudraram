/**
 * CUSTOM MARKER ICONS
 * 
 * Borewell: Green/Red Circle + 'B'
 * Sump: Blue Square + 'S'  
 * OHSR: Orange Triangle + 'O'
 * 
 * @version 6.0.0
 */

import L from 'leaflet';

// Colors
const COLORS = {
  GREEN: '#22C55E',
  RED: '#EF4444',
  BLUE: '#00F0FF',
  ORANGE: '#FF9E00',
  GREY: '#6B7280'
};

// Glow Effects
const GLOW = {
  GREEN: `0 0 12px ${COLORS.GREEN}, 0 0 6px white`,
  BLUE: `0 0 12px ${COLORS.BLUE}, 0 0 6px white`,
  ORANGE: `0 0 12px ${COLORS.ORANGE}, 0 0 6px white`
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

// Borewell: Green/Red Circle + Letter B
const createBorewellIcon = (status) => {
  const working = isWorking(status);
  const color = working ? COLORS.GREEN : COLORS.RED;
  const glow = working ? GLOW.GREEN : 'none';

  return `
        <div style="
            width: 28px; height: 28px;
            background: white;
            border: 2px solid ${color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: ${glow}, 0 2px 4px rgba(0,0,0,0.2);
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 14px;
            color: ${color};
        ">
            B
        </div>
    `;
};

// Sump: Blue Square + Letter S
const createSumpIcon = (status) => {
  return `
        <div style="
            width: 26px; height: 26px;
            background: white;
            border: 2px solid ${COLORS.BLUE};
            border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: ${GLOW.BLUE}, 0 2px 4px rgba(0,0,0,0.2);
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 14px;
            color: ${COLORS.BLUE};
        ">
            S
        </div>
    `;
};

// OHSR: Orange Triangle + Letter O
const createOhsrIcon = (status) => {
  const working = isWorking(status);
  const glow = working ? `drop-shadow(0 0 8px ${COLORS.ORANGE})` : 'none';

  return `
        <div style="position: relative; width: 32px; height: 30px;">
            <div style="
                width: 0; height: 0;
                border-left: 16px solid transparent;
                border-right: 16px solid transparent;
                border-bottom: 28px solid ${COLORS.ORANGE};
                filter: ${glow};
            "></div>
            <div style="
                position: absolute; 
                top: 10px; left: 50%;
                transform: translateX(-50%);
                display: flex; align-items: center; justify-content: center;
            ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 22H22L12 2Z"></path>
                    <path d="M12 6L12 18"></path>
                </svg>
            </div>
        </div>
    `;
};

// Label (Unchanged)
const createLabel = (label) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 32px; left: 50%; transform: translateX(-50%);
            background: white;
            color: black; 
            padding: 2px 6px; 
            border-radius: 4px;
            font-size: 10px; 
            font-weight: 700;
            white-space: nowrap; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${label}</div>
    `;
};

export const getDeviceIcon = (type, status, label) => {
  const deviceType = getDeviceType(type);
  let html = '';

  switch (deviceType) {
    case 'SUMP':
      html = createSumpIcon(status);
      break;
    case 'OHSR':
      html = createOhsrIcon(status);
      break;
    default:
      html = createBorewellIcon(status);
      break;
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative; display:flex; justify-content:center; align-items:center;">
                ${html}
                ${createLabel(label)}
               </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};
