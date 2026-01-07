/**
 * Excel Schema Definition
 * 
 * LOCKED SCHEMA - This defines the exact column structure expected from Excel.
 * Any changes require careful migration planning.
 */

// Required columns that MUST be present in Excel
const REQUIRED_COLUMNS = [
  'Survey Code (ID)',
  'Zone',
  'Device Type',
  'Status'
];

// All expected columns from Excel (in display order)
const EXCEL_COLUMNS = [
  {
    key: 'surveyCode',
    excelHeader: 'Survey Code (ID)',
    displayName: 'Survey Code',
    type: 'string',
    required: true,
    unique: true
  },
  {
    key: 'zone',
    excelHeader: 'Zone',
    displayName: 'Zone',
    type: 'enum',
    required: true,
    values: ['SC Colony', 'Village', 'Waddera']
  },
  {
    key: 'streetName',
    excelHeader: 'Street Name / Landmark',
    displayName: 'Street Name / Landmark',
    type: 'string',
    required: false
  },
  {
    key: 'deviceType',
    excelHeader: 'Device Type',
    displayName: 'Device Type',
    type: 'enum',
    required: true,
    values: ['Borewell', 'Sump', 'OHT']
  },
  {
    key: 'lat',
    excelHeader: 'Lat',
    displayName: 'Latitude',
    type: 'float',
    required: false
  },
  {
    key: 'long',
    excelHeader: 'Long',
    displayName: 'Longitude',
    type: 'float',
    required: false
  },
  {
    key: 'status',
    excelHeader: 'Status',
    displayName: 'Status',
    type: 'enum',
    required: true,
    values: ['Working', 'Not Work', 'Failed']
  },
  {
    key: 'housesConnected',
    excelHeader: 'Houses Conn.',
    displayName: 'Houses Connected',
    type: 'integer',
    required: false
  },
  {
    key: 'dailyUsage',
    excelHeader: 'Daily Usage (Hrs)',
    displayName: 'Daily Usage (Hours)',
    type: 'float',
    required: false
  },
  {
    key: 'pipeSize',
    excelHeader: 'Pipe Size (inch)',
    displayName: 'Pipe Size (inch)',
    type: 'float',
    required: false
  },
  {
    key: 'motorCapacity',
    excelHeader: 'Motor HP / Cap',
    displayName: 'Motor HP / Capacity',
    type: 'string',
    required: false
  },
  {
    key: 'notes',
    excelHeader: 'Notes / Maintenance Issue',
    displayName: 'Notes / Maintenance Issue',
    type: 'text',
    required: false
  },
  {
    key: 'imagesRef',
    excelHeader: 'Images',
    displayName: 'Images',
    type: 'string',
    required: false
  }
];

// Map Excel header to internal key
const headerToKey = {};
EXCEL_COLUMNS.forEach(col => {
  headerToKey[col.excelHeader] = col.key;
});

// Map internal key to Excel header
const keyToHeader = {};
EXCEL_COLUMNS.forEach(col => {
  keyToHeader[col.key] = col.excelHeader;
});

// Get column config by key
const getColumnConfig = (key) => {
  return EXCEL_COLUMNS.find(col => col.key === key);
};

// Get column config by Excel header
const getColumnByHeader = (header) => {
  return EXCEL_COLUMNS.find(col => col.excelHeader === header);
};

module.exports = {
  REQUIRED_COLUMNS,
  EXCEL_COLUMNS,
  headerToKey,
  keyToHeader,
  getColumnConfig,
  getColumnByHeader
};
