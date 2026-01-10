import pytest
import os
from httpx import AsyncClient
from main import app

# Set testing environment
os.environ["ENV"] = "test"

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
