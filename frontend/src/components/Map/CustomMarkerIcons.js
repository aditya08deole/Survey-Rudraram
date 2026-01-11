import L from 'leaflet';
import './MapComponent.css';

// Get color based on device type and status
const getMarkerColor = (type, status) => {
  // Borewells: Use Excel status column
  if (type === 'Borewell') {
    if (!status) return '#39FF14'; // Default Green if no status

    const s = status.toLowerCase();

    // Working -> Neon Green
    if (s.includes('working') && !s.includes('not')) return '#39FF14';

    // Not Working -> Red
    if (s.includes('not') || s.includes('non')) return '#FF3131';

    // On Repair, Failed, or anything else -> Grey
    return '#808080';
  }

  // Sumps: Always Light Blue (no status column)
  if (type === 'Sump') {
    return '#87CEEB'; // Light Blue
  }

  // OHSR/OHT: Always Orange (no status column)
  if (type === 'OHSR' || type === 'OHT' || type === 'overhead_tank') {
    return '#FFA500'; // Orange
  }

  // Default fallback
  return '#39FF14';
};

export const getDeviceIcon = (type, status) => {
  const color = getMarkerColor(type, status);
  let shapeClass = '';

  // Determine shape class based on type
  // Handle both old and new field names for compatibility
  const deviceType = type || 'Unknown';

  if (deviceType === 'Borewell') shapeClass = 'marker-circle';
  else if (deviceType === 'Sump') shapeClass = 'marker-triangle';
  else if (deviceType === 'OHSR' || deviceType === 'OHT' || deviceType === 'overhead_tank') shapeClass = 'marker-square';
  else shapeClass = 'marker-circle'; // Default

  // Create DivIcon with CSS styling
  // For triangle, we use border-bottom-color to set color
  // For circle/square, we use background-color

  let style = '';
  if (shapeClass === 'marker-triangle') {
    style = `border-bottom-color: ${color};`;
  } else {
    style = `background-color: ${color}; box-shadow: 0 0 6px ${color};`;
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="${shapeClass}" style="${style}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};
