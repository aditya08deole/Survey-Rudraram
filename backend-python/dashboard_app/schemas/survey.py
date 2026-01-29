from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class DeviceBase(BaseModel):
    survey_id: Optional[str] = None
    original_name: Optional[str] = None
    zone: Optional[str] = None
    street: Optional[str] = None
    device_type: str
    status: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    images: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class BorewellDetail(DeviceBase):
    motor_hp: Optional[str] = None
    depth_ft: Optional[float] = None
    pipe_size_inch: Optional[float] = None
    power_type: Optional[str] = None
    houses_connected: Optional[int] = None
    daily_usage_hrs: Optional[float] = None
    done: Optional[bool] = None

# Generic Device Model (Union or permissive dict for now to handle all types dynamically)
class DeviceResponse(DeviceBase):
    # Additional dynamic fields
    capacity: Optional[float] = None
    tank_height_m: Optional[float] = None
    tank_circumference: Optional[float] = None
    power_distance_m: Optional[float] = None
    people_connected: Optional[int] = None
    material: Optional[str] = None
    lid_access: Optional[str] = None
    type: Optional[str] = None

    class Config:
        extra = "ignore" # Ignore fields not in model

class SurveyDataResponse(BaseModel):
    devices: List[DeviceResponse]
    metadata: Dict[str, Any]

class SurveyStatsResponse(BaseModel):
    total_devices: int
    zones: Dict[str, int]
    types: Dict[str, int]
    status: Dict[str, int]
