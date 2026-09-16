import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, func
from app.database import Base


class NotificationChannel(str, enum.Enum):
    PUSH = "push"
    SMS = "sms"
    EMAIL = "email"


class NotificationLog(Base):
    __tablename__ = "notifications_log"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    channel = Column(Enum(NotificationChannel), nullable=False)
    delivery_status = Column(String(50), default="pending")
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
