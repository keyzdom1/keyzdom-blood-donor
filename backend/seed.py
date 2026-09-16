import asyncio
from datetime import datetime, timedelta, timezone
from app.database import async_session, engine, Base
from app.models.user import User, UserRole
from app.models.donor import Donor, BloodType
from app.models.organization import Organization, OrgType
from app.models.request import Request, Urgency, RequestStatus
from app.models.match import Match, MatchStatus
from app.models.notification_log import NotificationLog, NotificationChannel
from app.services.auth import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        users_data = [
            {"role": UserRole.ADMIN, "name": "Admin User", "contact": "donworldwider2@gmail.com", "password": "magNITUDE1."},
            {"role": UserRole.HOSPITAL_STAFF, "name": "LUTH Staff", "contact": "luth@hospital.com", "password": "hospital123"},
            {"role": UserRole.HOSPITAL_STAFF, "name": "Reddington Staff", "contact": "reddington@hospital.com", "password": "hospital123"},
            {"role": UserRole.HOSPITAL_STAFF, "name": "Gbagada General Staff", "contact": "gbagada@hospital.com", "password": "hospital123"},
            {"role": UserRole.DONOR, "name": "Adaeze Okonkwo", "contact": "adaeze@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Chukwuemeka Obi", "contact": "emeka@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Fatima Abdullahi", "contact": "fatima@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Tunde Bakare", "contact": "tunde@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Ngozi Eze", "contact": "ngozi@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Yusuf Mohammed", "contact": "yusuf@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Amina Bello", "contact": "amina@email.com", "password": "donor123"},
            {"role": UserRole.DONOR, "name": "Kemi Adeyemi", "contact": "kemi@email.com", "password": "donor123"},
        ]

        users = []
        for u in users_data:
            user = User(
                role=u["role"],
                name=u["name"],
                contact=u["contact"],
                password_hash=hash_password(u["password"]),
            )
            db.add(user)
            users.append(user)
        await db.flush()

        hospitals = [
            {"name": "Lagos University Teaching Hospital (LUTH)", "lat": 6.5158, "lng": 3.3896},
            {"name": "Reddington Hospital, Victoria Island", "lat": 6.4281, "lng": 3.4219},
            {"name": "Gbagada General Hospital", "lat": 6.4610, "lng": 3.3920},
        ]

        orgs = []
        for i, h in enumerate(hospitals):
            point = f"SRID=4326;POINT({h['lng']} {h['lat']})"
            org = Organization(
                name=h["name"],
                type=OrgType.HOSPITAL,
                verified=True,
                location=point,
            )
            db.add(org)
            orgs.append(org)

        blood_bank = Organization(
            name="National Blood Service Commission",
            type=OrgType.BLOOD_BANK,
            verified=True,
            location="SRID=4326;POINT(3.3960 6.4540)",
        )
        db.add(blood_bank)
        orgs.append(blood_bank)
        await db.flush()

        donors_data = [
            {"user": users[4], "blood": BloodType.O_POS, "lat": 6.4413, "lng": 3.4219, "radius": 20.0},
            {"user": users[5], "blood": BloodType.A_POS, "lat": 6.4700, "lng": 3.3900, "radius": 25.0},
            {"user": users[6], "blood": BloodType.B_NEG, "lat": 6.4250, "lng": 3.3600, "radius": 30.0},
            {"user": users[7], "blood": BloodType.O_NEG, "lat": 6.4550, "lng": 3.4100, "radius": 15.0},
            {"user": users[8], "blood": BloodType.AB_POS, "lat": 6.4350, "lng": 3.3800, "radius": 25.0},
            {"user": users[9], "blood": BloodType.B_POS, "lat": 6.4600, "lng": 3.4300, "radius": 20.0},
            {"user": users[10], "blood": BloodType.O_POS, "lat": 6.4200, "lng": 3.4000, "radius": 25.0},
            {"user": users[11], "blood": BloodType.A_NEG, "lat": 6.4750, "lng": 3.3750, "radius": 30.0},
        ]

        donors = []
        for d in donors_data:
            point = f"SRID=4326;POINT({d['lng']} {d['lat']})"
            donor = Donor(
                user_id=d["user"].id,
                blood_type=d["blood"],
                dob=datetime(1995, 1, 1, tzinfo=timezone.utc),
                last_donation_date=datetime.now(timezone.utc) - timedelta(days=90),
                home_location=point,
                max_radius_km=d["radius"],
                is_available=True,
            )
            db.add(donor)
            donors.append(donor)
        await db.flush()

        now = datetime.now(timezone.utc)
        requests_data = [
            {
                "org": orgs[0],
                "blood": BloodType.O_POS,
                "units": 5,
                "urgency": Urgency.CRITICAL,
                "status": RequestStatus.OPEN,
                "expires": now + timedelta(hours=6),
            },
            {
                "org": orgs[1],
                "blood": BloodType.A_POS,
                "units": 3,
                "urgency": Urgency.HIGH,
                "status": RequestStatus.OPEN,
                "expires": now + timedelta(hours=24),
            },
            {
                "org": orgs[2],
                "blood": BloodType.B_NEG,
                "units": 2,
                "urgency": Urgency.NORMAL,
                "status": RequestStatus.OPEN,
                "expires": now + timedelta(hours=48),
            },
            {
                "org": orgs[0],
                "blood": BloodType.AB_POS,
                "units": 4,
                "urgency": Urgency.HIGH,
                "status": RequestStatus.IN_PROGRESS,
                "expires": now + timedelta(hours=12),
            },
            {
                "org": orgs[3],
                "blood": BloodType.O_NEG,
                "units": 8,
                "urgency": Urgency.CRITICAL,
                "status": RequestStatus.OPEN,
                "expires": now + timedelta(hours=4),
            },
        ]

        reqs = []
        for r in requests_data:
            req = Request(
                org_id=r["org"].id,
                blood_type_needed=r["blood"],
                units_needed=r["units"],
                urgency=r["urgency"],
                status=r["status"],
                expires_at=r["expires"],
            )
            db.add(req)
            reqs.append(req)
        await db.flush()

        matches_data = [
            {"request": reqs[3], "donor": donors[1], "dist": 3.2, "status": MatchStatus.ACCEPTED},
            {"request": reqs[3], "donor": donors[4], "dist": 5.8, "status": MatchStatus.NOTIFIED},
            {"request": reqs[4], "donor": donors[3], "dist": 1.5, "status": MatchStatus.NOTIFIED},
        ]

        for m in matches_data:
            match = Match(
                request_id=m["request"].id,
                donor_id=m["donor"].user_id,
                distance_km=m["dist"],
                status=m["status"],
            )
            db.add(match)
        await db.flush()

        await db.commit()
        print("Database seeded successfully!")
        print(f"  - {len(users)} users (admin + 3 hospitals + 8 donors)")
        print(f"  - {len(orgs)} organizations (3 hospitals + 1 blood bank)")
        print(f"  - {len(donors)} donors")
        print(f"  - {len(reqs)} blood requests")
        print(f"  - {len(matches_data)} matches")
        print()
        print("Login credentials:")
        print("  Admin:    donworldwider2@gmail.com / magNITUDE1.")
        print("  Hospital: luth@hospital.com / hospital123")
        print("  Donor:    adaeze@email.com / donor123")


if __name__ == "__main__":
    asyncio.run(seed())
