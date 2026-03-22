from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import init_redis, close_redis, get_redis
from app.api.v1 import api_router
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="ПП Шеф API",
    version="1.0.0",
    debug=settings.APP_DEBUG,
    # в продакшне скрываем документацию
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/redoc" if settings.APP_ENV == "development" else None,
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,          # нужно для httpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Роутеры ──────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")

@app.middleware("http")
async def count_requests(request, call_next):
    response = await call_next(request)
    # Считаем RPS через скользящее окно
    try:
        redis = await get_redis()
        if redis:
            key = f"rps:window:{int(time.time())}"
            await redis.incr(key)
            await redis.expire(key, 10)
            # Считаем среднее за последние 10 секунд
            total = 0
            for i in range(10):
                val = await redis.get(f"rps:window:{int(time.time()) - i}")
                if val:
                    total += int(val)
            await redis.set("rps:current", total / 10)
    except Exception:
        pass
    return response
