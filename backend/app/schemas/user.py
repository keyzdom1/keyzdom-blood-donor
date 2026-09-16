from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserCreate(BaseModel):
    role: UserRole
    name: str
    contact: str
    password: str


class UserLogin(BaseModel):
    contact: str
    password: str


class UserResponse(BaseModel):
    id: int
    role: UserRole
    name: str
    contact: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
