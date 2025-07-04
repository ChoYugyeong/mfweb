// public/js/components/modalManager.js
(function() {
    'use strict';

    class ModalManager {
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
            if (!window.TRPGService) {
                this.showError('Service not available');
                return;
            }

            const log = await window.TRPGService.getLogById(logId);
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

        showPairForm() {
            const content = `
                <div class="modal-form">
                    <h2 class="modal-title">Create Character Pair</h2>
                    <p style="text-align: center; color: var(--gray-light); margin: 2rem 0;">
                        This feature requires database connection.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">OK</button>
                    </div>
                </div>
            `;

            const modal = this.createModal(content, 'modal-form');
            this.showModal(modal);
        }

        showArchiveUpload() {
            const content = `
                <div class="modal-form">
                    <h2 class="modal-title">Upload to Archive</h2>
                    <p style="text-align: center; color: var(--gray-light); margin: 2rem 0;">
                        This feature requires database connection.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">OK</button>
                    </div>
                </div>
            `;

            const modal = this.createModal(content, 'modal-form');
            this.showModal(modal);
        }

        showGalleryForm() {
            const content = `
                <div class="modal-form">
                    <h2 class="modal-title">Create Gallery Folder</h2>
                    <p style="text-align: center; color: var(--gray-light); margin: 2rem 0;">
                        This feature requires database connection.
                    </p>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">OK</button>
                    </div>
                </div>
            `;

            const modal = this.createModal(content, 'modal-form');
            this.showModal(modal);
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

        showError(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-error';
            toast.textContent = message;
            
            const container = document.getElementById('toast-container');
            if (container) {
                container.appendChild(toast);
            } else {
                document.body.appendChild(toast);
            }
            
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
            
            const container = document.getElementById('toast-container');
            if (container) {
                container.appendChild(toast);
            } else {
                document.body.appendChild(toast);
            }
            
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

            this.showError('Delete feature requires authentication');
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
                if (!window.TRPGService) {
                    this.showError('Service not available');
                    return;
                }

                let result;
                if (logId) {
                    result = await window.TRPGService.updateLog(logId, data);
                } else {
                    result = await window.TRPGService.createLog(data);
                }

                if (result) {
                    this.showSuccess(logId ? 'Session updated!' : 'Session created!');
                    this.closeModal();
                    document.dispatchEvent(new CustomEvent('refresh-board'));
                } else {
                    this.showError('Failed to save session');
                }
            } catch (error) {
                console.error('Error saving TRPG log:', error);
                this.showError('An error occurred');
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
                if (!window.StoryService) {
                    this.showError('Service not available');
                    return;
                }

                let result;
                if (storyId) {
                    result = await window.StoryService.updateStory(storyId, data);
                } else {
                    result = await window.StoryService.createStory(data);
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
    }

    // Export to global scope
    window.ModalManager = ModalManager;
})();