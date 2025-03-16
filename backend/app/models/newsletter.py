from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base

class Newsletter(Base):
    """
    Modèle de newsletter stocké en base de données
    """
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    is_draft = Column(Boolean, default=True)
    
    # Structure JSON des sections de la newsletter
    content = Column(JSON, default=dict)
    
    # Configuration d'envoi (destinataires, etc.)
    send_config = Column(JSON, default=dict)
    
    # Relation avec l'historique d'envoi
    send_logs = relationship("NewsletterSendLog", back_populates="newsletter")


class NewsletterSendLog(Base):
    """
    Journal d'envoi des newsletters
    """
    __tablename__ = "newsletter_send_logs"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"))
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False)  # success, error
    recipients_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Configuration utilisée pour l'envoi
    send_config_snapshot = Column(JSON, default=dict)
    
    # Relation avec la newsletter
    newsletter = relationship("Newsletter", back_populates="send_logs")


class NewsletterTemplate(Base):
    """
    Modèle pour les templates de newsletter
    """
    __tablename__ = "newsletter_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # HTML du template avec placeholders
    html_content = Column(Text, nullable=False)
    
    # CSS pour le style
    css_content = Column(Text, nullable=True)
    
    # Structure JSON définissant les zones éditables
    structure = Column(JSON, default=dict)
    
    # Indique si c'est le template par défaut
    is_default = Column(Boolean, default=False) 