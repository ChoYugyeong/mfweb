import { TRPGService } from '../services/trpgService.js';
import { StoryService } from '../services/storyService.js';
import { PairService } from '../services/pairService.js';
import { ArchiveService } from '../services/archiveService.js';
import { GalleryService } from '../services/galleryService.js';
import { ModalManager } from './modalManager.js';

export class BoardManager {
    constructor() {
        this.currentPage = 'home';
        this.modalManager = new ModalManager();
        this.loadingStates = new Map();
        this.init();
    }

    async init() {
        await this.setupEventListeners();
        await this.loadInitialData();
    }

    async setupEventListeners() {
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleActionButtonClick();
            });
        });

        // Board-specific listeners will be set when data is loaded
    }

    async loadInitialData() {
        // Load data for the active page
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            await this.loadPageData(activePage.id);
        }
    }

    async loadPageData(pageId) {
        if (this.loadingStates.get(pageId)) return;
        
        this.loadingStates.set(pageId, true);
        this.showLoading(pageId);

        try {
            switch (pageId) {
                case 'trpg':
                    await this.loadTRPGLogs();
                    break;
                case 'stories':
                    await this.loadStories();
                    break;
                case 'pairs':
                    await this.loadCharacterPairs();
                    break;
                case 'archive':
                    await this.loadArchive();
                    break;
                case 'gallery':
                    await this.loadGallery();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${pageId} data:`, error);
            this.showError(pageId, 'Failed to load data. Please try again.');
        } finally {
            this.hideLoading(pageId);
            this.loadingStates.set(pageId, false);
        }
    }

    async loadTRPGLogs() {
        const logs = await TRPGService.getLogs(12); // Get 12 latest logs
        const container = document.querySelector('.trpg-board');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No TRPG sessions yet');
            return;
        }

        logs.forEach(log => {
            const card = this.createTRPGCard(log);
            container.appendChild(card);
        });

        // Add click listeners
        container.querySelectorAll('.reel-card').forEach(card => {
            card.addEventListener('click', () => {
                const logId = card.dataset.logId;
                this.modalManager.showTRPGDetail(logId);
            });
        });
    }

    createTRPGCard(log) {
        const div = document.createElement('div');
        div.className = 'reel-card';
        div.dataset.logId = log.id;
        
        const date = new Date(log.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });

        div.innerHTML = `
            <h3 class="reel-title">${this.escapeHtml(log.title)}</h3>
            <p class="reel-date">Session #${log.session_number} • ${formattedDate}</p>
        `;
        
        return div;
    }

    async loadStories() {
        const stories = await StoryService.getStories(10);
        const container = document.querySelector('.stories-board');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (stories.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No stories written yet');
            return;
        }

        stories.forEach(story => {
            const card = this.createStoryCard(story);
            container.appendChild(card);
        });

        container.querySelectorAll('.typewriter-card').forEach(card => {
            card.addEventListener('click', () => {
                const storyId = card.dataset.storyId;
                this.modalManager.showStoryDetail(storyId);
            });
        });
    }

    createStoryCard(story) {
        const div = document.createElement('div');
        div.className = 'typewriter-card';
        div.dataset.storyId = story.id;
        
        div.innerHTML = `
            <h3 class="story-title">${this.escapeHtml(story.title)}</h3>
            <p class="story-preview">${this.escapeHtml(story.preview || story.content.substring(0, 150) + '...')}</p>
            <p class="story-meta">By ${this.escapeHtml(story.author)} • ${story.word_count || 0} words</p>
        `;
        
        return div;
    }

    async loadCharacterPairs() {
        const pairs = await PairService.getPairs(8);
        const container = document.querySelector('.pairs-board');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (pairs.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No character pairs created yet');
            return;
        }

        pairs.forEach(pair => {
            const card = this.createPairCard(pair);
            container.appendChild(card);
        });

        container.querySelectorAll('.poster-card').forEach(card => {
            card.addEventListener('click', () => {
                const pairId = card.dataset.pairId;
                this.modalManager.showPairDetail(pairId);
            });
        });
    }

    createPairCard(pair) {
        const div = document.createElement('div');
        div.className = 'poster-card';
        div.dataset.pairId = pair.id;
        
        div.innerHTML = `
            <div class="character-names">
                <h3>${this.escapeHtml(pair.character1_name)}</h3>
                <span>&</span>
                <h3>${this.escapeHtml(pair.character2_name)}</h3>
            </div>
        `;
        
        return div;
    }

    async loadArchive() {
        const archives = await ArchiveService.getArchiveStats();
        const container = document.querySelector('.archive-board');
        
        if (!container) return;
        
        container.innerHTML = '';

        const archiveTypes = [
            { type: 'text', icon: '📜', label: 'Text Logs' },
            { type: 'artwork', icon: '🎨', label: 'Artwork' },
            { type: 'photo', icon: '📸', label: 'Photos' },
            { type: 'mixed', icon: '🎬', label: 'Mixed Media' }
        ];

        archiveTypes.forEach(archiveType => {
            const count = archives[archiveType.type] || 0;
            const card = this.createArchiveCard(archiveType, count);
            container.appendChild(card);
        });

        container.querySelectorAll('.canister-card').forEach(card => {
            card.addEventListener('click', () => {
                const archiveType = card.dataset.archiveType;
                this.modalManager.showArchiveList(archiveType);
            });
        });
    }

    createArchiveCard(archiveType, count) {
        const div = document.createElement('div');
        div.className = 'canister-card';
        div.dataset.archiveType = archiveType.type;
        
        div.innerHTML = `
            <span class="canister-icon">${archiveType.icon}</span>
            <h3 class="canister-label">${archiveType.label}</h3>
            <p class="canister-count">${count} ${count === 1 ? 'entry' : 'entries'}</p>
        `;
        
        return div;
    }

    async loadGallery() {
        const folders = await GalleryService.getFolders(6);
        const container = document.querySelector('.gallery-folders');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (folders.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No gallery folders yet');
            return;
        }

        folders.forEach(folder => {
            const card = this.createGalleryCard(folder);
            container.appendChild(card);
        });

        container.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', () => {
                const folderId = card.dataset.folderId;
                this.modalManager.showGalleryFolder(folderId);
            });
        });
    }

    createGalleryCard(folder) {
        const div = document.createElement('div');
        div.className = 'folder-card';
        div.dataset.folderId = folder.id;
        
        // Create preview grid
        let previewHtml = '';
        for (let i = 0; i < 6; i++) {
            previewHtml += '<div class="preview-thumb"></div>';
        }
        
        div.innerHTML = `
            <h3 class="folder-title">${this.escapeHtml(folder.name)}</h3>
            <div class="folder-preview">
                ${previewHtml}
            </div>
            <p class="folder-count">${folder.image_count} ${folder.image_count === 1 ? 'image' : 'images'}</p>
        `;
        
        return div;
    }

    handleActionButtonClick() {
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;

        const pageId = activePage.id;
        
        switch (pageId) {
            case 'trpg':
                this.modalManager.showTRPGForm();
                break;
            case 'stories':
                this.modalManager.showStoryForm();
                break;
            case 'pairs':
                this.modalManager.showPairForm();
                break;
            case 'archive':
                this.modalManager.showArchiveUpload();
                break;
            case 'gallery':
                this.modalManager.showGalleryForm();
                break;
        }
    }

    showLoading(pageId) {
        const page = document.getElementById(pageId);
        if (!page) return;
        
        const container = page.querySelector('.container');
        if (container && !container.querySelector('.loading-spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '🎬';
            container.appendChild(spinner);
        }
    }

    hideLoading(pageId) {
        const page = document.getElementById(pageId);
        if (!page) return;
        
        const spinner = page.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    showError(pageId, message) {
        const page = document.getElementById(pageId);
        if (!page) return;
        
        const container = page.querySelector('.container');
        if (container) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = message;
            container.appendChild(error);
            
            setTimeout(() => error.remove(), 5000);
        }
    }

    getEmptyStateHTML(message) {
        return `
            <div class="empty-state">
                <p>${message}</p>
                <p>Click the button below to create your first one!</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public method to refresh data when navigating between pages
    async refreshCurrentPage() {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            await this.loadPageData(activePage.id);
        }
    }
}