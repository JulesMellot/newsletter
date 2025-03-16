from fastapi import APIRouter

from app.api.routes import newsletters, plex, tautulli, templates

# Création du routeur principal
api_router = APIRouter()

# Ajout des sous-routeurs
api_router.include_router(newsletters.router, prefix="/newsletters", tags=["newsletters"])

# Ces routes seront implémentées plus tard
# api_router.include_router(plex.router, prefix="/plex", tags=["plex"])
# api_router.include_router(tautulli.router, prefix="/tautulli", tags=["tautulli"])
# api_router.include_router(templates.router, prefix="/templates", tags=["templates"]) 