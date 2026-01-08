/**
 * SheetSelector Component
 * 
 * Dropdown to select which Excel sheet to view
 */

import React, { useState, useEffect } from 'react';
import { fetchAvailableSheets } from '../../services/apiService';
import './SheetSelector.css';

function SheetSelector({ currentSheet, onSheetChange }) {
  const [sheets, setSheets] = useState(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableSheets();
  }, []);

  const loadAvailableSheets = async () => {
    setLoading(true);
    try {
      const result = await fetchAvailableSheets();
      if (result.success && result.sheets.length > 0) {
        setSheets(result.sheets);
      }
    } catch (error) {
      console.error('Error loading sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = (event) => {
    const selectedSheet = event.target.value;
    if (onSheetChange) {
      onSheetChange(selectedSheet);
    }
  };

  if (loading) {
    return (
      <div className="sheet-selector loading">
        <span>Loading sheets...</span>
      </div>
    );
  }

  if (sheets.length <= 1) {
    return null; // Don't show selector if only one sheet
  }

  return (
    <div className="sheet-selector">
      <label htmlFor="sheet-select">
        <span className="sheet-icon">📊</span>
        Excel Sheet:
      </label>
      <select 
        id="sheet-select"
        value={currentSheet || 'All'} 
        onChange={handleSheetChange}
        className="sheet-dropdown"
      >
        {sheets.map((sheet) => (
          <option key={sheet} value={sheet}>
            {sheet}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SheetSelector;
