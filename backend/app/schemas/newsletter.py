from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class NewsletterBase(BaseModel):
    """
    Attributs de base d'une newsletter
    """
    title: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class NewsletterCreate(NewsletterBase):
    """
    Attributs pour créer une newsletter
    """
    content: Optional[Dict[str, Any]] = Field(default_factory=dict)
    send_config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_draft: bool = True


class NewsletterUpdate(BaseModel):
    """
    Attributs pour mettre à jour une newsletter
    """
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    send_config: Optional[Dict[str, Any]] = None
    is_draft: Optional[bool] = None


class NewsletterList(NewsletterBase):
    """
    Attributs pour lister les newsletters
    """
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    is_draft: bool

    class Config:
        orm_mode = True


class NewsletterResponse(NewsletterList):
    """
    Réponse complète pour une newsletter
    """
    content: Dict[str, Any]
    send_config: Dict[str, Any]

    class Config:
        orm_mode = True


class NewsletterSendResponse(BaseModel):
    """
    Réponse pour l'envoi d'une newsletter
    """
    success: bool
    message: str


class NewsletterSendLogBase(BaseModel):
    """
    Attributs de base d'un journal d'envoi
    """
    newsletter_id: int
    status: str
    recipients_count: int
    error_message: Optional[str] = None
    send_config_snapshot: Dict[str, Any]


class NewsletterSendLogResponse(NewsletterSendLogBase):
    """
    Réponse pour un journal d'envoi
    """
    id: int
    sent_at: datetime

    class Config:
        orm_mode = True


class NewsletterTemplateBase(BaseModel):
    """
    Attributs de base d'un template de newsletter
    """
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    html_content: str
    css_content: Optional[str] = None
    structure: Dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False


class NewsletterTemplateCreate(NewsletterTemplateBase):
    """
    Attributs pour créer un template de newsletter
    """
    pass


class NewsletterTemplateUpdate(BaseModel):
    """
    Attributs pour mettre à jour un template de newsletter
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    html_content: Optional[str] = None
    css_content: Optional[str] = None
    structure: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None


class NewsletterTemplateResponse(NewsletterTemplateBase):
    """
    Réponse pour un template de newsletter
    """
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True 