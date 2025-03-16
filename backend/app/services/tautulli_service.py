import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class TautulliService:
    """
    Service pour interagir avec l'API Tautulli
    """
    def __init__(self):
        self.base_url = settings.TAUTULLI_URL.rstrip("/")
        self.api_key = settings.TAUTULLI_API_KEY
        
    async def _make_request(self, cmd: str, params: Dict[str, Any] = None) -> Dict:
        """
        Effectue une requête à l'API Tautulli
        """
        if params is None:
            params = {}
            
        # Paramètres de base pour toutes les requêtes
        base_params = {
            "apikey": self.api_key,
            "cmd": cmd
        }
        
        # Fusionner les paramètres
        params.update(base_params)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/v2", params=params) as response:
                    if response.status != 200:
                        logger.error(f"Tautulli API error: {response.status} - {await response.text()}")
                        return {"error": f"API error: {response.status}"}
                    
                    data = await response.json()
                    return data
        except Exception as e:
            logger.exception(f"Error calling Tautulli API: {str(e)}")
            return {"error": str(e)}
    
    async def get_recently_added_media(self, count: int = 20, days: int = 30) -> List[Dict]:
        """
        Récupère les médias récemment ajoutés à Plex
        """
        # Calculer la date limite (N jours en arrière)
        start_date = datetime.now() - timedelta(days=days)
        start_timestamp = int(start_date.timestamp())
        
        params = {
            "count": count,
            "start_date": start_timestamp
        }
        
        response = await self._make_request("get_recently_added", params)
        
        if "error" in response:
            logger.error(f"Error getting recently added media: {response['error']}")
            return []
        
        # Extraire les données pertinentes
        try:
            return response.get("response", {}).get("data", {}).get("recently_added", [])
        except (KeyError, AttributeError) as e:
            logger.error(f"Error parsing recently added media response: {str(e)}")
            return []
    
    async def get_libraries(self) -> List[Dict]:
        """
        Récupère la liste des bibliothèques Plex
        """
        response = await self._make_request("get_libraries")
        
        if "error" in response:
            logger.error(f"Error getting libraries: {response['error']}")
            return []
        
        # Extraire les données pertinentes
        try:
            return response.get("response", {}).get("data", [])
        except (KeyError, AttributeError) as e:
            logger.error(f"Error parsing libraries response: {str(e)}")
            return []
    
    async def send_newsletter(self, subject: str, body: str, recipients: List[str]) -> Dict:
        """
        Envoie une newsletter via Tautulli
        """
        params = {
            "subject": subject,
            "body": body,
            "to": ",".join(recipients),
            "html_body": "1"  # Indiquer que le corps est en HTML
        }
        
        response = await self._make_request("notify", params)
        
        if "error" in response:
            logger.error(f"Error sending newsletter: {response['error']}")
            return {"success": False, "error": response["error"]}
        
        # Vérifier le succès
        if response.get("response", {}).get("result") == "success":
            return {"success": True}
        else:
            error_msg = response.get("response", {}).get("message", "Unknown error")
            logger.error(f"Error sending newsletter: {error_msg}")
            return {"success": False, "error": error_msg}


# Instanciation du service
tautulli_service = TautulliService() 