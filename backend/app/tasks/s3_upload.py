from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def upload_image_to_s3(self, local_path: str, s3_key: str):
    """Загрузка картинки в S3. Подключим когда дойдём до загрузки файлов."""
    try:
        pass
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task
def delete_s3_folder(prefix: str):
    """Удаление папки из S3 (при публикации рецепта пользователя)."""
    pass
