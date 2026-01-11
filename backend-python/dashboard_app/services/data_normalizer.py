"""
Data Normalizer
Sanitizes and converts Excel values into typed, validated data
"""

import pandas as pd
import numpy as np
from typing import Any, Optional, Union
import logging

logger = logging.getLogger(__name__)

class DataNormalizer:
    """
    Converts raw Excel values into clean, typed data
    Handles NaN, infinity, whitespace, type conversion
    """
    
    def sanitize_coordinate(self, value: Any) -> Optional[float]:
        """
        Convert coordinate to float, validate it's a real number
        
        Args:
            value: Raw Excel cell value
            
        Returns:
            float or None if invalid
            
        Examples:
            "17.49281 " → 17.49281
            "78.39210" → 78.39210
            "" → None
            NaN → None
        """
        if pd.isna(value) or value is None:
            return None
            
        try:
            # Convert to string, strip whitespace, then to float
            coord_str = str(value).strip()
            if not coord_str or coord_str.lower() in ['nan', 'none', 'null', '']:
                return None
                
            coord = float(coord_str)
            
            # Check for NaN or infinity
            if np.isnan(coord) or np.isinf(coord):
                return None
                
            return coord
            
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to convert coordinate '{value}': {e}")
            return None
    
    def sanitize_string(self, value: Any) -> Optional[str]:
        """
        Trim and normalize strings
        
        Args:
            value: Raw Excel cell value
            
        Returns:
            Cleaned string or None if empty
            
        Examples:
            " SC Colony " → "SC Colony"
            "Working" → "Working"
            "" → None
            NaN → None
        """
        if pd.isna(value) or value is None:
            return None
            
        try:
            cleaned = str(value).strip()
            
            # Treat these as null
            if cleaned.lower() in ['nan', 'none', 'null', 'n/a', '']:
                return None
                
            return cleaned
            
        except Exception as e:
            logger.debug(f"Failed to convert string '{value}': {e}")
            return None
    
    def sanitize_integer(self, value: Any, min_val: Optional[int] = None, max_val: Optional[int] = None) -> Optional[int]:
        """
        Convert to integer with optional range validation
        
        Args:
            value: Raw Excel cell value
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            int or None if invalid
        """
        if pd.isna(value) or value is None:
            return None
            
        try:
            # Convert to float first (handles "120.0" strings)
            num = float(str(value).strip())
            
            if np.isnan(num) or np.isinf(num):
                return None
            
            # Convert to int
            num_int = int(num)
            
            # Range validation
            if min_val is not None and num_int < min_val:
                logger.debug(f"Value {num_int} below minimum {min_val}")
                return None
            if max_val is not None and num_int > max_val:
                logger.debug(f"Value {num_int} above maximum {max_val}")
                return None
                
            return num_int
            
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to convert integer '{value}': {e}")
            return None
    
    def sanitize_float(self, value: Any, min_val: Optional[float] = None, max_val: Optional[float] = None) -> Optional[float]:
        """
        Convert to float with optional range validation
        
        Args:
            value: Raw Excel cell value
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            float or None if invalid
        """
        if pd.isna(value) or value is None:
            return None
            
        try:
            num = float(str(value).strip())
            
            if np.isnan(num) or np.isinf(num):
                return None
            
            # Range validation
            if min_val is not None and num < min_val:
                logger.debug(f"Value {num} below minimum {min_val}")
                return None
            if max_val is not None and num > max_val:
                logger.debug(f"Value {num} above maximum {max_val}")
                return None
                
            return num
            
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to convert float '{value}': {e}")
            return None
    
    def normalize_device_type(self, value: Any) -> Optional[str]:
        """
        Normalize device type variations
        
        Examples:
            "borewell" → "Borewell"
            "SUMP" → "Sump"
            "overhead tank" → "OHSR"
        """
        if pd.isna(value) or value is None:
            return None
            
        device_str = str(value).strip().lower()
        
        # Normalization map
        type_map = {
            'borewell': 'Borewell',
            'bore well': 'Borewell',
            'bw': 'Borewell',
            'sump': 'Sump',
            'sm': 'Sump',
            'oht': 'OHSR',
            'ohsr': 'OHSR',
            'overhead tank': 'OHSR',
            'overhead': 'OHSR',
        }
        
        return type_map.get(device_str, value.strip() if isinstance(value, str) else None)
    
    def normalize_status(self, value: Any) -> Optional[str]:
        """
        Normalize status variations
        
        Examples:
            " Working " → "Working"
            "not working" → "Not Working"
            "repair" → "On Repair"
        """
        if pd.isna(value) or value is None:
            return None
            
        status_str = str(value).strip().lower()
        
        # Normalization map
        status_map = {
            'working': 'Working',
            'work': 'Working',
            'not working': 'Not Working',
            'not work': 'Not Working',
            'notworking': 'Not Working',
            'on repair': 'On Repair',
            'repair': 'On Repair',
            'failed': 'Failed',
            'fail': 'Failed',
        }
        
        return status_map.get(status_str, value.strip() if isinstance(value, str) else None)
