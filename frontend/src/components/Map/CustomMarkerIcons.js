import L from 'leaflet';
import './MapComponent.css';

// Get status color for markers
const getStatusColor = (status) => {
  if (!status) return '#39FF14'; // Default Neon Green

  const s = status.toLowerCase();

  // Working -> Neon Green
  if (s.includes('working') && !s.includes('not')) return '#39FF14';

  // Not Working -> Red
  if (s.includes('not') || s.includes('non')) return '#FF3131';

  // Failed/Repair -> Grey
  if (s.includes('failed') || s.includes('repair')) return '#808080';

  return '#39FF14'; // Default
};

export const getDeviceIcon = (type, status) => {
  const color = getStatusColor(status);
  let shapeClass = '';

  // Determine shape class based on type
  if (type === 'Borewell') shapeClass = 'marker-circle';
  else if (type === 'Sump') shapeClass = 'marker-triangle';
  else if (type === 'OHSR' || type === 'OHT' || type === 'overhead_tank') shapeClass = 'marker-square';
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
