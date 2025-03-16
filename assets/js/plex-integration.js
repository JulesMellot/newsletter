/**
 * Intégration avec Plex pour le générateur de newsletter
 * Ce script facilite l'obtention des données depuis Plex
 */

// Configuration pour l'intégration avec Plex
const plexConfig = {
    enabled: false,
    serverUrl: '',
    token: '',
    // Sauvegarde de la configuration dans le stockage local
    save: function() {
        localStorage.setItem('plex_config', JSON.stringify({
            enabled: this.enabled,
            serverUrl: this.serverUrl,
            token: this.token
        }));
    },
    // Chargement de la configuration depuis le stockage local
    load: function() {
        const saved = localStorage.getItem('plex_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.enabled = config.enabled;
                this.serverUrl = config.serverUrl;
                this.token = config.token;
                return true;
            } catch (e) {
                console.error('Erreur lors du chargement de la configuration Plex:', e);
                return false;
            }
        }
        return false;
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charge la configuration Plex
    plexConfig.load();
    
    // Configure le bouton de configuration Plex
    const plexConfigBtn = document.getElementById('plex-config-btn');
    if (plexConfigBtn) {
        plexConfigBtn.addEventListener('click', showPlexConfigModal);
    }
    
    // Configure l'extraction des données depuis Tautulli
    setupTautulli();
});

// Affiche le modal de configuration Plex
function showPlexConfigModal() {
    const modal = new bootstrap.Modal(document.getElementById('plex-config-modal'));
    
    // Remplit le formulaire avec les valeurs actuelles
    document.getElementById('plex-enabled').checked = plexConfig.enabled;
    document.getElementById('plex-server-url').value = plexConfig.serverUrl;
    document.getElementById('plex-token').value = plexConfig.token;
    
    // Gestionnaire de soumission
    document.getElementById('plex-config-form').onsubmit = (e) => {
        e.preventDefault();
        
        // Met à jour la configuration
        plexConfig.enabled = document.getElementById('plex-enabled').checked;
        plexConfig.serverUrl = document.getElementById('plex-server-url').value.trim();
        plexConfig.token = document.getElementById('plex-token').value.trim();
        
        // Sauvegarde la configuration
        plexConfig.save();
        
        // Affiche un message de confirmation
        alert('Configuration Plex sauvegardée.');
        
        modal.hide();
    };
    
    modal.show();
}

// Récupère les éléments récemment ajoutés depuis Plex
async function getRecentlyAdded(mediaType, count = 10) {
    if (!plexConfig.enabled || !plexConfig.serverUrl || !plexConfig.token) {
        console.error('Configuration Plex incomplète');
        return [];
    }
    
    const librarySection = mediaType === 'movies' ? '1' : mediaType === 'tvshows' ? '2' : '8';
    
    try {
        const url = `${plexConfig.serverUrl}/library/sections/${librarySection}/recentlyAdded?X-Plex-Token=${plexConfig.token}&limit=${count}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return parseMediaItems(data, mediaType);
    } catch (error) {
        console.error('Erreur lors de la récupération des éléments récents:', error);
        return [];
    }
}

// Analyse les données de médias renvoyées par Plex
function parseMediaItems(data, mediaType) {
    if (!data || !data.MediaContainer || !data.MediaContainer.Metadata) {
        return [];
    }
    
    return data.MediaContainer.Metadata.map(item => {
        const baseItem = {
            id: item.ratingKey,
            title: item.title,
            year: item.year,
            description: item.summary,
            type: mediaType
        };
        
        // Ajoute l'URL de l'image si disponible
        if (item.thumb) {
            baseItem.image = `${plexConfig.serverUrl}${item.thumb}?X-Plex-Token=${plexConfig.token}`;
        }
        
        return baseItem;
    });
}

// Configure le script d'extraction de données depuis Tautulli
function setupTautulli() {
    // Ce script est destiné à être injecté dans Tautulli pour permettre
    // le glisser-déposer des éléments médias vers notre générateur de newsletter
    
    // Le code suivant est un exemple de script que l'utilisateur pourrait ajouter
    // à Tautulli via l'interface d'administration:
    
    const tautulliScript = `
// Ajouter ce script à Tautulli via l'interface d'administration
// pour pouvoir faire glisser-déposer des éléments médias vers votre générateur de newsletter

// Sélecteur pour les éléments médias (à adapter selon votre thème Tautulli)
const mediaItems = document.querySelectorAll('.media-tile');

mediaItems.forEach(item => {
    item.setAttribute('draggable', 'true');
    
    item.addEventListener('dragstart', e => {
        // Récupère les données de l'élément
        const mediaId = item.getAttribute('data-media-id');
        const mediaType = item.getAttribute('data-media-type');
        const title = item.querySelector('.media-title').textContent;
        const year = item.querySelector('.media-year')?.textContent;
        const posterUrl = item.querySelector('.media-poster img').src;
        const summary = item.querySelector('.media-summary')?.textContent;
        
        // Crée un objet avec les données
        const data = {
            id: mediaId,
            type: mediaType === 'movie' ? 'movies' : mediaType === 'show' ? 'tvshows' : 'music',
            title: title,
            year: year,
            image: posterUrl,
            description: summary
        };
        
        // Définit les données à transférer
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
    });
});
    `;
    
    // Affiche le script à l'utilisateur s'il clique sur un bouton dédié
    const showTautulliScriptBtn = document.getElementById('show-tautulli-script-btn');
    if (showTautulliScriptBtn) {
        showTautulliScriptBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('tautulli-script-modal'));
            document.getElementById('tautulli-script').textContent = tautulliScript;
            modal.show();
        });
    }
}

// Fonction pour récupérer des films populaires (simulée pour la démonstration)
function getDemoMovies() {
    return [
        {
            id: 'demo1',
            type: 'movies',
            title: 'Inception',
            year: '2010',
            image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            description: 'Dom Cobb est un voleur expérimenté, le meilleur dans l\'art dangereux de l\'extraction : sa spécialité consiste à s\'approprier les secrets les plus précieux, enfouis au plus profond du subconscient pendant une phase de rêve.'
        },
        {
            id: 'demo2',
            type: 'movies',
            title: 'The Dark Knight',
            year: '2008',
            image: 'https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg',
            description: 'Batman entreprend de démanteler les organisations criminelles qui ravagent les rues de Gotham. Mais il se heurte bientôt à un nouveau génie du crime qui répand la terreur et le chaos : le Joker.'
        },
        {
            id: 'demo3',
            type: 'movies',
            title: 'Interstellar',
            year: '2014',
            image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            description: 'Le film raconte les aventures d\'un groupe d\'explorateurs qui utilisent une faille récemment découverte dans l\'espace-temps afin de repousser les limites humaines et partir à la conquête des distances astronomiques dans un voyage interstellaire.'
        }
    ];
}

// Fonction pour récupérer des séries TV populaires (simulée pour la démonstration)
function getDemoTVShows() {
    return [
        {
            id: 'demo4',
            type: 'tvshows',
            title: 'Stranger Things',
            year: '2016',
            image: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
            description: 'Quand un jeune garçon disparaît, une petite ville découvre une affaire mystérieuse, des expériences secrètes, des forces surnaturelles terrifiantes... et une fillette.'
        },
        {
            id: 'demo5',
            type: 'tvshows',
            title: 'Breaking Bad',
            year: '2008',
            image: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
            description: 'Walter White, professeur de chimie dans un lycée, apprend qu\'il est atteint d\'un cancer en phase terminale. Il décide alors de mettre en place un laboratoire et un réseau de production et de distribution de méthamphétamine.'
        },
        {
            id: 'demo6',
            type: 'tvshows',
            title: 'Game of Thrones',
            year: '2011',
            image: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
            description: 'Sur le continent de Westeros, le roi Robert Baratheon gouverne le Royaume des Sept Couronnes depuis plus de dix-sept ans. Mais des complots se trament pour s\'emparer du trône.'
        }
    ];
}

// Fonction pour ajouter des données de démonstration à la newsletter
function addDemoData(sectionId, mediaType) {
    const demoData = mediaType === 'movies' ? getDemoMovies() : getDemoTVShows();
    
    demoData.forEach(media => {
        addMediaItemFromDrop(sectionId, media);
    });
}

// Exposer les fonctions nécessaires globalement
window.plexIntegration = {
    getRecentlyAdded,
    addDemoData
}; 