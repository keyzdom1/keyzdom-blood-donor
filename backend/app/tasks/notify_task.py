from datetime import datetime, timezone
from app.tasks.celery_app import celery_app
from app.config import get_settings
from app.database import async_session
from app.models.notification_log import NotificationLog, NotificationChannel
from app.models.donor import Donor
from app.models.user import User
from app.models.request import Request

settings = get_settings()


@celery_app.task(name="send_notification", bind=True, max_retries=3)
def send_notification(self, donor_id: int, request_id: int):
    try:
        import asyncio
        asyncio.run(_send_notification_async(donor_id, request_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


async def _send_notification_async(donor_id: int, request_id: int):
    async with async_session() as db:
        from sqlalchemy import select
        donor_result = await db.execute(select(Donor).where(Donor.user_id == donor_id))
        donor = donor_result.scalar_one_or_none()
        user_result = await db.execute(select(User).where(User.id == donor_id))
        user = user_result.scalar_one_or_none()
        req_result = await db.execute(select(Request).where(Request.id == request_id))
        blood_request = req_result.scalar_one_or_none()

        if not donor or not user or not blood_request:
            return

        payload = {
            "donor_name": user.name,
            "blood_type_needed": blood_request.blood_type_needed.value,
            "units_needed": blood_request.units_needed,
            "urgency": blood_request.urgency.value,
            "request_id": blood_request.id,
        }

        push_result = await _send_push(user, payload)
        sms_result = await _send_sms(user, payload)
        email_result = await _send_email(user, payload)

        from sqlalchemy import select as sel
        match_result = await db.execute(
            sel(NotificationLog).where(
                NotificationLog.match_id == request_id
            )
        )

        for channel, status in [
            (NotificationChannel.PUSH, push_result),
            (NotificationChannel.SMS, sms_result),
            (NotificationChannel.EMAIL, email_result),
        ]:
            log = NotificationLog(
                match_id=request_id,
                channel=channel,
                delivery_status=status,
            )
            db.add(log)

        await db.commit()


async def _send_push(user: User, payload: dict) -> str:
    if not settings.FIREBASE_CREDENTIALS_PATH:
        print(f"[STUB] Push notification -> user={user.id}, blood_type={payload['blood_type_needed']}, urgency={payload['urgency']}")
        return "stub_sent"

    try:
        # TODO: Integrate Firebase Cloud Messaging
        # from firebase_admin import messaging
        # message = messaging.MulticastMessage(
        #     notification=messaging.Notification(
        #         title=f"Urgent: {payload['blood_type_needed']} Blood Needed",
        #         body=f"{payload['units_needed']} units needed ({payload['urgency']}). Tap to respond.",
        #     ),
        #     tokens=...,  # user's FCM tokens
        # )
        # response = messaging.send_each_for_multicast(message)
        # return "sent" if response.failure_count == 0 else "partial"
        print(f"[STUB] Push notification -> user={user.id}")
        return "stub_sent"
    except Exception as e:
        print(f"[ERROR] Push failed: {e}")
        return "failed"


async def _send_sms(user: User, payload: dict) -> str:
    if not settings.TWILIO_ACCOUNT_SID:
        print(f"[STUB] SMS notification -> user={user.id}, contact={user.contact}, blood_type={payload['blood_type_needed']}")
        return "stub_sent"

    try:
        # TODO: Integrate Twilio
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # message = client.messages.create(
        #     body=f"[Keyzdom] URGENT: {payload['blood_type_needed']} blood needed ({payload['units_needed']} units). "
        #          f"Urgency: {payload['urgency']}. Open the app to respond.",
        #     from_=settings.TWILIO_FROM_NUMBER,
        #     to=user.contact,
        # )
        # return "sent" if message.sid else "failed"
        print(f"[STUB] SMS notification -> user={user.id}, to={user.contact}")
        return "stub_sent"
    except Exception as e:
        print(f"[ERROR] SMS failed: {e}")
        return "failed"


async def _send_email(user: User, payload: dict) -> str:
    if not settings.SENDGRID_API_KEY:
        print(f"[STUB] Email notification -> user={user.id}, contact={user.contact}, blood_type={payload['blood_type_needed']}")
        return "stub_sent"

    try:
        # TODO: Integrate SendGrid
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        # message = Mail(
        #     from_email=settings.SENDGRID_FROM_EMAIL,
        #     to_emails=user.contact,
        #     subject=f"[Keyzdom] Urgent Blood Request: {payload['blood_type_needed']}",
        #     html_content=f"<h2>Urgent Blood Request</h2>"
        #                  f"<p><strong>{payload['units_needed']} units</strong> of <strong>{payload['blood_type_needed']}</strong> needed.</p>"
        #                  f"<p>Urgency: {payload['urgency']}</p>"
        #                  f"<p>Open Keyzdom to respond to this request.</p>",
        # )
        # sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        # sg.send(message)
        # return "sent"
        print(f"[STUB] Email notification -> user={user.id}, to={user.contact}")
        return "stub_sent"
    except Exception as e:
        print(f"[ERROR] Email failed: {e}")
        return "failed"
