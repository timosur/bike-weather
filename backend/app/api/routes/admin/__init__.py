from fastapi import APIRouter

from app.api.routes.admin.about import router as about_router
from app.api.routes.admin.contacts import router as contacts_router
from app.api.routes.admin.faq import router as faq_router
from app.api.routes.admin.products import router as products_router

admin_router = APIRouter(prefix="/admin", tags=["admin"])
admin_router.include_router(products_router)
admin_router.include_router(faq_router)
admin_router.include_router(about_router)
admin_router.include_router(contacts_router)
