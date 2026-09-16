from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.donor import Donor
from app.schemas.donor import DonorCreate, DonorUpdate, DonorResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/donors", tags=["donors"])


@router.post("", response_model=DonorResponse, status_code=status.HTTP_201_CREATED)
async def create_donor_profile(
    data: DonorCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Donor).where(Donor.user_id == user.id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Donor profile already exists")

    point = f"SRID=4326;POINT({data.home_location_lng} {data.home_location_lat})"
    donor = Donor(
        user_id=user.id,
        blood_type=data.blood_type,
        dob=data.dob,
        home_location=point,
        max_radius_km=data.max_radius_km,
    )
    db.add(donor)
    await db.flush()
    await db.refresh(donor)
    return donor


@router.get("/me", response_model=DonorResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Donor).where(Donor.user_id == user.id))
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor profile not found")
    return donor


@router.patch("/availability", response_model=DonorResponse)
async def toggle_availability(
    data: DonorUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Donor).where(Donor.user_id == user.id))
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor profile not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donor, field, value)
    await db.flush()
    await db.refresh(donor)
    return donor
