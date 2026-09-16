import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    register_data = {
        "role": "donor",
        "name": "Test Donor",
        "contact": "test_donor@example.com",
        "password": "testpass123",
    }
    reg_response = await client.post("/api/auth/register", json=register_data)
    assert reg_response.status_code in (201, 409), f"Register failed: {reg_response.text}"

    login_data = {
        "contact": "test_donor@example.com",
        "password": "testpass123",
    }
    login_response = await client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"

    data = login_response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "donor"
    assert data["user"]["name"] == "Test Donor"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "contact": "nonexistent@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_register_duplicate_contact(client: AsyncClient):
    data = {
        "role": "donor",
        "name": "Duplicate User",
        "contact": "duplicate@example.com",
        "password": "pass123",
    }
    r1 = await client.post("/api/auth/register", json=data)
    assert r1.status_code == 201

    r2 = await client.post("/api/auth/register", json=data)
    assert r2.status_code == 409
