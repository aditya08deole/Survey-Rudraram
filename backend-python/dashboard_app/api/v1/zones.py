
import json
import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

router = APIRouter(tags=["Zones"])

DATA_FILE = "data/zones.json"

class Zone(BaseModel):
    id: str
    type: str
    geometry: List[Any] # LatLngs
    color: str
    label: str = ""

def load_zones():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_zones_to_file(zones):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(zones, f)

@router.get("/zones")
async def get_zones():
    return load_zones()

@router.post("/zones")
async def save_zone(zone: Zone):
    zones = load_zones()
    zones.append(zone.dict())
    save_zones_to_file(zones)
    return {"success": True, "zones": zones}

@router.delete("/zones/all/delete")
async def delete_all_zones():
    save_zones_to_file([])
    return {"success": True, "zones": []}

@router.delete("/zones/{zone_id}")
async def delete_zone(zone_id: str):
    zones = load_zones()
    zones = [z for z in zones if z['id'] != zone_id]
    save_zones_to_file(zones)
    return {"success": True, "zones": zones}

@router.put("/zones/{zone_id}")
async def update_zone(zone_id: str, zone: Zone):
    zones = load_zones()
    for i, z in enumerate(zones):
        if z['id'] == zone_id:
            zones[i] = zone.dict()
            save_zones_to_file(zones)
            return {"success": True, "zones": zones}
    raise HTTPException(status_code=404, detail="Zone not found")
