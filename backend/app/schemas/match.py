from datetime import datetime
from pydantic import BaseModel
from app.models.match import MatchStatus


class MatchResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    distance_km: float | None
    status: MatchStatus
    notified_at: datetime
    responded_at: datetime | None

    class Config:
        from_attributes = True
