// Structure pour stocker les données de la newsletter
let newsletterData = {
    title: '',
    subject: '',
    introduction: '',
    sections: []
};

// Compteur pour les ID uniques des sections
let sectionIdCounter = 0;
let mediaIdCounter = 0;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs d'événements pour le formulaire principal
    document.getElementById('newsletter-title').addEventListener('input', updateNewsletterTitle);
    document.getElementById('newsletter-subject').addEventListener('input', updateNewsletterSubject);
    document.getElementById('newsletter-intro').addEventListener('input', updateNewsletterIntro);
    
    // Écouteur pour le bouton d'ajout de section
    document.getElementById('add-section').addEventListener('click', addNewSection);
    
    // Écouteurs pour les boutons d'actions
    document.getElementById('preview-btn').addEventListener('click', previewNewsletter);
    document.getElementById('generate-btn').addEventListener('click', generateNewsletter);
    
    // Initialiser les infobulles Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Mise à jour des données de la newsletter
function updateNewsletterTitle(e) {
    newsletterData.title = e.target.value;
}

function updateNewsletterSubject(e) {
    newsletterData.subject = e.target.value;
}

function updateNewsletterIntro(e) {
    newsletterData.introduction = e.target.value;
}

// Ajout d'une nouvelle section
function addNewSection() {
    const sectionType = document.getElementById('section-type').value;
    const sectionTitle = document.getElementById('section-title').value || 'Nouvelle section';
    
    const sectionId = `section-${sectionIdCounter++}`;
    const section = {
        id: sectionId,
        type: sectionType,
        title: sectionTitle,
        items: []
    };
    
    newsletterData.sections.push(section);
    
    // Créer et ajouter la section au DOM
    const sectionElement = createSectionElement(section);
    document.getElementById('sections-container').appendChild(sectionElement);
    
    // Réinitialiser le champ de titre
    document.getElementById('section-title').value = '';
}

// Création d'un élément de section dans le DOM
function createSectionElement(section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.id = section.id;
    sectionDiv.className = 'section-item';
    sectionDiv.dataset.type = section.type;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'section-header';
    
    const titleElement = document.createElement('h5');
    titleElement.className = 'section-title';
    titleElement.textContent = section.title;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'section-controls';
    
    // Boutons de contrôle
    const addBtn = createButton('btn-sm btn-outline-primary', 'Ajouter', 'plus-lg');
    const editBtn = createButton('btn-sm btn-outline-secondary', 'Éditer', 'pencil');
    const deleteBtn = createButton('btn-sm btn-outline-danger', 'Supprimer', 'trash');
    
    // Ajouter les événements
    addBtn.addEventListener('click', () => addMediaItem(section.id, section.type));
    editBtn.addEventListener('click', () => editSection(section.id));
    deleteBtn.addEventListener('click', () => deleteSection(section.id));
    
    controlsDiv.append(addBtn, editBtn, deleteBtn);
    headerDiv.append(titleElement, controlsDiv);
    
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'section-body';
    
    if (section.type === 'text') {
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control';
        textarea.rows = 4;
        textarea.placeholder = 'Entrez le contenu texte de cette section...';
        textarea.addEventListener('input', (e) => {
            const sectionIndex = newsletterData.sections.findIndex(s => s.id === section.id);
            if (sectionIndex !== -1) {
                newsletterData.sections[sectionIndex].content = e.target.value;
            }
        });
        bodyDiv.appendChild(textarea);
    } else {
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'media-container';
        mediaContainer.id = `media-container-${section.id}`;
        
        // Ajouter les gestionnaires pour le glisser-déposer
        setupDragAndDrop(mediaContainer, section.id);
        
        bodyDiv.appendChild(mediaContainer);
        
        // Message d'information
        const infoMsg = document.createElement('p');
        infoMsg.className = 'text-muted small mt-2';
        infoMsg.innerHTML = `<i class="bi bi-info-circle"></i> Vous pouvez ajouter du contenu ${section.type === 'movies' ? 'de films' : section.type === 'tvshows' ? 'de séries TV' : 'musical'} manuellement ou glisser-déposer depuis Plex.`;
        bodyDiv.appendChild(infoMsg);
    }
    
    sectionDiv.append(headerDiv, bodyDiv);
    return sectionDiv;
}

// Création d'un bouton avec une icône
function createButton(className, label, icon) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${className}`;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-title', label);
    
    const iconElement = document.createElement('i');
    iconElement.className = `bi bi-${icon}`;
    
    button.appendChild(iconElement);
    return button;
}

// Configuration du glisser-déposer
function setupDragAndDrop(container, sectionId) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        
        try {
            // Essayer de récupérer les données
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.type && data.title) {
                addMediaItemFromDrop(sectionId, data);
            }
        } catch (error) {
            console.error('Erreur lors du traitement des données déposées:', error);
            alert('Le format des données déposées n\'est pas valide. Assurez-vous de glisser-déposer depuis Plex.');
        }
    });
}

// Ajouter un élément média depuis un glisser-déposer
function addMediaItemFromDrop(sectionId, data) {
    const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const mediaItem = {
        id: `media-${mediaIdCounter++}`,
        title: data.title,
        year: data.year || '',
        image: data.image || '',
        description: data.description || '',
        ...data
    };
    
    newsletterData.sections[sectionIndex].items.push(mediaItem);
    
    // Ajouter l'élément au DOM
    const mediaElement = createMediaElement(mediaItem, sectionId);
    document.getElementById(`media-container-${sectionId}`).appendChild(mediaElement);
}

// Ajouter un nouvel élément média manuellement
function addMediaItem(sectionId, sectionType) {
    // Créer un dialogue modal pour saisir les informations
    const modal = new bootstrap.Modal(document.getElementById('media-modal'));
    
    // Configurer le modal pour le type de contenu
    document.getElementById('modal-title').textContent = `Ajouter un ${sectionType === 'movies' ? 'film' : sectionType === 'tvshows' ? 'une série TV' : 'album musical'}`;
    
    // Réinitialiser le formulaire
    document.getElementById('media-form').reset();
    
    // Configurer le gestionnaire de soumission
    document.getElementById('media-form').onsubmit = (e) => {
        e.preventDefault();
        
        const mediaItem = {
            id: `media-${mediaIdCounter++}`,
            title: document.getElementById('media-title').value,
            year: document.getElementById('media-year').value,
            image: document.getElementById('media-image').value,
            description: document.getElementById('media-description').value
        };
        
        const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            newsletterData.sections[sectionIndex].items.push(mediaItem);
            
            // Ajouter l'élément au DOM
            const mediaElement = createMediaElement(mediaItem, sectionId);
            document.getElementById(`media-container-${sectionId}`).appendChild(mediaElement);
        }
        
        modal.hide();
    };
    
    modal.show();
}

// Création d'un élément média dans le DOM
function createMediaElement(media, sectionId) {
    const mediaDiv = document.createElement('div');
    mediaDiv.id = media.id;
    mediaDiv.className = 'media-item';
    
    // Image
    const img = document.createElement('img');
    img.className = 'media-image';
    img.src = media.image || 'assets/img/placeholder.jpg';
    img.alt = media.title;
    
    // Détails
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'media-details';
    
    const titleElement = document.createElement('div');
    titleElement.className = 'media-title';
    titleElement.textContent = media.title;
    
    const yearElement = document.createElement('div');
    yearElement.className = 'media-year';
    yearElement.textContent = media.year ? `(${media.year})` : '';
    
    const descElement = document.createElement('div');
    descElement.className = 'media-description';
    descElement.textContent = media.description;
    
    detailsDiv.append(titleElement, yearElement, descElement);
    
    // Boutons de contrôle
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'media-controls ms-2';
    
    const editBtn = createButton('btn-sm btn-outline-secondary', 'Éditer', 'pencil');
    const deleteBtn = createButton('btn-sm btn-outline-danger', 'Supprimer', 'trash');
    
    // Ajouter les événements
    editBtn.addEventListener('click', () => editMediaItem(media.id, sectionId));
    deleteBtn.addEventListener('click', () => deleteMediaItem(media.id, sectionId));
    
    controlsDiv.append(editBtn, deleteBtn);
    
    mediaDiv.append(img, detailsDiv, controlsDiv);
    return mediaDiv;
}

// Éditer une section
function editSection(sectionId) {
    const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const section = newsletterData.sections[sectionIndex];
    const newTitle = prompt('Modifier le titre de la section:', section.title);
    
    if (newTitle !== null) {
        // Mettre à jour les données
        newsletterData.sections[sectionIndex].title = newTitle;
        
        // Mettre à jour le DOM
        const titleElement = document.querySelector(`#${sectionId} .section-title`);
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }
}

// Supprimer une section
function deleteSection(sectionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette section?')) {
        // Supprimer des données
        const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            newsletterData.sections.splice(sectionIndex, 1);
        }
        
        // Supprimer du DOM
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.remove();
        }
    }
}

// Éditer un élément média
function editMediaItem(mediaId, sectionId) {
    const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const mediaIndex = newsletterData.sections[sectionIndex].items.findIndex(m => m.id === mediaId);
    if (mediaIndex === -1) return;
    
    const media = newsletterData.sections[sectionIndex].items[mediaIndex];
    
    // Créer un dialogue modal pour éditer les informations
    const modal = new bootstrap.Modal(document.getElementById('media-modal'));
    
    // Configurer le modal
    document.getElementById('modal-title').textContent = `Éditer ${media.title}`;
    
    // Remplir le formulaire
    document.getElementById('media-title').value = media.title;
    document.getElementById('media-year').value = media.year || '';
    document.getElementById('media-image').value = media.image || '';
    document.getElementById('media-description').value = media.description || '';
    
    // Configurer le gestionnaire de soumission
    document.getElementById('media-form').onsubmit = (e) => {
        e.preventDefault();
        
        // Mettre à jour les données
        media.title = document.getElementById('media-title').value;
        media.year = document.getElementById('media-year').value;
        media.image = document.getElementById('media-image').value;
        media.description = document.getElementById('media-description').value;
        
        // Mettre à jour le DOM
        const mediaElement = document.getElementById(mediaId);
        if (mediaElement) {
            const imgElement = mediaElement.querySelector('.media-image');
            if (imgElement) {
                imgElement.src = media.image || 'assets/img/placeholder.jpg';
            }
            
            const titleElement = mediaElement.querySelector('.media-title');
            if (titleElement) {
                titleElement.textContent = media.title;
            }
            
            const yearElement = mediaElement.querySelector('.media-year');
            if (yearElement) {
                yearElement.textContent = media.year ? `(${media.year})` : '';
            }
            
            const descElement = mediaElement.querySelector('.media-description');
            if (descElement) {
                descElement.textContent = media.description;
            }
        }
        
        modal.hide();
    };
    
    modal.show();
}

// Supprimer un élément média
function deleteMediaItem(mediaId, sectionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément?')) {
        // Supprimer des données
        const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            const mediaIndex = newsletterData.sections[sectionIndex].items.findIndex(m => m.id === mediaId);
            if (mediaIndex !== -1) {
                newsletterData.sections[sectionIndex].items.splice(mediaIndex, 1);
            }
        }
        
        // Supprimer du DOM
        const mediaElement = document.getElementById(mediaId);
        if (mediaElement) {
            mediaElement.remove();
        }
    }
}

// Prévisualiser la newsletter
function previewNewsletter() {
    // Vérification des données minimales
    if (!newsletterData.title) {
        alert('Veuillez au moins entrer un titre pour votre newsletter.');
        return;
    }
    
    const previewModal = new bootstrap.Modal(document.getElementById('preview-modal'));
    const previewContainer = document.getElementById('preview-content');
    
    // Générer le HTML de prévisualisation
    previewContainer.innerHTML = '';
    previewContainer.appendChild(generateNewsletterHTML());
    
    previewModal.show();
}

// Générer et télécharger la newsletter
function generateNewsletter() {
    // Vérification des données minimales
    if (!newsletterData.title) {
        alert('Veuillez au moins entrer un titre pour votre newsletter.');
        return;
    }
    
    // Générer le HTML complet
    const newsletterHTML = generateNewsletterHTML();
    const fullHTML = generateFullHTMLDocument(newsletterHTML);
    
    // Créer un Blob et le télécharger
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${formatDate(new Date())}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Générer le HTML de la newsletter
function generateNewsletterHTML() {
    const container = document.createElement('div');
    container.className = 'newsletter-container';
    
    // En-tête
    const header = document.createElement('div');
    header.className = 'newsletter-header';
    
    const title = document.createElement('h1');
    title.className = 'newsletter-title';
    title.textContent = newsletterData.title;
    
    const date = document.createElement('div');
    date.className = 'newsletter-date';
    date.textContent = formatDate(new Date());
    
    header.append(title, date);
    
    // Introduction
    if (newsletterData.introduction) {
        const intro = document.createElement('div');
        intro.className = 'newsletter-intro';
        intro.textContent = newsletterData.introduction;
        container.appendChild(intro);
    }
    
    // Sections
    newsletterData.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'newsletter-section';
        
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = section.title;
        sectionDiv.appendChild(sectionTitle);
        
        if (section.type === 'text' && section.content) {
            const content = document.createElement('div');
            content.className = 'section-content';
            content.textContent = section.content;
            sectionDiv.appendChild(content);
        } else if (section.items && section.items.length > 0) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'media-items-container';
            
            section.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'media-item';
                
                if (item.image) {
                    const img = document.createElement('img');
                    img.className = 'media-image';
                    img.src = item.image;
                    img.alt = item.title;
                    itemDiv.appendChild(img);
                }
                
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'media-details';
                
                const titleElement = document.createElement('div');
                titleElement.className = 'media-title';
                titleElement.textContent = item.title;
                
                if (item.year) {
                    const yearElement = document.createElement('div');
                    yearElement.className = 'media-year';
                    yearElement.textContent = `(${item.year})`;
                    detailsDiv.appendChild(yearElement);
                }
                
                if (item.description) {
                    const descElement = document.createElement('div');
                    descElement.className = 'media-description';
                    descElement.textContent = item.description;
                    detailsDiv.appendChild(descElement);
                }
                
                detailsDiv.insertBefore(titleElement, detailsDiv.firstChild);
                itemDiv.appendChild(detailsDiv);
                itemsContainer.appendChild(itemDiv);
            });
            
            sectionDiv.appendChild(itemsContainer);
        }
        
        container.appendChild(sectionDiv);
    });
    
    container.insertBefore(header, container.firstChild);
    return container;
}

// Générer le document HTML complet
function generateFullHTMLDocument(contentElement) {
    // Convertir l'élément DOM en chaîne
    const contentHTML = contentElement.outerHTML;
    
    // CSS intégré pour le rendu dans les clients de messagerie
    const css = `
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .newsletter-container {
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .newsletter-header {
        background-color: #0F172A;
        color: #fff;
        padding: 20px;
        text-align: center;
    }
    
    .newsletter-title {
        font-size: 28px;
        margin: 0 0 10px;
    }
    
    .newsletter-date {
        font-size: 14px;
        color: #cbd5e1;
    }
    
    .newsletter-intro {
        padding: 20px;
        font-size: 16px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .newsletter-section {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .newsletter-section:last-child {
        border-bottom: none;
    }
    
    .section-title {
        font-size: 22px;
        margin: 0 0 15px;
        color: #0F172A;
    }
    
    .section-content {
        font-size: 16px;
    }
    
    .media-items-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .media-item {
        display: flex;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .media-image {
        width: 100px;
        height: 150px;
        object-fit: cover;
    }
    
    .media-details {
        padding: 10px;
        flex-grow: 1;
    }
    
    .media-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 5px;
    }
    
    .media-year {
        color: #64748b;
        font-size: 14px;
        margin-bottom: 8px;
    }
    
    .media-description {
        font-size: 14px;
        color: #334155;
    }`;
    
    // Template HTML complet
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletterData.title || 'Newsletter Plex'}</title>
    <style>
${css}
    </style>
</head>
<body>
${contentHTML}
</body>
</html>`;
}

// Formater la date en français
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Gestionnaire de glisser-déposer pour l'importation de données
// Note: Cette fonction sera utilisée pour l'intégration avec Plex
function handlePlexDragDrop() {
    // À implémenter pour l'intégration avec Plex
} 