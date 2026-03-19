from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to: str, subject: str, html: str):
    """Отправка email через Resend. Подключим когда дойдём до auth."""
    try:
        # import resend — подключим позже
        pass
    except Exception as exc:
        raise self.retry(exc=exc)
