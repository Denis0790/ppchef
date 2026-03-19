from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ppchef",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.send_email",
        "app.tasks.s3_upload",
        "app.tasks.import_recipes",
        "app.tasks.import_fitstars",
        "app.tasks.import_povarenok",
        "app.tasks.enrich_recipes",
        "app.tasks.import_1000menu",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Moscow",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    beat_schedule={},
)