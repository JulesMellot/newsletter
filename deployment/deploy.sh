#!/bin/bash

# Script de déploiement automatique pour OVH
# À exécuter sur le serveur via un hook Git post-receive

set -e

echo "🚀 Démarrage du déploiement..."

# Répertoire de l'application
APP_DIR="/home/user/plex-newsletter"
REPO_DIR="$APP_DIR/repo"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

# Vérifier si le répertoire existe
if [ ! -d "$REPO_DIR" ]; then
  echo "❌ Le répertoire du dépôt n'existe pas. Création..."
  mkdir -p "$REPO_DIR"
fi

# Se déplacer dans le répertoire du dépôt
cd "$REPO_DIR"

# Extraire le code du dépôt Git
echo "📦 Extraction du code source..."
git --git-dir="$REPO_DIR/.git" --work-tree="$REPO_DIR" checkout -f

# Déploiement du backend
echo "🔧 Déploiement du backend..."
if [ ! -d "$BACKEND_DIR" ]; then
  mkdir -p "$BACKEND_DIR"
fi

# Copier les fichiers du backend
cp -r "$REPO_DIR/backend/"* "$BACKEND_DIR/"

# Installer les dépendances Python
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  echo "🐍 Création de l'environnement virtuel Python..."
  python3 -m venv venv
fi

source venv/bin/activate
echo "📚 Installation des dépendances Python..."
pip install -r requirements.txt

# Exécuter les migrations de base de données
echo "🗃️ Exécution des migrations de base de données..."
cd "$BACKEND_DIR"
alembic upgrade head

# Déploiement du frontend
echo "🎨 Déploiement du frontend..."
if [ ! -d "$FRONTEND_DIR" ]; then
  mkdir -p "$FRONTEND_DIR"
fi

# Copier les fichiers du frontend
cp -r "$REPO_DIR/frontend/"* "$FRONTEND_DIR/"

# Installer les dépendances Node.js
cd "$FRONTEND_DIR"
echo "📦 Installation des dépendances Node.js..."
npm install --production

# Construire l'application Next.js
echo "🏗️ Construction de l'application Next.js..."
npm run build

# Redémarrer les services
echo "🔄 Redémarrage des services..."

# Redémarrer le backend avec systemd
sudo systemctl restart plex-newsletter-backend

# Redémarrer le frontend avec systemd
sudo systemctl restart plex-newsletter-frontend

echo "✅ Déploiement terminé avec succès!" 