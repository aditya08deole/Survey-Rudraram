"""
Excel Validator
Validates normalized device data against schema rules
Quarantines invalid rows with detailed error messages
"""

from typing import Dict, List, Tuple, Any, Optional
import logging

from dashboard_app.schemas.excel_schema import (
    REQUIRED_FIELDS,
    VALIDATION_RULES,
    DeviceType,
    DeviceStatus
)

logger = logging.getLogger(__name__)

class ExcelValidator:
    """
    Validates device rows against canonical schema
    Produces detailed error messages for quarantined rows
    """
    
    def validate_row(self, row: Dict[str, Any], row_index: int) -> Tuple[bool, List[str]]:
        """
        Validate a single normalized device row
        
        Args:
            row: Normalized device dictionary
            row_index: Excel row number (for error reporting)
            
        Returns:
            (is_valid, list_of_errors)
            
        Examples:
            Valid row: (True, [])
            Invalid: (False, ["Missing survey_id", "Latitude out of range: 95.0"])
        """
        errors = []
        
        # Check required fields
        for field in REQUIRED_FIELDS:
            if not row.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Validate coordinates (CRITICAL)
        lat = row.get("lat")
        lng = row.get("lng")
        
        if lat is None and lng is None:
            errors.append("Missing GPS coordinates (both lat and lng are null)")
        elif lat is None:
            errors.append("Missing latitude")
        elif lng is None:
            errors.append("Missing longitude")
        else:
            # Validate ranges
            lat_rules = VALIDATION_RULES.get("lat", {})
            lng_rules = VALIDATION_RULES.get("lng", {})
            
            if not (lat_rules.get("min", -90) <= lat <= lat_rules.get("max", 90)):
                errors.append(f"Latitude out of range: {lat} (must be -90 to 90)")
            
            if not (lng_rules.get("min", -180) <= lng <= lng_rules.get("max", 180)):
                errors.append(f"Longitude out of range: {lng} (must be -180 to 180)")
        
        # Validate device type
        device_type = row.get("device_type")
        if device_type:
            allowed_types = VALIDATION_RULES.get("device_type", {}).get("allowed", [])
            if device_type not in allowed_types:
                errors.append(f"Unknown device type: '{device_type}' (allowed: {', '.join(allowed_types)})")
        
        # Validate status
        status = row.get("status")
        if status:
            allowed_statuses = VALIDATION_RULES.get("status", {}).get("allowed", [])
            if status not in allowed_statuses:
                errors.append(f"Unknown status: '{status}' (allowed: {', '.join(allowed_statuses)})")
        
        # Validate numeric ranges
        self._validate_numeric_field(row, "houses", errors)
        self._validate_numeric_field(row, "usage_hours", errors)
        self._validate_numeric_field(row, "pipe_size", errors)
        self._validate_numeric_field(row, "motor_hp", errors)
        
        is_valid = len(errors) == 0
        
        if not is_valid:
            logger.warning(f"Row {row_index} validation failed: {'; '.join(errors)}")
        
        return (is_valid, errors)
    
    def _validate_numeric_field(self, row: Dict[str, Any], field: str, errors: List[str]) -> None:
        """Helper to validate numeric field ranges"""
        value = row.get(field)
        if value is None:
            return  # Null is acceptable for optional fields
        
        rules = VALIDATION_RULES.get(field, {})
        min_val = rules.get("min")
        max_val = rules.get("max")
        
        if min_val is not None and value < min_val:
            errors.append(f"{field} below minimum: {value} < {min_val}")
        
        if max_val is not None and value > max_val:
            errors.append(f"{field} above maximum: {value} > {max_val}")
    
    def validate_batch(self, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate multiple rows and produce summary statistics
        
        Args:
            rows: List of normalized device dictionaries
            
        Returns:
            {
                "valid_devices": [...],
                "invalid_devices": [...],
                "stats": {
                    "total": 187,
                    "valid": 175,
                    "invalid": 12,
                    "validation_rate": 93.6,
                    "error_breakdown": {
                        "missing_coordinates": 8,
                        "invalid_device_type": 2,
                        "coordinate_out_of_range": 2
                    }
                }
            }
        """
        valid_devices = []
        invalid_devices = []
        error_counts = {}
        
        for row in rows:
            row_index = row.get("row_index", 0)
            is_valid, errors = self.validate_row(row, row_index)
            
            if is_valid:
                valid_devices.append(row)
            else:
                invalid_devices.append({
                    **row,
                    "validation_errors": errors
                })
                
                # Count error types
                for error in errors:
                    error_type = self._categorize_error(error)
                    error_counts[error_type] = error_counts.get(error_type, 0) + 1
        
        total = len(rows)
        valid_count = len(valid_devices)
        invalid_count = len(invalid_devices)
        
        return {
            "valid_devices": valid_devices,
            "invalid_devices": invalid_devices,
            "stats": {
                "total": total,
                "valid": valid_count,
                "invalid": invalid_count,
                "validation_rate": round((valid_count / total * 100) if total > 0 else 0, 2),
                "error_breakdown": error_counts
            }
        }
    
    def _categorize_error(self, error_message: str) -> str:
        """Categorize error message for statistics"""
        error_lower = error_message.lower()
        
        if "missing" in error_lower and ("lat" in error_lower or "lng" in error_lower or "gps" in error_lower or "coordinate" in error_lower):
            return "missing_coordinates"
        elif "missing required field" in error_lower:
            return "missing_required_field"
        elif "out of range" in error_lower:
            return "coordinate_out_of_range"
        elif "unknown device type" in error_lower:
            return "invalid_device_type"
        elif "unknown status" in error_lower:
            return "invalid_status"
        elif "below minimum" in error_lower or "above maximum" in error_lower:
            return "numeric_range_violation"
        else:
            return "other_validation_error"
