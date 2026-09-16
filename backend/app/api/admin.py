from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_, text
from app.database import get_db
from app.models.user import User, UserRole
from app.models.donor import Donor
from app.models.organization import Organization
from app.models.request import Request, RequestStatus
from app.models.match import Match, MatchStatus
from app.models.notification_log import NotificationLog, NotificationChannel
from app.services.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _admin_user(user: User = Depends(require_role(["admin"]))) -> User:
    return user


@router.get("/overview")
async def get_overview(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    donor_count = (await db.execute(select(func.count(Donor.user_id)))).scalar() or 0
    org_count = (await db.execute(select(func.count(Organization.id)))).scalar() or 0
    active_requests = (await db.execute(
        select(func.count(Request.id)).where(Request.status.in_(["open", "in_progress"]))
    )).scalar() or 0
    total_matches = (await db.execute(select(func.count(Match.id)))).scalar() or 0
    fulfilled = (await db.execute(
        select(func.count(Match.id)).where(Match.status == MatchStatus.ACCEPTED)
    )).scalar() or 0
    pending_orgs = (await db.execute(
        select(func.count(Organization.id)).where(Organization.verified == False)
    )).scalar() or 0

    return {
        "total_donors": donor_count,
        "total_organizations": org_count,
        "active_requests": active_requests,
        "total_matches": total_matches,
        "fulfilled_matches": fulfilled,
        "pending_verifications": pending_orgs,
    }


@router.get("/organizations")
async def list_pending_organizations(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.verified == False))
    return [
        {
            "id": o.id,
            "name": o.name,
            "type": o.type.value,
            "verified": o.verified,
        }
        for o in result.scalars().all()
    ]


@router.post("/organizations/{org_id}/verify")
async def verify_organization(
    org_id: int,
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org.verified = True
    await db.flush()
    return {"status": "verified", "org_id": org_id}


@router.post("/organizations/{org_id}/reject")
async def reject_organization(
    org_id: int,
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    await db.delete(org)
    await db.flush()
    return {"status": "rejected", "org_id": org_id}


@router.get("/donors")
async def list_donors(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Donor, User)
        .join(User, Donor.user_id == User.id)
    )
    rows = result.all()
    return [
        {
            "user_id": donor.user_id,
            "name": u.name,
            "contact": u.contact,
            "blood_type": donor.blood_type.value,
            "is_available": donor.is_available,
            "last_donation_date": donor.last_donation_date.isoformat() if donor.last_donation_date else None,
        }
        for donor, u in rows
    ]


@router.patch("/donors/{donor_id}/flag")
async def flag_donor(
    donor_id: int,
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == donor_id, User.role == UserRole.DONOR))
    donor_user = result.scalar_one_or_none()
    if not donor_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    donor_result = await db.execute(select(Donor).where(Donor.user_id == donor_id))
    donor = donor_result.scalar_one_or_none()
    if donor:
        donor.is_available = False
    await db.flush()
    return {"status": "flagged", "donor_id": donor_id}


@router.patch("/donors/{donor_id}/unflag")
async def unflag_donor(
    donor_id: int,
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    donor_result = await db.execute(select(Donor).where(Donor.user_id == donor_id))
    donor = donor_result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    donor.is_available = True
    await db.flush()
    return {"status": "unflagged", "donor_id": donor_id}


class AnalyticsResponse(BaseModel):
    total_requests: int
    requests_by_status: dict
    requests_by_urgency: dict
    total_matches: int
    matches_by_status: dict
    avg_match_distance_km: float | None
    donor_availability_rate: float
    fulfillment_rate: float


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_requests = (await db.execute(select(func.count(Request.id)))).scalar() or 0

    open_count = (await db.execute(
        select(func.count(Request.id)).where(Request.status == RequestStatus.OPEN)
    )).scalar() or 0
    in_progress_count = (await db.execute(
        select(func.count(Request.id)).where(Request.status == RequestStatus.IN_PROGRESS)
    )).scalar() or 0
    fulfilled_count = (await db.execute(
        select(func.count(Request.id)).where(Request.status == RequestStatus.FULFILLED)
    )).scalar() or 0
    expired_count = (await db.execute(
        select(func.count(Request.id)).where(Request.status == RequestStatus.EXPIRED)
    )).scalar() or 0

    critical = (await db.execute(
        select(func.count(Request.id)).where(text("urgency = 'critical'"))
    )).scalar() or 0
    high = (await db.execute(
        select(func.count(Request.id)).where(text("urgency = 'high'"))
    )).scalar() or 0
    normal = (await db.execute(
        select(func.count(Request.id)).where(text("urgency = 'normal'"))
    )).scalar() or 0

    total_matches = (await db.execute(select(func.count(Match.id)))).scalar() or 0
    accepted = (await db.execute(
        select(func.count(Match.id)).where(Match.status == MatchStatus.ACCEPTED)
    )).scalar() or 0
    declined = (await db.execute(
        select(func.count(Match.id)).where(Match.status == MatchStatus.DECLINED)
    )).scalar() or 0
    notified = (await db.execute(
        select(func.count(Match.id)).where(Match.status == MatchStatus.NOTIFIED)
    )).scalar() or 0

    avg_dist_result = await db.execute(
        select(func.avg(Match.distance_km)).where(Match.distance_km.isnot(None))
    )
    avg_dist = avg_dist_result.scalar()

    total_donors = (await db.execute(select(func.count(Donor.user_id)))).scalar() or 1
    available_donors = (await db.execute(
        select(func.count(Donor.user_id)).where(Donor.is_available == True)
    )).scalar() or 0

    return AnalyticsResponse(
        total_requests=total_requests,
        requests_by_status={
            "open": open_count,
            "in_progress": in_progress_count,
            "fulfilled": fulfilled_count,
            "expired": expired_count,
        },
        requests_by_urgency={
            "critical": critical,
            "high": high,
            "normal": normal,
        },
        total_matches=total_matches,
        matches_by_status={
            "accepted": accepted,
            "declined": declined,
            "notified": notified,
        },
        avg_match_distance_km=round(avg_dist, 2) if avg_dist else None,
        donor_availability_rate=round(available_donors / total_donors * 100, 1),
        fulfillment_rate=round(accepted / total_matches * 100, 1) if total_matches > 0 else 0,
    )


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(default=50, le=200),
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationLog)
        .order_by(NotificationLog.sent_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "match_id": log.match_id,
            "channel": log.channel.value,
            "delivery_status": log.delivery_status,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        }
        for log in logs
    ]


@router.get("/system-health")
async def get_system_health(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    try:
        import redis as redis_lib
        from app.config import get_settings
        settings = get_settings()
        r = redis_lib.from_url(settings.REDIS_URL)
        r.ping()
        redis_status = "healthy"
    except Exception:
        redis_status = "unhealthy"

    try:
        from app.tasks.celery_app import celery_app
        i = celery_app.control.inspect(timeout=2)
        active = i.active()
        worker_count = len(active) if active else 0
        celery_status = "healthy" if worker_count > 0 else "no_workers"
    except Exception:
        celery_status = "unhealthy"
        worker_count = 0

    return {
        "database": db_status,
        "redis": redis_status,
        "celery_workers": celery_status,
        "active_workers": worker_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/requests")
async def list_all_requests(
    status_filter: str = Query(default=None, alias="status"),
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Request)
    if status_filter:
        query = query.where(Request.status == status_filter)
    query = query.order_by(Request.created_at.desc())
    result = await db.execute(query)
    return [
        {
            "id": r.id,
            "org_id": r.org_id,
            "blood_type_needed": r.blood_type_needed.value,
            "units_needed": r.units_needed,
            "urgency": r.urgency.value,
            "status": r.status.value,
            "expires_at": r.expires_at.isoformat(),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in result.scalars().all()
    ]


@router.get("/matches")
async def list_all_matches(
    user: User = Depends(_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Match).order_by(Match.notified_at.desc()))
    return [
        {
            "id": m.id,
            "request_id": m.request_id,
            "donor_id": m.donor_id,
            "distance_km": m.distance_km,
            "status": m.status.value,
            "notified_at": m.notified_at.isoformat() if m.notified_at else None,
            "responded_at": m.responded_at.isoformat() if m.responded_at else None,
        }
        for m in result.scalars().all()
    ]
