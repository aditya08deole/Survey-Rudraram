import L from 'leaflet';
import './MapComponent.css';

// Get color based on device type and status
const getMarkerColor = (type, status) => {
  // Borewells: Use status
  if (type === 'Borewell') {
    if (!status) return '#39FF14'; // Default Green

    const s = status.toLowerCase();

    // Working -> Neon Green
    if (s.includes('working') && !s.includes('not')) return '#39FF14';

    // Not Working -> Red
    if (s.includes('not') || s.includes('non') || s.includes('failed')) return '#FF3131';

    // On Repair, etc -> Grey
    return '#808080';
  }

  // Sumps: Always Blue
  if (type === 'Sump') {
    return '#007BFF'; // Blue
  }

  // OHSR/OHT: Always Orange
  if (type === 'OHSR' || type === 'OHT' || type === 'overhead_tank') {
    return '#FFA500'; // Orange
  }

  // Default fallback
  return '#39FF14';
};

export const getDeviceIcon = (type, status) => {
  const color = getMarkerColor(type, status);
  let shapeClass = '';
  // Borewell -> Circle, Sump -> Square (Icon), OHSR -> Square (Icon)
  // Per request: "keep the circle for borewell... for sumps keep blue colour and its icon for ohsr keep orange colour and its icon"
  // We'll use specific classes to render these icons via CSS or SVG-in-HTML

  const deviceType = type || 'Unknown';

  if (deviceType === 'Borewell') {
    // Circle with status color
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 16px;
        height: 16px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  }

  if (deviceType === 'Sump') {
    // Blue Icon (Using a simple SVG shape for 'drop' or 'square')
    // We'll use a Square with a 'S' or just solid
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 18px;
        height: 18px;
        background-color: ${color};
        border-radius: 4px; /* Square/Box for Sump */
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;
      ">S</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11]
    });
  }

  if (deviceType === 'OHSR' || deviceType === 'OHT') {
    // Orange Icon (Cylinder/Triangle representation or just O)
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%); /* Triangle for OHSR height */
        border-bottom: 2px solid white; 
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  }

  // Fallback
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 50%;"></div>`,
    iconSize: [14, 14]
  });
};
