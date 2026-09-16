import enum
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Float, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
from app.database import Base


class BloodType(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class Donor(Base):
    __tablename__ = "donors"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    blood_type = Column(SAEnum(BloodType), nullable=False)
    dob = Column(Date, nullable=False)
    last_donation_date = Column(Date, nullable=True)
    home_location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    max_radius_km = Column(Float, default=25.0)
    is_available = Column(Boolean, default=True)
