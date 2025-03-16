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
    initializeFormListeners();
    initializeActionButtons();
    initializeTooltips();
    setupEmptyState();
});

// Initialisation des écouteurs de formulaire
function initializeFormListeners() {
    // Formulaire principal
    document.getElementById('newsletter-title')?.addEventListener('input', updateNewsletterTitle);
    document.getElementById('newsletter-subject')?.addEventListener('input', updateNewsletterSubject);
    document.getElementById('newsletter-intro')?.addEventListener('input', updateNewsletterIntro);
    
    // Bouton d'ajout de section
    document.getElementById('add-section-btn')?.addEventListener('click', addNewSection);
    
    // Type de section
    document.getElementById('section-type')?.addEventListener('change', updateSectionType);
}

// Initialisation des boutons d'action
function initializeActionButtons() {
    // Boutons principaux
    document.getElementById('preview-btn')?.addEventListener('click', previewNewsletter);
    document.getElementById('generate-btn')?.addEventListener('click', generateNewsletter);
    document.getElementById('clear-sections')?.addEventListener('click', clearAllSections);
    
    // Bouton de copie du script Tautulli
    document.getElementById('copy-script-btn')?.addEventListener('click', copyTautulliScript);
}

// Initialisation des tooltips Bootstrap
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
}

// Configuration de l'état vide
function setupEmptyState() {
    const sectionsContainer = document.getElementById('sections-container');
    const emptyState = document.getElementById('empty-state');
    
    if (sectionsContainer && emptyState) {
        // Observer les changements dans le conteneur de sections
        const observer = new MutationObserver(() => {
            const hasContent = sectionsContainer.children.length > 1; // > 1 car emptyState compte comme un enfant
            emptyState.style.display = hasContent ? 'none' : 'block';
        });
        
        observer.observe(sectionsContainer, { childList: true });
    }
}

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

// Mise à jour du type de section
function updateSectionType(e) {
    const type = e.target.value;
    const titleInput = document.getElementById('section-title');
    
    if (titleInput) {
        titleInput.placeholder = type === 'text' ? 'Introduction' :
            type === 'movies' ? 'Nouveaux films' :
            type === 'tvshows' ? 'Nouvelles séries' : 'Nouveaux albums';
    }
}

// Ajout d'une nouvelle section
function addNewSection() {
    const sectionType = document.getElementById('section-type')?.value || 'text';
    const sectionTitle = document.getElementById('section-title')?.value || 'Nouvelle section';
    
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
    const container = document.getElementById('sections-container');
    if (container) {
        container.appendChild(sectionElement);
    }
    
    // Réinitialiser le champ de titre
    const titleInput = document.getElementById('section-title');
    if (titleInput) {
        titleInput.value = '';
    }
    
    // Afficher un message de confirmation
    showToast('Section ajoutée avec succès !');
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
        
        // Bouton de démo
        const demoBtn = document.createElement('button');
        demoBtn.type = 'button';
        demoBtn.className = 'btn btn-sm btn-outline-secondary mt-2';
        demoBtn.innerHTML = '<i class="bi bi-play-fill"></i> Ajouter des exemples';
        demoBtn.addEventListener('click', () => {
            if (window.plexIntegration) {
                window.plexIntegration.addDemoData(section.id, section.type);
            }
        });
        bodyDiv.appendChild(demoBtn);
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
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.type && data.title) {
                addMediaItemFromDrop(sectionId, data);
            }
        } catch (error) {
            console.error('Erreur lors du traitement des données déposées:', error);
            showToast('Format de données invalide. Assurez-vous de glisser-déposer depuis Plex.', 'error');
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
    const container = document.getElementById(`media-container-${sectionId}`);
    if (container) {
        container.appendChild(mediaElement);
        showToast('Média ajouté avec succès !');
    }
}

// Ajouter un nouvel élément média manuellement
function addMediaItem(sectionId, sectionType) {
    const modal = new bootstrap.Modal(document.getElementById('media-modal'));
    const modalTitle = document.getElementById('media-modal-title');
    const form = document.getElementById('media-form');
    
    if (modalTitle) {
        modalTitle.textContent = `Ajouter un ${sectionType === 'movies' ? 'film' : sectionType === 'tvshows' ? 'une série TV' : 'album musical'}`;
    }
    
    if (form) {
        form.reset();
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const mediaItem = {
                id: `media-${mediaIdCounter++}`,
                title: document.getElementById('media-title')?.value || '',
                year: document.getElementById('media-year')?.value || '',
                image: document.getElementById('media-image')?.value || '',
                description: document.getElementById('media-description')?.value || ''
            };
            
            const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
            if (sectionIndex !== -1) {
                newsletterData.sections[sectionIndex].items.push(mediaItem);
                
                const mediaElement = createMediaElement(mediaItem, sectionId);
                const container = document.getElementById(`media-container-${sectionId}`);
                if (container) {
                    container.appendChild(mediaElement);
                    showToast('Média ajouté avec succès !');
                }
            }
            
            modal.hide();
        };
    }
    
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
    
    if (newTitle !== null && newTitle.trim() !== '') {
        newsletterData.sections[sectionIndex].title = newTitle;
        
        const titleElement = document.querySelector(`#${sectionId} .section-title`);
        if (titleElement) {
            titleElement.textContent = newTitle;
            showToast('Section modifiée avec succès !');
        }
    }
}

// Supprimer une section
function deleteSection(sectionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
        const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            newsletterData.sections.splice(sectionIndex, 1);
        }
        
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.remove();
            showToast('Section supprimée avec succès !');
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
    const modal = new bootstrap.Modal(document.getElementById('media-modal'));
    const modalTitle = document.getElementById('media-modal-title');
    const form = document.getElementById('media-form');
    
    if (modalTitle) {
        modalTitle.textContent = `Éditer ${media.title}`;
    }
    
    if (form) {
        // Remplir le formulaire
        document.getElementById('media-title').value = media.title;
        document.getElementById('media-year').value = media.year || '';
        document.getElementById('media-image').value = media.image || '';
        document.getElementById('media-description').value = media.description || '';
        
        form.onsubmit = (e) => {
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
                
                showToast('Média modifié avec succès !');
            }
            
            modal.hide();
        };
    }
    
    modal.show();
}

// Supprimer un élément média
function deleteMediaItem(mediaId, sectionId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        const sectionIndex = newsletterData.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            const mediaIndex = newsletterData.sections[sectionIndex].items.findIndex(m => m.id === mediaId);
            if (mediaIndex !== -1) {
                newsletterData.sections[sectionIndex].items.splice(mediaIndex, 1);
            }
        }
        
        const mediaElement = document.getElementById(mediaId);
        if (mediaElement) {
            mediaElement.remove();
            showToast('Média supprimé avec succès !');
        }
    }
}

// Effacer toutes les sections
function clearAllSections() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les sections ?')) {
        newsletterData.sections = [];
        const container = document.getElementById('sections-container');
        if (container) {
            const emptyState = document.getElementById('empty-state');
            container.innerHTML = '';
            if (emptyState) {
                container.appendChild(emptyState);
            }
            showToast('Toutes les sections ont été supprimées !');
        }
    }
}

// Copier le script Tautulli
function copyTautulliScript() {
    const scriptElement = document.getElementById('tautulli-script');
    if (scriptElement) {
        navigator.clipboard.writeText(scriptElement.textContent)
            .then(() => showToast('Script copié dans le presse-papiers !'))
            .catch(() => showToast('Erreur lors de la copie du script.', 'error'));
    }
}

// Prévisualiser la newsletter
function previewNewsletter() {
    if (!newsletterData.title) {
        showToast('Veuillez au moins entrer un titre pour votre newsletter.', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('preview-modal'));
    const container = document.getElementById('preview-content');
    
    if (container) {
        container.innerHTML = '';
        container.appendChild(generateNewsletterHTML());
    }
    
    modal.show();
}

// Générer et télécharger la newsletter
function generateNewsletter() {
    if (!newsletterData.title) {
        showToast('Veuillez au moins entrer un titre pour votre newsletter.', 'error');
        return;
    }
    
    const newsletterHTML = generateNewsletterHTML();
    const fullHTML = generateFullHTMLDocument(newsletterHTML);
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${formatDate(new Date())}.html`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    showToast('Newsletter générée avec succès !');
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
    const contentHTML = contentElement.outerHTML;
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${newsletterData.title || 'Newsletter Plex'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#F8F9FA">
        <tr>
            <td align="center" style="padding: 20px;">
                <!-- Container Principal -->
                <table width="800" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; color: #495057; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 60px 20px; text-align: center; background: linear-gradient(135deg, #845EF7, #748FFC); border-radius: 15px 15px 0 0;">
                            <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 42px; color: #FFFFFF; letter-spacing: 4px; text-transform: uppercase; font-weight: 600; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${newsletterData.title}</h1>
                            <p style="margin-top: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; color: #FFFFFF; font-weight: 200;">${formatDate(new Date())}</p>
                        </td>
                    </tr>

                    ${newsletterData.introduction ? `
                    <!-- Introduction -->
                    <tr>
                        <td style="padding: 30px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(45deg, #F3F0FF, #E5DBFF); border: none; border-radius: 10px; box-shadow: 0 4px 15px rgba(116, 143, 252, 0.2);">
                                <tr>
                                    <td style="padding: 30px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #495057; line-height: 1.6;">${newsletterData.introduction}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    ${newsletterData.sections.map(section => `
                    <!-- Section ${section.title} -->
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 30px 0; font-family: 'Bricolage Grotesque', Arial, sans-serif; font-size: 28px; color: #748FFC; text-align: center; border-bottom: 2px solid #E9ECEF; padding-bottom: 15px; font-weight: 600;">
                                ${section.type === 'movies' ? '🎬' : section.type === 'tvshows' ? '📺' : section.type === 'music' ? '🎵' : '📝'} ${section.title}
                            </h2>
                            ${section.type === 'text' ? `
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #495057; line-height: 1.6;">${section.content || ''}</p>
                            ` : `
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                ${section.items.reduce((rows, item, index) => {
                                    if (index % 2 === 0) {
                                        rows.push([item]);
                                    } else {
                                        rows[rows.length - 1].push(item);
                                    }
                                    return rows;
                                }, []).map(row => `
                                <tr>
                                    ${row.map(item => `
                                    <td width="50%" style="padding: 10px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                            <tr>
                                                <td style="padding: 15px;">
                                                    <div style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.1);">
                                                        <div style="position: relative; padding-top: 150%;">
                                                            <img src="${item.image || 'assets/img/placeholder.jpg'}" 
                                                                 alt="${item.title}" 
                                                                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block;" />
                                                        </div>
                                                        <div style="padding: 20px; background: linear-gradient(to bottom, #FFFFFF, #F8F9FA);">
                                                            <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; color: #748FFC; font-weight: 600;">
                                                                ${section.type === 'movies' ? '🎥' : section.type === 'tvshows' ? '📺' : '🎵'} ${item.title}
                                                            </h3>
                                                            ${item.year ? `<p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #64748b;">(${item.year})</p>` : ''}
                                                            ${item.description ? `<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #495057; line-height: 1.6;">${item.description.length > 150 ? item.description.substring(0, 150) + '...' : item.description}</p>` : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    `).join('')}
                                    ${row.length === 1 ? '<td width="50%" style="padding: 10px;"></td>' : ''}
                                </tr>
                                `).join('')}
                            </table>
                            `}
                        </td>
                    </tr>
                    `).join('')}

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #748FFC, #845EF7); border-radius: 0 0 15px 15px;">
                            <div style="margin: 0 auto; width: 200px; border-top: 2px solid rgba(255,255,255,0.3);"></div>
                            <div style="padding: 20px 0; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                &copy; ${new Date().getFullYear()} Newsletter Plex
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Formater la date en français
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Afficher un toast de notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Nettoyer le toast après qu'il soit caché
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
        if (toastContainer.children.length === 0) {
            toastContainer.remove();
        }
    });
}

// Créer le conteneur de toasts
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1050';
    document.body.appendChild(container);
    return container;
} 