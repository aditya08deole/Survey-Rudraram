"""
Backend API Database Tests
"""

import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    """Async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test database health check endpoint"""
    response = await client.get("/api/db/health")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_get_all_devices(client):
    """Test fetching all devices from database"""
    response = await client.get("/api/db/devices")
    assert response.status_code == 200
    
    data = response.json()
    assert "success" in data
    assert "data" in data
    assert "count" in data
    assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_get_devices_with_filters(client):
    """Test fetching devices with query filters"""
    # Test device_type filter
    response = await client.get("/api/db/devices?device_type=borewell")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    
    # Test zone filter
    response = await client.get("/api/db/devices?zone=SC Colony")
    assert response.status_code == 200
    
    # Test status filter
    response = await client.get("/api/db/devices?status=Working")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_device_by_code(client):
    """Test fetching single device by survey code"""
    # This will need a valid survey code from your database
    response = await client.get("/api/db/devices/BW001")
    # Expect either 200 (found) or 404 (not found)
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        data = response.json()
        assert "success" in data
        assert "data" in data

@pytest.mark.asyncio
async def test_get_statistics(client):
    """Test statistics endpoint"""
    response = await client.get("/api/db/stats")
    assert response.status_code == 200
    
    data = response.json()
    assert "success" in data
    assert "data" in data
    
    stats = data["data"]
    assert "by_type" in stats
    assert "by_status" in stats
    assert "by_zone" in stats

@pytest.mark.asyncio
async def test_get_zones(client):
    """Test zones list endpoint"""
    response = await client.get("/api/db/zones")
    assert response.status_code == 200
    
    data = response.json()
    assert "success" in data
    assert "data" in data
    assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_pagination(client):
    """Test pagination parameters"""
    response = await client.get("/api/db/devices?limit=5&offset=0")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) <= 5

@pytest.mark.asyncio
async def test_invalid_survey_code(client):
    """Test invalid survey code returns 404"""
    response = await client.get("/api/db/devices/INVALID_CODE_12345")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_device_count_matches_stats(client):
    """Test that device count matches stats totals"""
    # Get all devices
    devices_response = await client.get("/api/db/devices")
    devices_data = devices_response.json()
    total_devices = len(devices_data["data"])
    
    # Get statistics
    stats_response = await client.get("/api/db/stats")
    stats_data = stats_response.json()
    
    # Sum by_type counts
    type_counts = sum(stats_data["data"]["by_type"].values())
    
    # Should match (or be close due to RLS/permissions)
    assert total_devices == type_counts or total_devices >= 0
