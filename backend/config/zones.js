/**
 * Zone Configuration
 * 
 * Defines the three administrative zones of Rudraram Village.
 * This is the authoritative zone definition - DO NOT MODIFY without migration.
 */

const ZONES = {
  'SC Colony': {
    id: 'Z1',
    name: 'SC Colony',
    population: 3000,
    color: '#3B82F6', // Blue
    description: 'SC Colony residential & water infrastructure zone',
    bounds: null // Can be set with polygon coordinates later
  },
  'Village': {
    id: 'Z2',
    name: 'Village',
    population: 5000,
    color: '#22C55E', // Green
    description: 'Core village area infrastructure zone',
    bounds: null
  },
  'Waddera': {
    id: 'Z3',
    name: 'Waddera',
    population: 4000,
    color: '#F97316', // Orange
    description: 'Waddera Colony residential infrastructure zone',
    bounds: null
  }
};

// Valid zone names for validation
const VALID_ZONES = Object.keys(ZONES);

// Get zone by name
const getZone = (zoneName) => {
  return ZONES[zoneName] || null;
};

// Get all zones
const getAllZones = () => {
  return Object.values(ZONES);
};

// Validate zone name
const isValidZone = (zoneName) => {
  return VALID_ZONES.includes(zoneName);
};

module.exports = {
  ZONES,
  VALID_ZONES,
  getZone,
  getAllZones,
  isValidZone
};
