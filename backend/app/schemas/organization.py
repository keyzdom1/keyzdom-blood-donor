from pydantic import BaseModel
from app.models.organization import OrgType


class OrganizationCreate(BaseModel):
    name: str
    type: OrgType
    location_lat: float
    location_lng: float


class OrganizationResponse(BaseModel):
    id: int
    name: str
    type: OrgType
    verified: bool

    class Config:
        from_attributes = True
