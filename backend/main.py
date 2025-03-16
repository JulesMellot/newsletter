import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path

# Chargement des variables d'environnement
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Import des composants de l'application
from app.core.config import settings
from app.api.api import api_router

# Initialisation de l'application FastAPI
app = FastAPI(
    title="Plex Newsletter API",
    description="API pour la gestion des newsletters Plex",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ajout du routeur API avec préfixe
app.include_router(api_router, prefix=settings.API_V1_STR)

# Routes de base
@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Plex Newsletter"}

@app.get("/health")
async def health_check():
    return {"status": "OK"}

# Gestionnaire d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Une erreur s'est produite sur le serveur", "detail": str(exc)}
    )

# Point d'entrée pour l'exécution directe
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 