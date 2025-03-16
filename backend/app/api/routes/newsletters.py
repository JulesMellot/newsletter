from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.newsletter import Newsletter
from app.schemas.newsletter import (
    NewsletterCreate, 
    NewsletterUpdate, 
    NewsletterResponse, 
    NewsletterList,
    NewsletterSendResponse
)
from app.services.newsletter_service import newsletter_service

router = APIRouter()


@router.post("/", response_model=NewsletterResponse, status_code=status.HTTP_201_CREATED)
async def create_newsletter(
    newsletter: NewsletterCreate, db: Session = Depends(get_db)
):
    """
    Crée une nouvelle newsletter
    """
    try:
        db_newsletter = await newsletter_service.create_newsletter(db, newsletter.dict())
        return db_newsletter
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la création de la newsletter: {str(e)}"
        )


@router.get("/", response_model=List[NewsletterList])
async def get_newsletters(
    skip: int = 0, 
    limit: int = 100, 
    drafts_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des newsletters
    """
    newsletters = await newsletter_service.get_newsletters(db, skip, limit, drafts_only)
    return newsletters


@router.get("/{newsletter_id}", response_model=NewsletterResponse)
async def get_newsletter(newsletter_id: int, db: Session = Depends(get_db)):
    """
    Récupère une newsletter par son ID
    """
    newsletter = await newsletter_service.get_newsletter(db, newsletter_id)
    if newsletter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter non trouvée"
        )
    return newsletter


@router.put("/{newsletter_id}", response_model=NewsletterResponse)
async def update_newsletter(
    newsletter_id: int, 
    newsletter: NewsletterUpdate, 
    db: Session = Depends(get_db)
):
    """
    Met à jour une newsletter existante
    """
    db_newsletter = await newsletter_service.update_newsletter(
        db, newsletter_id, newsletter.dict(exclude_unset=True)
    )
    if db_newsletter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter non trouvée"
        )
    return db_newsletter


@router.delete("/{newsletter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_newsletter(newsletter_id: int, db: Session = Depends(get_db)):
    """
    Supprime une newsletter
    """
    success = await newsletter_service.delete_newsletter(db, newsletter_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter non trouvée"
        )
    return None


@router.post("/{newsletter_id}/send", response_model=NewsletterSendResponse)
async def send_newsletter(newsletter_id: int, db: Session = Depends(get_db)):
    """
    Envoie une newsletter aux destinataires configurés
    """
    result = await newsletter_service.send_newsletter(db, newsletter_id)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Erreur lors de l'envoi de la newsletter")
        )
    
    return {"success": True, "message": "Newsletter envoyée avec succès"} 