import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, Enum, DateTime, ForeignKey, func
from app.database import Base


class MatchStatus(str, enum.Enum):
    NOTIFIED = "notified"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    donor_id = Column(Integer, ForeignKey("donors.user_id"), nullable=False)
    distance_km = Column(Float, nullable=True)
    status = Column(Enum(MatchStatus), default=MatchStatus.NOTIFIED)
    notified_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
