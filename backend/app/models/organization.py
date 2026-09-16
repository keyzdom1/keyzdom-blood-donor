import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from geoalchemy2 import Geography
from app.database import Base


class OrgType(str, enum.Enum):
    HOSPITAL = "hospital"
    BLOOD_BANK = "blood_bank"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(OrgType), nullable=False)
    verified = Column(Boolean, default=False)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
