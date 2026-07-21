from starlette.middleware.base import BaseHTTPMiddleware
from app.core.redis import get_redis

class OnlineHeartbeatMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        redis = await get_redis()
        if redis:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                ip = forwarded.split(",")[0].strip()
            else:
                ip = request.client.host if request.client else "unknown"
            await redis.setex(f"online:{ip}", 120, 1)
        return await call_next(request)