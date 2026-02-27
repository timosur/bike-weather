from fastapi import APIRouter

from app.api.routes.about import router as about_router
from app.api.routes.admin import admin_router
from app.api.routes.app_info import router as app_info_router
from app.api.routes.auth import router as auth_router
from app.api.routes.contact import router as contact_router
from app.api.routes.faq import router as faq_router
from app.api.routes.geocoding import router as geocoding_router
from app.api.routes.products import router as products_router
from app.api.routes.rides import router as rides_router
from app.api.routes.routes import router as routes_router
from app.api.routes.shared import router as shared_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(faq_router)
api_router.include_router(about_router)
api_router.include_router(app_info_router)
api_router.include_router(contact_router)
api_router.include_router(geocoding_router)
api_router.include_router(rides_router)
api_router.include_router(routes_router)
api_router.include_router(shared_router)
api_router.include_router(admin_router)
