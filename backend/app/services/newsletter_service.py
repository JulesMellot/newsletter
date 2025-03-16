import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.newsletter import Newsletter, NewsletterSendLog, NewsletterTemplate
from app.services.tautulli_service import tautulli_service

logger = logging.getLogger(__name__)

class NewsletterService:
    """
    Service pour la gestion des newsletters
    """
    
    async def create_newsletter(self, db: Session, newsletter_data: Dict[str, Any]) -> Newsletter:
        """
        Crée une nouvelle newsletter
        """
        try:
            newsletter = Newsletter(
                title=newsletter_data["title"],
                subject=newsletter_data["subject"],
                description=newsletter_data.get("description", ""),
                content=newsletter_data.get("content", {}),
                send_config=newsletter_data.get("send_config", {}),
                is_draft=newsletter_data.get("is_draft", True)
            )
            
            db.add(newsletter)
            db.commit()
            db.refresh(newsletter)
            
            return newsletter
        except Exception as e:
            db.rollback()
            logger.exception(f"Error creating newsletter: {str(e)}")
            raise
    
    async def update_newsletter(
        self, db: Session, newsletter_id: int, newsletter_data: Dict[str, Any]
    ) -> Optional[Newsletter]:
        """
        Met à jour une newsletter existante
        """
        try:
            newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
            if not newsletter:
                return None
                
            # Mise à jour des champs
            for key, value in newsletter_data.items():
                if hasattr(newsletter, key):
                    setattr(newsletter, key, value)
            
            db.commit()
            db.refresh(newsletter)
            
            return newsletter
        except Exception as e:
            db.rollback()
            logger.exception(f"Error updating newsletter: {str(e)}")
            raise
    
    async def get_newsletter(self, db: Session, newsletter_id: int) -> Optional[Newsletter]:
        """
        Récupère une newsletter par son ID
        """
        return db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
    
    async def get_newsletters(
        self, db: Session, skip: int = 0, limit: int = 100, drafts_only: bool = False
    ) -> List[Newsletter]:
        """
        Récupère la liste des newsletters
        """
        query = db.query(Newsletter)
        
        if drafts_only:
            query = query.filter(Newsletter.is_draft == True)
            
        return query.order_by(Newsletter.created_at.desc()).offset(skip).limit(limit).all()
    
    async def delete_newsletter(self, db: Session, newsletter_id: int) -> bool:
        """
        Supprime une newsletter
        """
        try:
            newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
            if not newsletter:
                return False
                
            db.delete(newsletter)
            db.commit()
            
            return True
        except Exception as e:
            db.rollback()
            logger.exception(f"Error deleting newsletter: {str(e)}")
            raise
    
    async def send_newsletter(self, db: Session, newsletter_id: int) -> Dict[str, Any]:
        """
        Envoie une newsletter aux destinataires configurés
        """
        try:
            # Récupérer la newsletter
            newsletter = await self.get_newsletter(db, newsletter_id)
            if not newsletter:
                return {"success": False, "error": "Newsletter not found"}
            
            # Vérifier si la newsletter est un brouillon
            if newsletter.is_draft:
                return {"success": False, "error": "Cannot send a draft newsletter"}
            
            # Générer le HTML de la newsletter
            html_content = await self._generate_newsletter_html(db, newsletter)
            
            # Récupérer les destinataires
            recipients = newsletter.send_config.get("recipients", [])
            if not recipients:
                return {"success": False, "error": "No recipients configured"}
            
            # Envoyer via Tautulli
            result = await tautulli_service.send_newsletter(
                subject=newsletter.subject,
                body=html_content,
                recipients=recipients
            )
            
            # Enregistrer le résultat
            log = NewsletterSendLog(
                newsletter_id=newsletter.id,
                status="success" if result.get("success", False) else "error",
                recipients_count=len(recipients),
                error_message=result.get("error"),
                send_config_snapshot=newsletter.send_config
            )
            
            db.add(log)
            
            # Mettre à jour la newsletter
            if result.get("success", False):
                newsletter.sent_at = datetime.now()
                newsletter.is_draft = False
            
            db.commit()
            
            return result
        except Exception as e:
            db.rollback()
            logger.exception(f"Error sending newsletter: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _generate_newsletter_html(self, db: Session, newsletter: Newsletter) -> str:
        """
        Génère le HTML de la newsletter à partir de son contenu et d'un template
        """
        try:
            # Récupérer le template (utiliser le template par défaut si non spécifié)
            template_id = newsletter.send_config.get("template_id")
            
            if template_id:
                template = db.query(NewsletterTemplate).filter(NewsletterTemplate.id == template_id).first()
            else:
                template = db.query(NewsletterTemplate).filter(NewsletterTemplate.is_default == True).first()
            
            if not template:
                # Utiliser un template simple par défaut
                return self._generate_default_html(newsletter)
            
            # Remplacer les variables dans le template
            html_content = template.html_content
            
            # TODO: Implémenter un moteur de template plus sophistiqué
            # Pour l'instant, nous utilisons un remplacement simple
            
            # Remplacer les variables de base
            html_content = html_content.replace("{{newsletter_title}}", newsletter.title)
            html_content = html_content.replace("{{newsletter_description}}", newsletter.description or "")
            
            # Traiter le contenu structuré de la newsletter
            sections_html = ""
            for section in newsletter.content.get("sections", []):
                section_html = self._render_section(section)
                sections_html += section_html
            
            html_content = html_content.replace("{{newsletter_content}}", sections_html)
            
            return html_content
        except Exception as e:
            logger.exception(f"Error generating newsletter HTML: {str(e)}")
            # Fallback au template par défaut
            return self._generate_default_html(newsletter)
    
    def _generate_default_html(self, newsletter: Newsletter) -> str:
        """
        Génère un HTML par défaut simple pour la newsletter
        """
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{newsletter.title}</title>
            <style>
                body {{ font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }}
                h1 {{ color: #2c3e50; }}
                h2 {{ color: #3498db; margin-top: 30px; }}
                img {{ max-width: 100%; height: auto; border-radius: 5px; }}
                .item {{ margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }}
                .item-image {{ float: left; margin-right: 15px; width: 150px; }}
                .item-content {{ overflow: hidden; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #7f8c8d; }}
                @media (max-width: 600px) {{
                    .item-image {{ float: none; margin-right: 0; width: 100%; margin-bottom: 15px; }}
                }}
            </style>
        </head>
        <body>
            <h1>{newsletter.title}</h1>
            <p>{newsletter.description or ""}</p>
        """
        
        # Ajouter le contenu des sections
        for section in newsletter.content.get("sections", []):
            html += self._render_section(section)
        
        # Pied de page
        html += """
            <div class="footer">
                <p>Cette newsletter est générée automatiquement par votre serveur Plex.</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _render_section(self, section: Dict[str, Any]) -> str:
        """
        Génère le HTML pour une section de la newsletter
        """
        section_type = section.get("type", "text")
        section_title = section.get("title", "")
        
        html = f"<h2>{section_title}</h2>"
        
        if section_type == "text":
            html += f"<p>{section.get('content', '')}</p>"
        
        elif section_type == "media_items":
            items = section.get("items", [])
            for item in items:
                html += f"""
                <div class="item">
                    <div class="item-image">
                        <img src="{item.get('poster_url', '')}" alt="{item.get('title', 'Media')}">
                    </div>
                    <div class="item-content">
                        <h3>{item.get('title', '')}</h3>
                        <p>{item.get('year', '')}</p>
                        <p>{item.get('summary', '')}</p>
                    </div>
                    <div style="clear:both;"></div>
                </div>
                """
        
        return html


# Instanciation du service
newsletter_service = NewsletterService() 