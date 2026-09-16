from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestUpdate, RequestResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/requests", tags=["requests"])


@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    data: RequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    blood_request = Request(
        org_id=data.org_id,
        blood_type_needed=data.blood_type_needed,
        units_needed=data.units_needed,
        urgency=data.urgency,
        expires_at=data.expires_at,
    )
    db.add(blood_request)
    await db.flush()
    await db.refresh(blood_request)
    return blood_request


@router.get("", response_model=list[RequestResponse])
async def list_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Request).where(Request.status.in_(["open", "in_progress"]))
    )
    return result.scalars().all()


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Request).where(Request.id == request_id))
    blood_request = result.scalar_one_or_none()
    if not blood_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return blood_request


@router.patch("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: int,
    data: RequestUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Request).where(Request.id == request_id))
    blood_request = result.scalar_one_or_none()
    if not blood_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(blood_request, field, value)
    await db.flush()
    await db.refresh(blood_request)
    return blood_request
