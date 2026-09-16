import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.database import Base


class UserRole(str, enum.Enum):
    DONOR = "donor"
    HOSPITAL_STAFF = "hospital_staff"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(Enum(UserRole), nullable=False)
    name = Column(String(255), nullable=False)
    contact = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
