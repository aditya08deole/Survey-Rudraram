/**
 * WORLD-CLASS CUSTOM MARKER ICONS
 * 
 * Features:
 * - High-Fidelity SVG Filters (Multi-layer Gaussian Blur)
 * - Pulsating Neon Cores
 * - Geometric Tech-Shapes
 * - Adaptive Status Glow
 * 
 * @version 7.0.0
 */

import L from 'leaflet';

// Professional Color Palette
const COLORS = {
  GREEN: '#00FF9C', // Neon Emerald
  RED: '#FF3D68',   // Vibrant Ruby
  CYAN: '#00F0FF',  // Laser Cyan
  ORANGE: '#FFB300', // Solar Gold
  DARK: '#1A1A1A',
  WHITE: '#FFFFFF'
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

/**
 * SHARED SVG FILTERS
 * Defines the professional neon glow layers.
 */
const SVG_FILTERS = `
<svg width="0" height="0" style="position:absolute;">
  <defs>
    <!-- Basic Neon Glow -->
    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
      <feOffset dx="0" dy="0" result="offsetblur" />
      <feFlood flood-color="currentColor" result="color" />
      <feComposite in="color" in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <!-- Heavy Pulse Glow -->
    <filter id="heavy-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
      <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>
`;

// Inject filters into document once
if (!document.getElementById('leaflet-neon-filters')) {
  const filterDiv = document.createElement('div');
  filterDiv.id = 'leaflet-neon-filters';
  filterDiv.innerHTML = SVG_FILTERS;
  document.body.appendChild(filterDiv);
}

// ---------------------------------------------------------
// ICON CREATORS
// ---------------------------------------------------------

/**
 * Borewell: Geometric Circle with Pulsating Core
 */
const createBorewellIcon = (status) => {
  const working = isWorking(status);
  const color = working ? COLORS.GREEN : COLORS.RED;

  return `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 32 32" style="color: ${color}; overflow: visible;">
                <!-- Outer Ring -->
                <circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="2.5" style="filter: url(#neon-glow); opacity: 0.8;" />
                <!-- Inner Base -->
                <circle cx="16" cy="16" r="10" fill="white" fill-opacity="0.9" stroke="${color}" stroke-width="0.5" />
                <!-- Core Energy Dot -->
                <circle cx="16" cy="16" r="5" fill="${color}" style="filter: url(#heavy-glow);">
                    ${working ? '<animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />' : ''}
                </circle>
            </svg>
        </div>
    `;
};

/**
 * Sump: Tech-Square with Cyan Laser Border
 */
const createSumpIcon = (status) => {
  const working = isWorking(status);
  const color = working ? COLORS.CYAN : COLORS.RED;

  return `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <svg width="30" height="30" viewBox="0 0 30 30" style="color: ${color}; overflow: visible;">
                <!-- Glass Background -->
                <rect x="5" y="5" width="20" height="20" rx="4" fill="white" fill-opacity="0.9" stroke="${color}" stroke-width="1" />
                <!-- Neon Frame -->
                <rect x="5" y="5" width="20" height="20" rx="4" fill="none" stroke="${color}" stroke-width="2.5" style="filter: url(#neon-glow);" />
                <!-- Inner Rect -->
                <rect x="11" y="11" width="8" height="8" rx="1.5" fill="${color}" />
            </svg>
        </div>
    `;
};

/**
 * OHSR: High-Fidelity Tech Triangle
 */
const createOhsrIcon = (status) => {
  const working = isWorking(status);
  const color = working ? COLORS.ORANGE : COLORS.RED;

  return `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <svg width="36" height="36" viewBox="0 0 36 36" style="color: ${color}; overflow: visible;">
                <!-- Triangle Outer -->
                <path d="M18 4L4 28H32L18 4Z" fill="white" fill-opacity="0.9" stroke="${color}" stroke-width="3" style="filter: url(#neon-glow);" />
                <!-- Center "O" Ring -->
                <circle cx="18" cy="19" r="5" fill="none" stroke="${color}" stroke-width="2.5" />
                <!-- Status Jewel -->
                <circle cx="18" cy="19" r="2" fill="${color}" />
            </svg>
        </div>
    `;
};

/**
 * Minimalist Professional Label
 */
const createLabel = (label) => {
  if (!label) return '';
  return `
        <div style="
            position: absolute; top: 34px; left: 50%; transform: translateX(-50%);
            background: rgba(26, 26, 26, 0.85);
            backdrop-filter: blur(4px);
            color: #FFFFFF; 
            padding: 2px 8px; 
            border-radius: 4px;
            font-size: 10px; 
            font-weight: 700;
            letter-spacing: 0.05em;
            white-space: nowrap; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            border: 0.5px solid rgba(255,255,255,0.2);
        ">${label.toString().toUpperCase()}</div>
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
    className: 'professional-marker',
    html: `<div style="position:relative; display:flex; justify-content:center; align-items:center;">
                    ${html}
                    ${createLabel(label)}
               </div>`,
    iconSize: [36, 40],
    iconAnchor: [18, 20],
    popupAnchor: [0, -20]
  });
};
