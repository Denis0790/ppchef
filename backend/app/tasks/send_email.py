from app.tasks.celery_app import celery_app
from app.core.config import settings
import resend


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to: str, subject: str, html: str):
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception as exc:
        raise self.retry(exc=exc)