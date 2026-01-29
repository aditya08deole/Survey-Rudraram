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

// Borewell: Circle with B
const createBorewellIcon = (status) => {
  const working = isWorking(status);
  const color = working ? COLORS.GREEN : COLORS.RED;
  const glow = working ? GLOW.GREEN : 'none';

  return `
        <div style="
            width: 24px; height: 24px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: ${glow};
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-size: 12px;
            font-family: Arial, sans-serif;
        ">B</div>
    `;
};

// Sump: Square with S
const createSumpIcon = (status) => {
  const working = isWorking(status);
  const glow = working ? GLOW.BLUE : 'none';

  return `
        <div style="
            width: 22px; height: 22px;
            background: ${COLORS.BLUE};
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: ${glow};
            display: flex; align-items: center; justify-content: center;
            color: #000; font-weight: 800; font-size: 12px;
            font-family: Arial, sans-serif;
        ">S</div>
    `;
};

// OHSR: Orange Triangle with O
const createOhsrIcon = (status) => {
  const working = isWorking(status);
  const glow = working ? `drop-shadow(0 0 8px ${COLORS.ORANGE})` : 'none';

  return `
        <div style="position: relative; width: 28px; height: 26px;">
            <div style="
                width: 0; height: 0;
                border-left: 14px solid transparent;
                border-right: 14px solid transparent;
                border-bottom: 26px solid ${COLORS.ORANGE};
                filter: ${glow};
            "></div>
            <div style="
                position: absolute; 
                top: 12px; left: 50%;
                transform: translateX(-50%);
                color: white; 
                font-weight: 800; 
                font-size: 11px;
                font-family: Arial, sans-serif;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            ">O</div>
        </div>
    `;
};

// Label
const createLabel = (label) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
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
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};
