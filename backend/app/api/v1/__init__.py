from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.recipes import router as recipes_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.admin import router as admin_router
from app.api.v1.payments import router as payments_router
from app.api.v1.partners import router as partners_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["system"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(recipes_router, prefix="/recipes", tags=["recipes"])
api_router.include_router(favorites_router, prefix="/favorites", tags=["favorites"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])
api_router.include_router(partners_router, prefix="/partners", tags=["partners"])