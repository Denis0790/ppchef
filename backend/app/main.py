from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import init_redis, close_redis
from app.api.v1 import api_router


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
