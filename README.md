# Plex Newsletter Manager

Une application web moderne pour créer et envoyer des newsletters dynamiques basées sur le contenu de votre serveur Plex, en utilisant Tautulli pour l'envoi.

## Fonctionnalités principales

- Interface de création de newsletter avec drag & drop pour l'organisation des sections
- Récupération automatique des nouveaux ajouts Plex via l'API Tautulli
- Sections personnalisées manuelles
- Prévisualisation en temps réel
- Génération de templates HTML responsive
- Envoi automatique via l'API Tautulli
- Historique des newsletters envoyées
- Mode sombre disponible

## Architecture

- **Frontend**: Next.js (React)
- **Backend**: FastAPI (Python)
- **Base de données**: PostgreSQL
- **Intégration**: APIs Tautulli et Plex

## Installation

### Prérequis

- Node.js 18+
- Python 3.9+
- PostgreSQL
- Un serveur Plex et Tautulli configuré

### Installation du frontend

```bash
cd frontend
npm install
npm run dev
```

### Installation du backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Variables d'environnement

Créez un fichier `.env` dans le dossier backend:

```
DATABASE_URL=postgresql://user:password@localhost/plexnewsletter
TAUTULLI_URL=http://votre-serveur-tautulli:port
TAUTULLI_API_KEY=votre-clé-api
PLEX_URL=http://votre-serveur-plex:port
PLEX_TOKEN=votre-token-plex
```

## Déploiement

L'application est configurée pour un déploiement automatique sur OVH via Git. Consultez le dossier `deployment` pour les instructions détaillées.

## Licence

MIT 