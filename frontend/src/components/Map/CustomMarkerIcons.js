import L from 'leaflet';

export const getStatusColor = (status, type) => {
  const t = type?.toUpperCase();
  if (t === 'BOREWELL') {
    return status?.toLowerCase().includes('working') ? '#10b981' : '#ef4444';
  }
  if (t === 'SUMP' || t === 'SUMPS') return '#3b82f6';
  if (t === 'OHSR' || t === 'OHT' || t === 'OVERHEAD_TANK') return '#f59e0b';
  return '#64748b';
};

export const createMarkerIcon = (device) => {
  const type = device.device_type?.toUpperCase() || 'BOREWELL';
  const status = device.status || 'Unknown';
  const color = getStatusColor(status, type);

  let shapeHtml = '';
  if (type === 'SUMP' || type === 'SUMPS') {
    shapeHtml = `<rect x="10" y="10" width="20" height="20" fill="${color}" stroke="white" stroke-width="2" />`;
  } else if (type === 'OHSR' || type === 'OHT' || type === 'OVERHEAD_TANK') {
    shapeHtml = `<path d="M20 8 L32 30 L8 30 Z" fill="${color}" stroke="white" stroke-width="2" />`;
  } else {
    shapeHtml = `<circle cx="20" cy="20" r="12" fill="${color}" stroke="white" stroke-width="2" />`;
  }

  const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            ${shapeHtml}
        </svg>
    `;

  return L.divIcon({
    className: 'simple-infra-marker',
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
