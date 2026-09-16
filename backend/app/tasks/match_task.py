from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.tasks.celery_app import celery_app
from app.database import async_session
from app.models.donor import Donor, BloodType
from app.models.request import Request, RequestStatus
from app.models.match import Match, MatchStatus
from app.models.organization import Organization

BLOOD_COMPATIBILITY = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
}

MIN_DAYS_BETWEEN_DONATIONS = 56


@celery_app.task(name="match_request", bind=True, max_retries=2)
def match_request(self, request_id: int):
    try:
        _match_request_sync(request_id)
    except Exception as exc:
        self.retry(exc=exc, countdown=30)


def _match_request_sync(request_id: int):
    import asyncio
    asyncio.run(_match_request_async(request_id))


async def _match_request_async(request_id: int):
    from app.websocket import broadcast_match_to_donor

    async with async_session() as db:
        result = await db.execute(select(Request).where(Request.id == request_id))
        blood_request = result.scalar_one_or_none()
        if not blood_request or blood_request.status != RequestStatus.OPEN:
            return

        org_result = await db.execute(
            select(Organization).where(Organization.id == blood_request.org_id)
        )
        org = org_result.scalar_one_or_none()

        compatible_types = BLOOD_COMPATIBILITY.get(blood_request.blood_type_needed.value, [])

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=MIN_DAYS_BETWEEN_DONATIONS)

        query = (
            select(Donor)
            .where(Donor.blood_type.in_(compatible_types))
            .where(Donor.is_available == True)
            .where(
                (Donor.last_donation_date == None) | (Donor.last_donation_date < cutoff_date)
            )
        )
        candidates_result = await db.execute(query)
        candidates = candidates_result.scalars().all()

        matched = []
        for donor in candidates[:20]:
            dist = None
            if org:
                try:
                    dist_result = await db.execute(
                        text(
                            "SELECT ST_Distance("
                            "  (SELECT location FROM organizations WHERE id = :org_id)::geography,"
                            "  home_location"
                            ") / 1000.0 AS dist_km"
                            " FROM donors WHERE user_id = :donor_id"
                        ),
                        {"org_id": org.id, "donor_id": donor.user_id},
                    )
                    row = dist_result.mappings().first()
                    if row:
                        dist = round(row["dist_km"], 2)
                except Exception:
                    pass

            if dist is not None and dist > donor.max_radius_km:
                continue

            match = Match(
                request_id=request_id,
                donor_id=donor.user_id,
                distance_km=dist,
                status=MatchStatus.NOTIFIED,
            )
            db.add(match)
            matched.append(donor)

        blood_request.status = RequestStatus.IN_PROGRESS
        await db.commit()

        from app.tasks.notify_task import send_notification
        for donor in matched:
            send_notification.delay(donor.user_id, request_id)

        for donor in matched:
            broadcast_match_to_donor(donor.user_id, {
                "type": "new_match",
                "request_id": request_id,
                "blood_type_needed": blood_request.blood_type_needed.value,
                "urgency": blood_request.urgency.value,
            })

        expand_radius_if_unfulfilled.apply_async(
            (request_id,), countdown=600
        )


@celery_app.task(name="expand_radius_if_unfulfilled")
def expand_radius_if_unfulfilled(request_id: int):
    import asyncio
    asyncio.run(_expand_radius_async(request_id))


async def _expand_radius_async(request_id: int):
    async with async_session() as db:
        result = await db.execute(select(Request).where(Request.id == request_id))
        blood_request = result.scalar_one_or_none()
        if not blood_request or blood_request.status != RequestStatus.OPEN:
            return

        matches_result = await db.execute(
            select(Match).where(
                and_(Match.request_id == request_id, Match.status == MatchStatus.ACCEPTED)
            )
        )
        if matches_result.scalars().first():
            return

        donors_result = await db.execute(select(Donor).where(Donor.is_available == True))
        for donor in donors_result.scalars().all():
            existing = await db.execute(
                select(Match).where(
                    and_(Match.request_id == request_id, Match.donor_id == donor.user_id)
                )
            )
            if not existing.scalar_one_or_none():
                donor.max_radius_km = donor.max_radius_km * 1.5

        await db.commit()
        match_request.delay(request_id)
