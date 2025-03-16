/**
 * Intégration avec Plex pour le générateur de newsletter
 * Ce script facilite l'obtention des données depuis Plex
 */

// Configuration Plex
const plexConfig = {
    enabled: false,
    serverUrl: '',
    token: '',
    
    // Sauvegarder la configuration
    save() {
        localStorage.setItem('plex-config', JSON.stringify({
            enabled: this.enabled,
            serverUrl: this.serverUrl,
            token: this.token
        }));
    },
    
    // Charger la configuration
    load() {
        const saved = localStorage.getItem('plex-config');
        if (saved) {
            const config = JSON.parse(saved);
            this.enabled = config.enabled;
            this.serverUrl = config.serverUrl;
            this.token = config.token;
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger la configuration
    plexConfig.load();
    
    // Configurer le bouton de configuration
    const configBtn = document.getElementById('plex-config-btn');
    if (configBtn) {
        configBtn.addEventListener('click', showPlexConfigModal);
    }
    
    // Configurer le bouton du script Tautulli
    const scriptBtn = document.getElementById('show-tautulli-script-btn');
    if (scriptBtn) {
        scriptBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('tautulli-script-modal'));
            const scriptElement = document.getElementById('tautulli-script');
            if (scriptElement) {
                scriptElement.textContent = getTautulliScript();
            }
            modal.show();
        });
    }
});

// Afficher le modal de configuration
function showPlexConfigModal() {
    const modal = new bootstrap.Modal(document.getElementById('plex-config-modal'));
    const form = document.getElementById('plex-config-form');
    
    // Remplir le formulaire avec la configuration actuelle
    document.getElementById('plex-enabled').checked = plexConfig.enabled;
    document.getElementById('plex-server-url').value = plexConfig.serverUrl;
    document.getElementById('plex-token').value = plexConfig.token;
    
    // Gérer la soumission du formulaire
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            
            plexConfig.enabled = document.getElementById('plex-enabled').checked;
            plexConfig.serverUrl = document.getElementById('plex-server-url').value;
            plexConfig.token = document.getElementById('plex-token').value;
            
            plexConfig.save();
            modal.hide();
            
            showToast('Configuration Plex sauvegardée !');
        };
    }
    
    modal.show();
}

// Récupérer les éléments récemment ajoutés
async function getRecentlyAdded() {
    if (!plexConfig.enabled || !plexConfig.serverUrl || !plexConfig.token) {
        throw new Error('Configuration Plex incomplète');
    }
    
    try {
        const response = await fetch(`${plexConfig.serverUrl}/library/recentlyAdded?X-Plex-Token=${plexConfig.token}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des données');
        
        const data = await response.json();
        return parseMediaItems(data);
    } catch (error) {
        console.error('Erreur Plex:', error);
        throw error;
    }
}

// Parser les éléments média
function parseMediaItems(data) {
    const items = {
        movie: [],
        show: [],
        album: []
    };
    
    // Parser la réponse Plex
    // À implémenter selon la structure de réponse de votre serveur Plex
    
    return items;
}

// Obtenir le script Tautulli
function getTautulliScript() {
    return `// Script d'intégration Tautulli pour le générateur de newsletter
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter le style pour les éléments draggables
    const style = document.createElement('style');
    style.textContent = \`
        .media-poster {
            cursor: grab;
            transition: transform 0.2s;
        }
        .media-poster:hover {
            transform: scale(1.05);
        }
        .media-poster.dragging {
            opacity: 0.5;
        }
    \`;
    document.head.appendChild(style);
    
    // Rendre les posters draggables
    document.querySelectorAll('.media-poster').forEach(poster => {
        poster.setAttribute('draggable', 'true');
        
        poster.addEventListener('dragstart', (e) => {
            poster.classList.add('dragging');
            
            // Préparer les données pour le drag & drop
            const mediaData = {
                type: poster.dataset.type || 'movie',
                title: poster.dataset.title || '',
                year: poster.dataset.year || '',
                image: poster.dataset.image || '',
                description: poster.dataset.summary || ''
            };
            
            e.dataTransfer.setData('text/plain', JSON.stringify(mediaData));
        });
        
        poster.addEventListener('dragend', () => {
            poster.classList.remove('dragging');
        });
    });
});`;
}

// Ajouter des données de démo
function addDemoData(sectionId, type) {
    const demoItems = type === 'movies' ? getDemoMovies() :
                     type === 'tvshows' ? getDemoTVShows() :
                     getDemoAlbums();
    
    demoItems.forEach(item => {
        const event = new CustomEvent('drop', {
            detail: { data: item }
        });
        
        const container = document.getElementById(`media-container-${sectionId}`);
        if (container) {
            const data = new DataTransfer();
            data.setData('text/plain', JSON.stringify(item));
            
            const dropEvent = new DragEvent('drop', {
                dataTransfer: data,
                bubbles: true,
                cancelable: true
            });
            
            container.dispatchEvent(dropEvent);
        }
    });
}

// Données de démo pour les films
function getDemoMovies() {
    return [
        {
            type: 'movie',
            title: 'Inception',
            year: '2010',
            image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            description: 'Dom Cobb est un voleur expérimenté dans l\'art périlleux de l\'extraction : sa spécialité consiste à s\'approprier les secrets les plus précieux d\'un individu, enfouis au plus profond de son subconscient.'
        },
        {
            type: 'movie',
            title: 'Interstellar',
            year: '2014',
            image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            description: 'Dans un futur proche, la Terre est devenue hostile pour l\'homme. Les derniers habitants partent à la recherche d\'une nouvelle planète habitable.'
        }
    ];
}

// Données de démo pour les séries
function getDemoTVShows() {
    return [
        {
            type: 'tvshow',
            title: 'Breaking Bad',
            year: '2008',
            image: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
            description: 'Un professeur de chimie atteint d\'un cancer s\'associe à un ancien élève pour fabriquer et vendre de la méthamphétamine.'
        },
        {
            type: 'tvshow',
            title: 'Stranger Things',
            year: '2016',
            image: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
            description: 'Quand un jeune garçon disparaît, une petite ville découvre une affaire mystérieuse, des expériences secrètes et des forces surnaturelles.'
        }
    ];
}

// Données de démo pour les albums
function getDemoAlbums() {
    return [
        {
            type: 'album',
            title: 'Dark Side of the Moon',
            year: '1973',
            image: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
            description: 'Album emblématique de Pink Floyd'
        },
        {
            type: 'album',
            title: 'Thriller',
            year: '1982',
            image: 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
            description: 'Album légendaire de Michael Jackson'
        }
    ];
}

// Exposer les fonctions nécessaires
window.plexIntegration = {
    getRecentlyAdded,
    addDemoData
}; 