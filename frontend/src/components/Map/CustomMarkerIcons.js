import L from 'leaflet';

// Realistic 3D SVG Icons based on provided HTML
const createCustomIcon = (deviceType, status) => {
  const colors = {
    Working: '#10b981', // Green
    'Non-Working': '#ef4444', // Red
    'Not Work': '#ef4444', // Red (alias)
    Failed: '#6b7280', // Grey
    default: '#3b82f6' // Blue fallback
  };

  const glowColors = {
    Working: 'rgba(16, 185, 129, 0.8)',
    'Non-Working': 'rgba(239, 68, 68, 0.8)',
    'Not Work': 'rgba(239, 68, 68, 0.8)',
    Failed: 'rgba(107, 116, 128, 0.6)',
    default: 'rgba(59, 130, 246, 0.6)'
  };

  const color = colors[status] || colors.default;
  const glowColor = glowColors[status] || glowColors.default;

  let svgIcon = '';

  if (deviceType === 'Borewell') {
    // 3D Borewell Pump Icon
    svgIcon = `
      <svg viewBox="0 0 420 620" xmlns="http://www.w3.org/2000/svg" width="50" height="74">
        <defs>
          <linearGradient id="metal-${status}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e8f1f8"/>
            <stop offset="40%" stop-color="#b7c6d4"/>
            <stop offset="70%" stop-color="#7f93a7"/>
            <stop offset="100%" stop-color="#465a6e"/>
          </linearGradient>
          <linearGradient id="darkMetal-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6f879b"/>
            <stop offset="100%" stop-color="#243849"/>
          </linearGradient>
          <linearGradient id="water-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color === '#10b981' ? '#9be7ff' : color}"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
        </defs>
        <circle cx="210" cy="50" r="28" fill="url(#metal-${status})" stroke="#1f2f3a" stroke-width="6"/>
        <rect x="190" y="50" width="40" height="110" rx="12" fill="url(#darkMetal-${status})" stroke="#1f2f3a" stroke-width="6"/>
        <path d="M210 130 C300 160, 340 220, 340 280" stroke="url(#metal-${status})" stroke-width="32" fill="none" stroke-linecap="round"/>
        <rect x="130" y="160" width="160" height="80" rx="18" fill="url(#metal-${status})" stroke="#1f2f3a" stroke-width="6"/>
        <path d="M130 200 C70 200, 70 240, 70 260 L70 280" stroke="url(#metal-${status})" stroke-width="30" fill="none" stroke-linecap="round"/>
        <rect x="160" y="240" width="100" height="260" rx="22" fill="url(#darkMetal-${status})" stroke="#1f2f3a" stroke-width="6"/>
        <ellipse cx="210" cy="530" rx="120" ry="36" fill="#2e3f50"/>
        <ellipse cx="210" cy="520" rx="95" ry="30" fill="#6f879b" stroke="#1f2f3a" stroke-width="6"/>
        <path d="M70 295 C60 330, 90 330, 70 370 C50 330, 80 330, 70 295 Z" fill="url(#water-${status})" stroke="#0a3b6f" stroke-width="4"/>
        <path d="M70 300 C65 325, 75 325, 70 355" stroke="rgba(255,255,255,0.6)" stroke-width="4" fill="none"/>
      </svg>
    `;
  } else if (deviceType === 'Sump') {
    // 3D Underground Sump Icon
    svgIcon = `
      <svg viewBox="0 0 620 450" xmlns="http://www.w3.org/2000/svg" width="69" height="50">
        <defs>
          <linearGradient id="water-sump-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color === '#10b981' ? '#b8ecff' : color}"/>
            <stop offset="60%" stop-color="${color}"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
          <linearGradient id="concrete-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#efd6b5"/>
            <stop offset="100%" stop-color="#b08b61"/>
          </linearGradient>
          <linearGradient id="wall-${status}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#f2f9ff"/>
            <stop offset="40%" stop-color="#cbe9ff"/>
            <stop offset="100%" stop-color="#96cfff"/>
          </linearGradient>
        </defs>
        <rect x="70" y="40" width="480" height="280" rx="34" fill="#2b2b2b"/>
        <rect x="100" y="70" width="420" height="230" rx="28" fill="url(#wall-${status})" stroke="#1f2f3a" stroke-width="6"/>
        <path d="M100 170 C140 150, 200 185, 260 170 C320 150, 380 185, 520 170 L520 300 L100 300 Z" fill="url(#water-sump-${status})" stroke="#0a3b6f" stroke-width="4"/>
        <path d="M100 165 C140 145, 200 180, 260 165 C320 145, 380 180, 520 165" stroke="rgba(255,255,255,0.7)" stroke-width="6" fill="none"/>
        <path d="M140 300 L480 300 L520 380 L100 380 Z" fill="url(#concrete-${status})" stroke="#6b4f32" stroke-width="6"/>
        <g fill="#7a5b3a">
          <circle cx="160" cy="350" r="6"/>
          <circle cx="210" cy="360" r="5"/>
          <circle cx="260" cy="340" r="6"/>
          <circle cx="320" cy="360" r="5"/>
          <circle cx="380" cy="350" r="6"/>
          <circle cx="430" cy="365" r="5"/>
        </g>
        <path d="M100 70 L520 70 L520 300" fill="rgba(0,0,0,0.1)"/>
      </svg>
    `;
  } else if (deviceType === 'OHSR' || deviceType === 'overhead_tank') {
    // 3D Water Tower Icon
    svgIcon = `
      <svg viewBox="0 0 512 720" xmlns="http://www.w3.org/2000/svg" width="36" height="50">
        <defs>
          <linearGradient id="glass-${status}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#eaf6ff"/>
            <stop offset="40%" stop-color="#c6e2ff"/>
            <stop offset="70%" stop-color="#a3c9f2"/>
            <stop offset="100%" stop-color="#7fb2e6"/>
          </linearGradient>
          <linearGradient id="water-tower-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color === '#10b981' ? '#8dd6ff' : color}"/>
            <stop offset="60%" stop-color="${color}"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
          <linearGradient id="steel-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5b7f9b"/>
            <stop offset="50%" stop-color="#3b5c75"/>
            <stop offset="100%" stop-color="#1b3449"/>
          </linearGradient>
          <linearGradient id="roof-${status}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f7490"/>
            <stop offset="100%" stop-color="#243f55"/>
          </linearGradient>
        </defs>
        <polygon points="256,40 70,170 442,170" fill="url(#roof-${status})"/>
        <polygon points="256,70 120,170 392,170" fill="#4f86ad"/>
        <rect x="120" y="170" width="272" height="210" rx="16" fill="url(#glass-${status})"/>
        <rect x="120" y="250" width="272" height="130" fill="url(#water-tower-${status})"/>
        <rect x="135" y="170" width="30" height="210" fill="rgba(255,255,255,0.35)"/>
        <rect x="180" y="170" width="8" height="210" fill="rgba(255,255,255,0.15)"/>
        <rect x="90" y="380" width="332" height="42" rx="14" fill="#1f4058"/>
        <rect x="110" y="420" width="292" height="20" rx="10" fill="#355f7d"/>
        <polygon points="155,440 230,440 205,700 125,700" fill="url(#steel-${status})"/>
        <polygon points="282,440 357,440 387,700 307,700" fill="url(#steel-${status})"/>
        <rect x="165" y="450" width="12" height="250" fill="#1f3b54"/>
        <rect x="340" y="450" width="12" height="250" fill="#1f3b54"/>
        <g stroke="#3f6d8f" stroke-width="18">
          <line x1="190" y1="470" x2="350" y2="630"/>
          <line x1="350" y1="470" x2="190" y2="630"/>
          <line x1="210" y1="520" x2="330" y2="700"/>
          <line x1="330" y1="520" x2="210" y2="700"/>
        </g>
        <polygon points="120,170 392,170 392,380" fill="rgba(0,0,0,0.08)"/>
      </svg>
    `;
  }

  const iconHtml = `
    <div class="custom-device-marker" style="
      filter: drop-shadow(0 0 8px ${glowColor}) 
              drop-shadow(0 0 16px ${glowColor})
              drop-shadow(0 0 24px ${glowColor});
      transition: all 0.3s ease;
    ">
      ${svgIcon}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-device-icon-svg',
    iconSize: [50, 74],
    iconAnchor: [25, 74],
    popupAnchor: [0, -74]
  });
};

export const getDeviceIcon = (deviceType, status) => {
  return createCustomIcon(deviceType, status);
};

export const deviceTypes = {
  BOREWELL: 'Borewell',
  SUMP: 'Sump',
  OHSR: 'OHSR',
  OVERHEAD_TANK: 'overhead_tank'
};

export const deviceStatuses = {
  WORKING: 'Working',
  NON_WORKING: 'Non-Working',
  NOT_WORK: 'Not Work',
  FAILED: 'Failed'
};
