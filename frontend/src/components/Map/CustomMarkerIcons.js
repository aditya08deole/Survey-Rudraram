import L from 'leaflet';

export const getStatusColor = (status, type) => {
  if (type === 'BOREWELL') {
    return status?.toLowerCase().includes('working') ? '#10b981' : '#ef4444';
  }
  if (type === 'SUMP') return '#3b82f6';
  if (type === 'OHSR') return '#f59e0b';
  return '#64748b';
};

export const createMarkerIcon = (device) => {
  const type = device.device_type?.toUpperCase() || 'BOREWELL';
  const status = device.status || 'Unknown';
  const color = getStatusColor(status, type);
  const letter = type.charAt(0);
  const isWorking = status.toLowerCase().includes('working');

  let shapeHtml = '';
  if (type === 'SUMP') {
    shapeHtml = `<rect x="6" y="6" width="28" height="28" rx="4" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5" />`;
  } else if (type === 'OHSR') {
    shapeHtml = `<path d="M20 5 L35 32 L5 32 Z" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />`;
  } else {
    shapeHtml = `<circle cx="20" cy="20" r="15" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5" />`;
  }

  const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="glow-${device.survey_id}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <g filter="url(#glow-${device.survey_id})">
                ${shapeHtml}
                <text x="20" y="25" font-family="Inter, sans-serif" font-weight="900" font-size="14" fill="${color}" text-anchor="middle">
                    ${letter}
                </text>
            </g>
            ${isWorking && type === 'BOREWELL' ? `
                <circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="1" opacity="0.5">
                    <animate attributeName="r" from="16" to="22" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
            ` : ''}
        </svg>
    `;

  return L.divIcon({
    className: 'custom-infra-marker',
    html: svg,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

export const getDeviceIcon = createMarkerIcon;

const CustomMarkerIcons = {
  createMarkerIcon,
  getDeviceIcon,
  getStatusColor
};

export default CustomMarkerIcons;
