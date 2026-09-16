from datetime import date
from pydantic import BaseModel
from app.models.donor import BloodType


class DonorCreate(BaseModel):
    blood_type: BloodType
    dob: date
    home_location_lat: float
    home_location_lng: float
    max_radius_km: float = 25.0


class DonorUpdate(BaseModel):
    blood_type: BloodType | None = None
    max_radius_km: float | None = None
    is_available: bool | None = None


class DonorResponse(BaseModel):
    user_id: int
    blood_type: BloodType
    dob: date
    last_donation_date: date | None
    max_radius_km: float
    is_available: bool

    class Config:
        from_attributes = True
