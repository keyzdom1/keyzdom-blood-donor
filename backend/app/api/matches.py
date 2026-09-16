from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("", response_model=list[MatchResponse])
async def list_my_matches(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Match).where(Match.donor_id == user.id)
    )
    return result.scalars().all()


@router.post("/{match_id}/accept", response_model=MatchResponse)
async def accept_match(
    match_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Match).where(Match.id == match_id, Match.donor_id == user.id)
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.status != MatchStatus.NOTIFIED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match already responded to")

    match.status = MatchStatus.ACCEPTED
    match.responded_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(match)
    return match


@router.post("/{match_id}/decline", response_model=MatchResponse)
async def decline_match(
    match_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Match).where(Match.id == match_id, Match.donor_id == user.id)
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.status != MatchStatus.NOTIFIED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match already responded to")

    match.status = MatchStatus.DECLINED
    match.responded_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(match)
    return match
