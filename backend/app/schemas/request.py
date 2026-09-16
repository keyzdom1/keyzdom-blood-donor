from datetime import datetime
from pydantic import BaseModel
from app.models.donor import BloodType
from app.models.request import Urgency, RequestStatus


class RequestCreate(BaseModel):
    org_id: int
    blood_type_needed: BloodType
    units_needed: int
    urgency: Urgency = Urgency.NORMAL
    expires_at: datetime


class RequestUpdate(BaseModel):
    status: RequestStatus | None = None
    units_needed: int | None = None


class RequestResponse(BaseModel):
    id: int
    org_id: int
    blood_type_needed: BloodType
    units_needed: int
    urgency: Urgency
    status: RequestStatus
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
