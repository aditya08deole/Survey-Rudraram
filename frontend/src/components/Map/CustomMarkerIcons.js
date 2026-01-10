import L from 'leaflet';

// Custom icon factory using uploaded images with status-based glow
const createCustomIcon = (deviceType, status) => {
  const colors = {
    Working: '#10b981', // Green
    'Non-Working': '#ef4444', // Red  
    Failed: '#6b7280', // Grey
    'Not Work': '#ef4444', // Red (alias)
    default: '#3b82f6' // Blue fallback
  };

  const glowColors = {
    Working: 'rgba(16, 185, 129, 0.8)',
    'Non-Working': 'rgba(239, 68, 68, 0.8)',
    Failed: 'rgba(107, 116, 128, 0.6)',
    'Not Work': 'rgba(239, 68, 68, 0.8)',
    default: 'rgba(59, 130, 246, 0.6)'
  };

  const color = colors[status] || colors.default;
  const glowColor = glowColors[status] || glowColors.default;

  // Map device types to icon paths
  const iconPaths = {
    Borewell: '/assets/icons/borewell.png',
    Sump: '/assets/icons/sump.png',
    OHSR: '/assets/icons/ohsr.png',
    OHT: '/assets/icons/ohsr.png' // Use same icon for OHT
  };

  const iconPath = iconPaths[deviceType] || iconPaths.Borewell;

  // Create HTML with image and glow effect
  const iconHtml = `
    <div class="custom-device-marker" style="
      filter: drop-shadow(0 0 12px ${glowColor}) 
              drop-shadow(0 0 24px ${glowColor})
              drop-shadow(0 0 36px ${glowColor});
      transition: all 0.3s ease;
    ">
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle, ${color}40, ${color}10);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid ${color};
        box-shadow: 0 0 20px ${glowColor}, inset 0 0 10px ${glowColor};
      ">
        <img 
          src="${iconPath}" 
          alt="${deviceType}"
          style="
            width: 28px;
            height: 28px;
            object-fit: contain;
            filter: brightness(1.2);
          "
        />
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-device-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export const getDeviceIcon = (deviceType, status) => {
  return createCustomIcon(deviceType, status);
};

export const deviceTypes = {
  BOREWELL: 'Borewell',
  SUMP: 'Sump',
  OHSR: 'OHSR',
  OHT: 'OHT'
};

export const deviceStatuses = {
  WORKING: 'Working',
  NON_WORKING: 'Non-Working',
  FAILED: 'Failed'
};
