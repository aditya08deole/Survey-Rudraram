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

export const getDeviceIcon = (type, status, label) => {
  const color = getMarkerColor(type, status);

  // Borewell -> Circle, Sump -> Square (Icon), OHSR -> Square (Icon)

  const deviceType = type || 'Unknown';

  // Label HTML (Text below icon)
  const labelHtml = label ?
    `<div style="
      position: absolute;
      top: 22px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #000;
      white-space: nowrap;
      text-shadow: 0 0 2px white;
      pointer-events: none;
      border: 1px solid rgba(0,0,0,0.2);
      z-index: 1000;
    ">${label}</div>` : '';

  let iconHtml = '';

  if (deviceType === 'Borewell') {
    // Circle
    iconHtml = `<div style="
        width: 16px;
        height: 16px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>`;
  }
  else if (deviceType === 'Sump') {
    // Blue Box
    iconHtml = `<div style="
        width: 18px;
        height: 18px;
        background-color: ${color};
        border-radius: 4px; 
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;
      ">S</div>`;
  }
  else if (deviceType === 'OHSR' || deviceType === 'OHT') {
    // Orange Shape
    iconHtml = `<div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%); 
        border-bottom: 2px solid white; 
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>`;
  }
  else {
    // Fallback
    iconHtml = `<div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 50%;"></div>`;
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="position: relative;">${iconHtml}${labelHtml}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};
