from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base

class PlexContent(Base):
    """
    Modèle pour stocker le contenu Plex (films, séries, etc.)
    """
    __tablename__ = "plex_content"

    id = Column(Integer, primary_key=True, index=True)
    plex_id = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # movie, show, episode, album, etc.
    year = Column(Integer, nullable=True)
    added_at = Column(DateTime(timezone=True), nullable=False)
    summary = Column(Text, nullable=True)
    
    # Chemins des images
    poster_path = Column(String(255), nullable=True)
    backdrop_path = Column(String(255), nullable=True)
    
    # Métadonnées supplémentaires (genres, acteurs, etc.)
    metadata = Column(JSON, default=dict)
    
    # Date d'ajout dans notre base
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indique si cet élément a déjà été inclus dans une newsletter
    included_in_newsletter = Column(Boolean, default=False)


class PlexLibrary(Base):
    """
    Modèle pour les bibliothèques Plex
    """
    __tablename__ = "plex_libraries"

    id = Column(Integer, primary_key=True, index=True)
    plex_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # movie, show, music, etc.
    
    # Drapeau pour indiquer si cette bibliothèque doit être surveillée pour les nouveautés
    monitor_for_newsletter = Column(Boolean, default=True)
    
    # Date de dernière synchronisation
    last_sync = Column(DateTime(timezone=True), nullable=True)
    
    # Date d'ajout
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 