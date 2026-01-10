import L from 'leaflet';

// Custom icon factory for device types with status-based colors
const createCustomIcon = (deviceType, status) => {
  const colors = {
    Working: '#10b981', // Green
    'Non-Working': '#ef4444', // Red
    Failed: '#6b7280', // Grey
    default: '#3b82f6' // Blue fallback
  };

  const color = colors[status] || colors.default;

  const icons = {
    Borewell: `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M16 8 L16 24 M12 12 L20 12 M12 16 L20 16 M12 20 L20 20" 
              stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    Sump: `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="24" height="18" rx="2" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M8 14 L24 14 M8 18 L24 18 M8 22 L24 22" 
              stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    OHSR: `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="6" width="12" height="20" rx="1" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="14" y="26" width="4" height="4" fill="${color}" stroke="white" stroke-width="1"/>
        <circle cx="16" cy="12" r="2" fill="white"/>
        <rect x="13" y="16" width="6" height="1.5" fill="white"/>
        <rect x="13" y="19" width="6" height="1.5" fill="white"/>
      </svg>
    `
  };

  const iconSvg = icons[deviceType] || icons.Borewell;

  return L.divIcon({
    html: iconSvg,
    className: 'custom-device-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export const getDeviceIcon = (deviceType, status) => {
  return createCustomIcon(deviceType, status);
};

export const deviceTypes = {
  BOREWELL: 'Borewell',
  SUMP: 'Sump',
  OHSR: 'OHSR'
};

export const deviceStatuses = {
  WORKING: 'Working',
  NON_WORKING: 'Non-Working',
  FAILED: 'Failed'
};
