import json
import hashlib
from functools import wraps
from typing import Any, Callable
import redis.asyncio as aioredis
from app.core.config import settings

# ── Redis клиент ──────────────────────────────────────────────
_redis: aioredis.Redis | None = None

async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis

# ── Получить из кеша ──────────────────────────────────────────
async def cache_get(key: str) -> Any | None:
    try:
        r = await get_redis()
        value = await r.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None

# ── Записать в кеш ────────────────────────────────────────────
async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    try:
        r = await get_redis()
        await r.set(key, json.dumps(value, ensure_ascii=False), ex=ttl)
    except Exception:
        pass

# ── Инвалидировать по префиксу ────────────────────────────────
async def cache_invalidate(prefix: str) -> None:
    try:
        r = await get_redis()
        keys = await r.keys(f"{prefix}*")
        if keys:
            await r.delete(*keys)
    except Exception:
        pass