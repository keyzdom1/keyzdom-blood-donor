import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_donor_profile(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "test_donor@example.com",
        "password": "testpass123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Test donor not created yet")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/donors",
        json={
            "blood_type": "O+",
            "dob": "1995-01-15",
            "home_location_lat": 6.5244,
            "home_location_lng": 3.3792,
            "max_radius_km": 25.0,
        },
        headers=headers,
    )
    assert response.status_code in (201, 409)


@pytest.mark.asyncio
async def test_toggle_availability(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "test_donor@example.com",
        "password": "testpass123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Test donor not available")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.patch(
        "/api/donors/availability",
        json={"is_available": False},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["is_available"] is False


@pytest.mark.asyncio
async def test_create_blood_request(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "luth@hospital.com",
        "password": "hospital123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Hospital user not available")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/requests",
        json={
            "org_id": 1,
            "blood_type_needed": "A+",
            "units_needed": 2,
            "urgency": "normal",
            "expires_at": "2026-12-31T23:59:59Z",
        },
        headers=headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_requests(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "luth@hospital.com",
        "password": "hospital123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Hospital user not available")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/requests", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_admin_overview(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "admin@keyzdom.com",
        "password": "admin123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Admin user not available")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/admin/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_donors" in data
    assert "total_organizations" in data


@pytest.mark.asyncio
async def test_admin_analytics(client: AsyncClient):
    login_resp = await client.post("/api/auth/login", json={
        "contact": "admin@keyzdom.com",
        "password": "admin123",
    })
    if login_resp.status_code != 200:
        pytest.skip("Admin user not available")

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/admin/analytics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "fulfillment_rate" in data
