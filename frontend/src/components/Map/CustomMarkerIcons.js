/**
 * Custom Device Marker Icons
 * 
 * Professional icons with subtle neon effects:
 * - Borewell: Circle with "B" - Green(working), Red(not working), Grey(other)
 * - Sump: Square with "S" - Blue
 * - OHSR: Triangle with "O" - Orange
 * 
 * @version 2.1.0 (Neon Enhanced)
 */

import L from 'leaflet';

// ============================================================
// COLOR CONFIGURATION
// ============================================================

// Status colors (enhanced neon)
const STATUS_NEON = {
  WORKING: {
    color: '#39FF14',      // Neon Green
    glow: '0 0 4px #39FF14, 0 0 10px #39FF14, 0 0 15px rgba(57, 255, 20, 0.5)',
  },
  NOT_WORKING: {
    color: '#FF073A',      // Neon Red
    glow: '0 0 4px #FF073A, 0 0 10px #FF073A, 0 0 15px rgba(255, 7, 58, 0.5)',
  },
  OTHER: {
    color: '#9CA3AF',      // Grey
    glow: 'none',
  },
};

// Device type base colors with neon tints
const TYPE_COLORS = {
  SUMP: '#00D4FF',    // Cyan Neon
  OHSR: '#FF6B00',    // Neon Orange
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get neon config based on status
 */
const getStatusConfig = (status) => {
  if (!status) return STATUS_NEON.OTHER;

  const s = status.toLowerCase();

  if (s.includes('working') && !s.includes('not')) {
    return STATUS_NEON.WORKING;
  }
  if (s.includes('not') || s.includes('non') || s.includes('failed')) {
    return STATUS_NEON.NOT_WORKING;
  }

  return STATUS_NEON.OTHER;
};

/**
 * Detect device type from string
 */
const detectDeviceType = (type) => {
  if (!type) return 'BOREWELL';

  const t = type.toUpperCase();

  if (t.includes('SUMP')) return 'SUMP';
  if (t.includes('OHSR') || t.includes('OHT') || t.includes('OVERHEAD') || t.includes('TANK')) return 'OHSR';

  return 'BOREWELL';
};

// ============================================================
// ICON CREATORS
// ============================================================

/**
 * Create BOREWELL icon - Circle with "B"
 */
const createBorewellIcon = (status, label) => {
  const config = getStatusConfig(status);

  const iconHtml = `
        <div style="
            width: 24px;
            height: 24px;
            background: ${config.color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: ${config.glow};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            color: ${status?.toLowerCase().includes('working') ? '#000' : '#FFF'}; /* Better contrast */
            font-family: 'Arial', sans-serif;
            text-shadow: 0 0 2px rgba(255,255,255,0.5);
        ">B</div>
    `;

  return createDivIcon(iconHtml, label, 24);
};

/**
 * Create SUMP icon - Square with "S"
 */
const createSumpIcon = (status, label) => {
  const config = getStatusConfig(status);
  const baseColor = TYPE_COLORS.SUMP;

  // Blue base with status indicator
  const iconHtml = `
        <div style="
            width: 24px;
            height: 24px;
            background: ${baseColor};
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: 0 0 8px ${baseColor}, 0 0 15px rgba(0, 212, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            color: #000;
            font-family: 'Arial', sans-serif;
            position: relative;
        ">
            S
            <div style="
                position: absolute;
                bottom: -4px;
                right: -4px;
                width: 10px;
                height: 10px;
                background: ${config.color};
                border: 1.5px solid white;
                border-radius: 50%;
                box-shadow: ${config.glow};
            "></div>
        </div>
    `;

  return createDivIcon(iconHtml, label, 24);
};

/**
 * Create OHSR icon - Triangle with "O"
 */
const createOhsrIcon = (status, label) => {
  const config = getStatusConfig(status);
  const baseColor = TYPE_COLORS.OHSR;

  // SVG Triangle with "O" in center
  const iconHtml = `
        <div style="position: relative; width: 28px; height: 26px;">
            <svg width="28" height="26" viewBox="0 0 28 26">
                <defs>
                    <filter id="neon-orange" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${baseColor}" flood-opacity="0.8"/>
                    </filter>
                </defs>
                <polygon 
                    points="14,2 26,24 2,24" 
                    fill="${baseColor}" 
                    stroke="white" 
                    stroke-width="2"
                    filter="url(#neon-orange)"
                />
                <text 
                    x="14" 
                    y="20" 
                    text-anchor="middle" 
                    fill="#000" 
                    font-size="12" 
                    font-weight="800"
                    font-family="Arial, sans-serif"
                >O</text>
            </svg>
            <div style="
                position: absolute;
                bottom: -2px;
                right: 0px;
                width: 10px;
                height: 10px;
                background: ${config.color};
                border: 1.5px solid white;
                border-radius: 50%;
                box-shadow: ${config.glow};
            "></div>
        </div>
    `;

  return createDivIcon(iconHtml, label, 28, 26);
};

/**
 * Create Leaflet divIcon wrapper
 */
const createDivIcon = (iconHtml, label, width, height = null) => {
  const h = height || width;

  const labelHtml = label ? `
        <div style="
            position: absolute;
            top: ${h + 6}px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            color: #FFF;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            pointer-events: none;
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 100;
        ">${label}</div>
    ` : '';

  return L.divIcon({
    className: 'device-marker-icon',
    html: `
            <div style="
                position: relative;
                width: ${width}px;
                height: ${h}px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                ${iconHtml}
                ${labelHtml}
            </div>
        `,
    iconSize: [width, h + (label ? 25 : 0)],
    iconAnchor: [width / 2, h / 2],
    popupAnchor: [0, -h / 2]
  });
};

// ============================================================
// MAIN EXPORT
// ============================================================

/**
 * Get appropriate device icon
 * 
 * @param {string} type - Device type (Borewell, Sump, OHSR)
 * @param {string} status - Device status (Working, Not Working, etc.)
 * @param {string} label - Label to display below marker
 * @returns {L.DivIcon} Leaflet div icon
 */
export const getDeviceIcon = (type, status, label) => {
  const deviceType = detectDeviceType(type);

  switch (deviceType) {
    case 'SUMP':
      return createSumpIcon(status, label);
    case 'OHSR':
      return createOhsrIcon(status, label);
    case 'BOREWELL':
    default:
      return createBorewellIcon(status, label);
  }
};

export default getDeviceIcon;
