import { TRPGService } from '../services/trpgService.js';
import { StoryService } from '../services/storyService.js';
import { PairService } from '../services/pairService.js';
import { ArchiveService } from '../services/archiveService.js';
import { GalleryService } from '../services/galleryService.js';
import { authService } from '../services/netlifyAuthService.js'; // Netlify Auth 사용

export class ModalManager {
    constructor() {
        this.modalContainer = document.getElementById('modal-container');
        this.currentModal = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });
    }

    createModal(content, className = '') {
        const modal = document.createElement('div');
        modal.className = `modal-overlay ${className}`;
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">&times;</button>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Add close button listener
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());

        return modal;
    }

    showModal(modal) {
        if (this.currentModal) {
            this.closeModal();
        }

        this.modalContainer.appendChild(modal);
        this.currentModal = modal;
        document.body.classList.add('modal-open');

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    closeModal() {
        if (!this.currentModal) return;

        this.currentModal.classList.remove('active');
        document.body.classList.remove('modal-open');

        setTimeout(() => {
            if (this.currentModal) {
                this.currentModal.remove();
                this.currentModal = null;
            }
        }, 300);
    }

    // TRPG Detail Modal
    async showTRPGDetail(logId) {
        const log = await TRPGService.getLogById(logId);
        if (!log) {
            this.showError('Failed to load TRPG log');
            return;
        }

        const date = new Date(log.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const content = `
            <div class="modal-trpg-detail">
                <div class="film-reel-header">
                    <h2 class="modal-title">${this.escapeHtml(log.title)}</h2>
                    <div class="session-info">
                        <span class="session-number">Session #${log.session_number}</span>
                        <span class="session-date">${date}</span>
                    </div>
                </div>
                
                ${log.players ? `
                    <div class="players-section">
                        <h3>Players</h3>
                        <div class="players-list">
                            ${log.players.map(player => `
                                <span class="player-tag">${this.escapeHtml(player)}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="content-section">
                    <div class="typewriter-text">
                        ${this.formatContent(log.content)}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-edit" data-id="${log.id}">Edit</button>
                    <button class="btn-delete" data-id="${log.id}">Delete</button>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-trpg');
        this.showModal(modal);

        // Add action listeners
        modal.querySelector('.btn-edit')?.addEventListener('click', () => {
            this.closeModal();
            this.showTRPGForm(log);
        });

        modal.querySelector('.btn-delete')?.addEventListener('click', () => {
            this.confirmDelete('trpg', log.id);
        });
    }

    // Story Detail Modal
    async showStoryDetail(storyId) {
        const story = await StoryService.getStoryById(storyId);
        if (!story) {
            this.showError('Failed to load story');
            return;
        }

        const content = `
            <div class="modal-story-detail">
                <div class="typewriter-header">
                    <h2 class="modal-title">${this.escapeHtml(story.title)}</h2>
                    <div class="story-meta">
                        <span class="author">By ${this.escapeHtml(story.author)}</span>
                        <span class="word-count">${story.word_count || 0} words</span>
                    </div>
                </div>
                
                ${story.tags && story.tags.length > 0 ? `
                    <div class="tags-section">
                        ${story.tags.map(tag => `
                            <span class="story-tag">${this.escapeHtml(tag)}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="story-content">
                    ${this.formatContent(story.content)}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-edit" data-id="${story.id}">Edit</button>
                    <button class="btn-delete" data-id="${story.id}">Delete</button>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-story');
        this.showModal(modal);

        // Add action listeners
        modal.querySelector('.btn-edit')?.addEventListener('click', () => {
            this.closeModal();
            this.showStoryForm(story);
        });

        modal.querySelector('.btn-delete')?.addEventListener('click', () => {
            this.confirmDelete('story', story.id);
        });
    }

    // Character Pair Detail Modal
    async showPairDetail(pairId) {
        const pair = await PairService.getPairById(pairId);
        if (!pair) {
            this.showError('Failed to load character pair');
            return;
        }

        const content = `
            <div class="modal-pair-detail">
                <div class="movie-poster-style">
                    <div class="poster-header">
                        <span class="poster-label">STARRING</span>
                        <div class="character-names-large">
                            <h2>${this.escapeHtml(pair.character1_name)}</h2>
                            <span class="and-symbol">&</span>
                            <h2>${this.escapeHtml(pair.character2_name)}</h2>
                        </div>
                        ${pair.relationship ? `
                            <p class="relationship-label">${this.escapeHtml(pair.relationship)}</p>
                        ` : ''}
                    </div>
                    
                    ${pair.image_url ? `
                        <div class="pair-image">
                            <img src="${pair.image_url}" alt="${pair.character1_name} & ${pair.character2_name}">
                        </div>
                    ` : ''}
                    
                    ${pair.description ? `
                        <div class="pair-description">
                            <h3>About This Pair</h3>
                            <p>${this.escapeHtml(pair.description)}</p>
                        </div>
                    ` : ''}
                    
                    ${pair.story_context ? `
                        <div class="story-context">
                            <h3>Story Context</h3>
                            <p>${this.escapeHtml(pair.story_context)}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-edit" data-id="${pair.id}">Edit</button>
                    <button class="btn-delete" data-id="${pair.id}">Delete</button>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-pair');
        this.showModal(modal);

        // Add action listeners
        modal.querySelector('.btn-edit')?.addEventListener('click', () => {
            this.closeModal();
            this.showPairForm(pair);
        });

        modal.querySelector('.btn-delete')?.addEventListener('click', () => {
            this.confirmDelete('pair', pair.id);
        });
    }

    // Archive List Modal
    async showArchiveList(type) {
        const items = await ArchiveService.getItemsByType(type);
        
        const typeLabels = {
            'text': 'Text Logs',
            'artwork': 'Artwork',
            'photo': 'Photos',
            'mixed': 'Mixed Media'
        };

        const content = `
            <div class="modal-archive-list">
                <h2 class="modal-title">${typeLabels[type] || type}</h2>
                
                <div class="archive-grid">
                    ${items.length > 0 ? items.map(item => `
                        <div class="archive-item" data-id="${item.id}">
                            <div class="archive-item-icon">
                                ${this.getArchiveIcon(type)}
                            </div>
                            <h4>${this.escapeHtml(item.title)}</h4>
                            ${item.description ? `
                                <p>${this.escapeHtml(item.description.substring(0, 100))}...</p>
                            ` : ''}
                            <div class="archive-item-actions">
                                <button class="btn-view" data-id="${item.id}">View</button>
                                <button class="btn-download" data-url="${item.file_url}">Download</button>
                            </div>
                        </div>
                    `).join('') : `
                        <p class="empty-message">No ${typeLabels[type].toLowerCase()} in archive yet.</p>
                    `}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-upload">Upload New</button>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-archive');
        this.showModal(modal);

        // Add listeners
        modal.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.showArchiveDetail(id);
            });
        });

        modal.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                if (url) window.open(url, '_blank');
            });
        });

        modal.querySelector('.btn-upload')?.addEventListener('click', () => {
            this.closeModal();
            this.showArchiveUpload(type);
        });
    }

    // Gallery Folder Modal
    async showGalleryFolder(folderId) {
        const folder = await GalleryService.getFolderById(folderId);
        const images = await GalleryService.getImagesInFolder(folderId);

        if (!folder) {
            this.showError('Failed to load gallery folder');
            return;
        }

        const content = `
            <div class="modal-gallery-folder">
                <h2 class="modal-title">${this.escapeHtml(folder.name)}</h2>
                ${folder.description ? `
                    <p class="folder-description">${this.escapeHtml(folder.description)}</p>
                ` : ''}
                
                <div class="gallery-grid">
                    ${images.length > 0 ? images.map((img, index) => `
                        <div class="gallery-item" data-index="${index}">
                            <img src="${img.thumbnail_url || img.image_url}" 
                                 alt="${img.title || `Image ${index + 1}`}"
                                 loading="lazy">
                            ${img.title ? `
                                <p class="image-title">${this.escapeHtml(img.title)}</p>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <p class="empty-message">No images in this folder yet.</p>
                    `}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-upload-image" data-folder-id="${folder.id}">Add Images</button>
                    <button class="btn-edit" data-id="${folder.id}">Edit Folder</button>
                    <button class="btn-delete" data-id="${folder.id}">Delete Folder</button>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-gallery');
        this.showModal(modal);

        // Add image click listeners for lightbox
        modal.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.showImageLightbox(images, index);
            });
        });

        // Add action listeners
        modal.querySelector('.btn-upload-image')?.addEventListener('click', () => {
            this.closeModal();
            this.showImageUpload(folder.id);
        });

        modal.querySelector('.btn-edit')?.addEventListener('click', () => {
            this.closeModal();
            this.showGalleryForm(folder);
        });

        modal.querySelector('.btn-delete')?.addEventListener('click', () => {
            this.confirmDelete('gallery', folder.id);
        });
    }

    // Form Modals
    showTRPGForm(log = null) {
        const isEdit = !!log;
        const title = isEdit ? 'Edit TRPG Session' : 'New TRPG Session';

        const content = `
            <div class="modal-form">
                <h2 class="modal-title">${title}</h2>
                
                <form id="trpg-form" class="cinema-form">
                    <div class="form-group">
                        <label for="title">Session Title</label>
                        <input type="text" id="title" name="title" required
                               value="${log ? this.escapeHtml(log.title) : ''}"
                               placeholder="The Haunted Manor">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="session_number">Session Number</label>
                            <input type="number" id="session_number" name="session_number" required
                                   value="${log ? log.session_number : ''}"
                                   placeholder="12">
                        </div>
                        
                        <div class="form-group">
                            <label for="date">Date</label>
                            <input type="date" id="date" name="date" required
                                   value="${log ? log.date : new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="players">Players (comma separated)</label>
                        <input type="text" id="players" name="players"
                               value="${log && log.players ? log.players.join(', ') : ''}"
                               placeholder="Alice, Bob, Charlie">
                    </div>
                    
                    <div class="form-group">
                        <label for="content">Session Log</label>
                        <textarea id="content" name="content" rows="10" required
                                  placeholder="What happened in this session...">${log ? this.escapeHtml(log.content) : ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Form handlers
        const form = modal.querySelector('#trpg-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleTRPGSubmit(form, log?.id);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    showStoryForm(story = null) {
        const isEdit = !!story;
        const title = isEdit ? 'Edit Story' : 'Write New Story';

        const content = `
            <div class="modal-form">
                <h2 class="modal-title">${title}</h2>
                
                <form id="story-form" class="cinema-form">
                    <div class="form-group">
                        <label for="title">Story Title</label>
                        <input type="text" id="title" name="title" required
                               value="${story ? this.escapeHtml(story.title) : ''}"
                               placeholder="The Last Picture Show">
                    </div>
                    
                    <div class="form-group">
                        <label for="author">Author</label>
                        <input type="text" id="author" name="author"
                               value="${story ? this.escapeHtml(story.author) : ''}"
                               placeholder="Anonymous">
                    </div>
                    
                    <div class="form-group">
                        <label for="content">Story</label>
                        <textarea id="content" name="content" rows="15" required
                                  placeholder="Once upon a time...">${story ? this.escapeHtml(story.content) : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="tags">Tags (comma separated)</label>
                        <input type="text" id="tags" name="tags"
                               value="${story && story.tags ? story.tags.join(', ') : ''}"
                               placeholder="horror, mystery, noir">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Publish'}</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Form handlers
        const form = modal.querySelector('#story-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleStorySubmit(form, story?.id);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Character Pair Form Modal
    showPairForm(pair = null) {
        const isEdit = !!pair;
        const title = isEdit ? 'Edit Character Pair' : 'Create Character Pair';

        const content = `
            <div class="modal-form">
                <h2 class="modal-title">${title}</h2>
                
                <form id="pair-form" class="cinema-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="character1_name">First Character</label>
                            <input type="text" id="character1_name" name="character1_name" required
                                   value="${pair ? this.escapeHtml(pair.character1_name) : ''}"
                                   placeholder="Rick">
                        </div>
                        
                        <div class="form-group">
                            <label for="character2_name">Second Character</label>
                            <input type="text" id="character2_name" name="character2_name" required
                                   value="${pair ? this.escapeHtml(pair.character2_name) : ''}"
                                   placeholder="Sam">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="relationship">Relationship</label>
                        <input type="text" id="relationship" name="relationship"
                               value="${pair ? this.escapeHtml(pair.relationship || '') : ''}"
                               placeholder="Partners in Crime">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="5"
                                  placeholder="Describe their dynamic...">${pair ? this.escapeHtml(pair.description || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="story_context">Story Context</label>
                        <textarea id="story_context" name="story_context" rows="5"
                                  placeholder="In what story/campaign do they appear?">${pair ? this.escapeHtml(pair.story_context || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Form handlers
        const form = modal.querySelector('#pair-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePairSubmit(form, pair?.id);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Archive Upload Modal
    showArchiveUpload(defaultType = null) {
        const content = `
            <div class="modal-form">
                <h2 class="modal-title">Upload to Archive</h2>
                
                <form id="archive-form" class="cinema-form">
                    <div class="form-group">
                        <label for="type">Archive Type</label>
                        <select id="type" name="type" required>
                            <option value="">Select type...</option>
                            <option value="text" ${defaultType === 'text' ? 'selected' : ''}>Text Log</option>
                            <option value="artwork" ${defaultType === 'artwork' ? 'selected' : ''}>Artwork</option>
                            <option value="photo" ${defaultType === 'photo' ? 'selected' : ''}>Photo</option>
                            <option value="mixed" ${defaultType === 'mixed' ? 'selected' : ''}>Mixed Media</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="title">Title</label>
                        <input type="text" id="title" name="title" required
                               placeholder="Archive Item Title">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="4"
                                  placeholder="Brief description..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="file">File</label>
                        <input type="file" id="file" name="file" required>
                        <small class="file-hint">Max size: 10MB</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">Upload</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Form handlers
        const form = modal.querySelector('#archive-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleArchiveUpload(form);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Gallery Folder Form Modal
    showGalleryForm(folder = null) {
        const isEdit = !!folder;
        const title = isEdit ? 'Edit Gallery Folder' : 'Create Gallery Folder';

        const content = `
            <div class="modal-form">
                <h2 class="modal-title">${title}</h2>
                
                <form id="gallery-form" class="cinema-form">
                    <div class="form-group">
                        <label for="name">Folder Name</label>
                        <input type="text" id="name" name="name" required
                               value="${folder ? this.escapeHtml(folder.name) : ''}"
                               placeholder="Campaign Memories">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="4"
                                  placeholder="What's in this folder?">${folder ? this.escapeHtml(folder.description || '') : ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Form handlers
        const form = modal.querySelector('#gallery-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleGallerySubmit(form, folder?.id);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Image Upload Modal
    showImageUpload(folderId) {
        const content = `
            <div class="modal-form">
                <h2 class="modal-title">Add Images to Gallery</h2>
                
                <form id="image-upload-form" class="cinema-form">
                    <div class="form-group">
                        <label for="images">Select Images</label>
                        <input type="file" id="images" name="images" multiple accept="image/*" required>
                        <small class="file-hint">You can select multiple images. Max 5MB each.</small>
                    </div>
                    
                    <div id="image-preview" class="image-preview-grid"></div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">Upload Images</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, 'modal-form');
        this.showModal(modal);

        // Image preview
        const fileInput = modal.querySelector('#images');
        const preview = modal.querySelector('#image-preview');
        
        fileInput.addEventListener('change', (e) => {
            preview.innerHTML = '';
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('div');
                        img.className = 'preview-item';
                        img.innerHTML = `
                            <img src="${e.target.result}" alt="${file.name}">
                            <p>${file.name}</p>
                        `;
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        // Form handlers
        const form = modal.querySelector('#image-upload-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleImageUpload(form, folderId);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Image Lightbox Modal
    showImageLightbox(images, startIndex = 0) {
        let currentIndex = startIndex;
        
        const content = `
            <div class="lightbox-container">
                <div class="lightbox-image">
                    <img src="${images[currentIndex].image_url}" 
                         alt="${images[currentIndex].title || `Image ${currentIndex + 1}`}">
                </div>
                
                ${images.length > 1 ? `
                    <button class="lightbox-prev" aria-label="Previous image">‹</button>
                    <button class="lightbox-next" aria-label="Next image">›</button>
                ` : ''}
                
                <div class="lightbox-info">
                    ${images[currentIndex].title ? `<h3>${this.escapeHtml(images[currentIndex].title)}</h3>` : ''}
                    ${images[currentIndex].description ? `<p>${this.escapeHtml(images[currentIndex].description)}</p>` : ''}
                    <span class="image-counter">${currentIndex + 1} / ${images.length}</span>
                </div>
            </div>
        `;

        const modal = this.createModal(content, 'modal-lightbox');
        this.showModal(modal);

        // Navigation
        if (images.length > 1) {
            const updateImage = (index) => {
                currentIndex = index;
                const img = modal.querySelector('.lightbox-image img');
                const info = modal.querySelector('.lightbox-info');
                
                img.src = images[currentIndex].image_url;
                img.alt = images[currentIndex].title || `Image ${currentIndex + 1}`;
                
                info.innerHTML = `
                    ${images[currentIndex].title ? `<h3>${this.escapeHtml(images[currentIndex].title)}</h3>` : ''}
                    ${images[currentIndex].description ? `<p>${this.escapeHtml(images[currentIndex].description)}</p>` : ''}
                    <span class="image-counter">${currentIndex + 1} / ${images.length}</span>
                `;
            };

            modal.querySelector('.lightbox-prev')?.addEventListener('click', () => {
                const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                updateImage(newIndex);
            });

            modal.querySelector('.lightbox-next')?.addEventListener('click', () => {
                const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                updateImage(newIndex);
            });

            // Keyboard navigation
            const handleKeyboard = (e) => {
                if (e.key === 'ArrowLeft') {
                    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                    updateImage(newIndex);
                } else if (e.key === 'ArrowRight') {
                    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                    updateImage(newIndex);
                }
            };

            document.addEventListener('keydown', handleKeyboard);
            
            // Clean up keyboard listener when modal closes
            const originalClose = this.closeModal.bind(this);
            this.closeModal = () => {
                document.removeEventListener('keydown', handleKeyboard);
                originalClose();
                this.closeModal = originalClose;
            };
        }
    }

    // Helper methods
    formatContent(content) {
        if (!content) return '';
        
        // Convert line breaks to paragraphs
        return content
            .split('\n\n')
            .map(para => `<p>${this.escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    getArchiveIcon(type) {
        const icons = {
            'text': '📜',
            'artwork': '🎨',
            'photo': '📸',
            'mixed': '🎬'
        };
        return icons[type] || '📄';
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.textContent = message;
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-success';
        toast.textContent = message;
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async confirmDelete(type, id) {
        const confirmed = confirm('Are you sure you want to delete this item?');
        if (!confirmed) return;

        try {
            // 인증 필요
            await authService.requireAuth(async () => {
                let success = false;
                
                switch (type) {
                    case 'trpg':
                        success = await TRPGService.deleteLog(id);
                        break;
                    case 'story':
                        success = await StoryService.deleteStory(id);
                        break;
                    case 'pair':
                        success = await PairService.deletePair(id);
                        break;
                    case 'gallery':
                        success = await GalleryService.deleteFolder(id);
                        break;
                }

                if (success) {
                    this.showSuccess('Item deleted successfully');
                    this.closeModal();
                    // Refresh the current board
                    document.dispatchEvent(new CustomEvent('refresh-board'));
                } else {
                    this.showError('Failed to delete item');
                }
            });
        } catch (error) {
            console.error('Error deleting item:', error);
            if (error.message !== 'Authentication required') {
                this.showError('An error occurred');
            }
        }
    }

    // Form submission handlers
    async handleTRPGSubmit(form, logId) {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            sessionNumber: parseInt(formData.get('session_number')),
            date: formData.get('date'),
            content: formData.get('content'),
            players: formData.get('players').split(',').map(p => p.trim()).filter(p => p)
        };

        try {
            // 인증 필요
            await authService.requireAuth(async () => {
                let result;
                if (logId) {
                    result = await TRPGService.updateLog(logId, data);
                } else {
                    result = await TRPGService.createLog(data);
                }

                if (result) {
                    this.showSuccess(logId ? 'Session updated!' : 'Session created!');
                    this.closeModal();
                    document.dispatchEvent(new CustomEvent('refresh-board'));
                } else {
                    this.showError('Failed to save session');
                }
            });
        } catch (error) {
            console.error('Error saving TRPG log:', error);
            if (error.message !== 'Authentication required') {
                this.showError('An error occurred');
            }
        }
    }

    async handleStorySubmit(form, storyId) {
        const formData = new FormData(form);
        const content = formData.get('content');
        const data = {
            title: formData.get('title'),
            author: formData.get('author') || 'Anonymous',
            content: content,
            word_count: content.split(/\s+/).length,
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            let result;
            if (storyId) {
                result = await StoryService.updateStory(storyId, data);
            } else {
                result = await StoryService.createStory(data);
            }

            if (result) {
                this.showSuccess(storyId ? 'Story updated!' : 'Story published!');
                this.closeModal();
                document.dispatchEvent(new CustomEvent('refresh-board'));
            } else {
                this.showError('Failed to save story');
            }
        } catch (error) {
            console.error('Error saving story:', error);
            this.showError('An error occurred');
        }
    }

    async handlePairSubmit(form, pairId) {
        const formData = new FormData(form);
        const data = {
            character1_name: formData.get('character1_name'),
            character2_name: formData.get('character2_name'),
            relationship: formData.get('relationship'),
            description: formData.get('description'),
            story_context: formData.get('story_context')
        };

        try {
            let result;
            if (pairId) {
                result = await PairService.updatePair(pairId, data);
            } else {
                result = await PairService.createPair(data);
            }

            if (result) {
                this.showSuccess(pairId ? 'Pair updated!' : 'Pair created!');
                this.closeModal();
                document.dispatchEvent(new CustomEvent('refresh-board'));
            } else {
                this.showError('Failed to save pair');
            }
        } catch (error) {
            console.error('Error saving pair:', error);
            this.showError('An error occurred');
        }
    }

    async handleArchiveUpload(form) {
        const formData = new FormData(form);
        const file = formData.get('file');
        const type = formData.get('type');

        try {
            // Upload file
            const fileUrl = await ArchiveService.uploadFile(file, type);
            if (!fileUrl) {
                this.showError('Failed to upload file');
                return;
            }

            // Save to database
            const data = {
                type: type,
                title: formData.get('title'),
                description: formData.get('description'),
                file_url: fileUrl,
                metadata: {
                    filename: file.name,
                    size: file.size,
                    mime_type: file.type
                }
            };

            const result = await ArchiveService.createItem(data);
            
            if (result) {
                this.showSuccess('File uploaded to archive!');
                this.closeModal();
                document.dispatchEvent(new CustomEvent('refresh-board'));
            } else {
                this.showError('Failed to save archive item');
            }
        } catch (error) {
            console.error('Error uploading archive item:', error);
            this.showError('An error occurred during upload');
        }
    }

    async handleGallerySubmit(form, folderId) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            description: formData.get('description')
        };

        try {
            let result;
            if (folderId) {
                result = await GalleryService.updateFolder(folderId, data);
            } else {
                result = await GalleryService.createFolder(data);
            }

            if (result) {
                this.showSuccess(folderId ? 'Folder updated!' : 'Folder created!');
                this.closeModal();
                document.dispatchEvent(new CustomEvent('refresh-board'));
            } else {
                this.showError('Failed to save folder');
            }
        } catch (error) {
            console.error('Error saving folder:', error);
            this.showError('An error occurred');
        }
    }

    async handleImageUpload(form, folderId) {
        const formData = new FormData(form);
        const files = Array.from(formData.getAll('images'));

        try {
            let uploadedCount = 0;
            
            for (const file of files) {
                // Upload image
                const imageUrl = await GalleryService.uploadImage(file, folderId);
                if (!imageUrl) continue;

                // Save to database
                const imageData = {
                    folder_id: folderId,
                    title: file.name.split('.')[0],
                    image_url: imageUrl,
                    thumbnail_url: imageUrl, // Could generate thumbnails later
                    order_index: uploadedCount
                };

                const result = await GalleryService.addImageToFolder(imageData);
                if (result) uploadedCount++;
            }

            if (uploadedCount > 0) {
                this.showSuccess(`${uploadedCount} image(s) uploaded successfully!`);
                this.closeModal();
                document.dispatchEvent(new CustomEvent('refresh-board'));
            } else {
                this.showError('Failed to upload images');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            this.showError('An error occurred during upload');
        }
    }
}