// public/js/app.js
(function() {
    'use strict';

    // Load required scripts in order
    const scripts = [
        'js/components/navigation.js',
        'js/components/boardManager.js',
        'js/components/modalManager.js',
        'js/services/trpgService.js',
        'js/services/storyService.js',
        'js/services/pairService.js',
        'js/services/archiveService.js',
        'js/services/galleryService.js',
        'js/services/netlifyAuthService.js'
    ];

    let loadedCount = 0;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + '?v=' + Date.now(); // Cache busting
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function loadAllScripts() {
        for (const script of scripts) {
            try {
                await loadScript(script);
                loadedCount++;
                console.log(`✅ Loaded ${script}`);
            } catch (error) {
                console.error(`❌ Failed to load ${script}:`, error);
            }
        }
        
        return loadedCount === scripts.length;
    }

    class CinemaApp {
        constructor() {
            this.navigation = null;
            this.boardManager = null;
            this.init();
        }

        async init() {
            try {
                // Check if all dependencies are loaded
                if (!window.CinemaNavigation || !window.BoardManager) {
                    console.warn('Some dependencies not loaded, running in limited mode');
                }

                // Check Supabase connection (non-blocking)
                this.checkSupabaseConnection().catch(err => {
                    console.warn('Supabase connection check failed:', err);
                });
                
                // Initialize components
                if (window.CinemaNavigation) {
                    this.navigation = new window.CinemaNavigation(this.onPageChange.bind(this));
                }
                
                if (window.BoardManager) {
                    this.boardManager = new window.BoardManager();
                    
                    // Initialize modal manager if available
                    if (window.ModalManager) {
                        this.boardManager.modalManager = new window.ModalManager();
                    }
                }
                
                // Set up global error handling
                this.setupErrorHandling();
                
                console.log('✅ Yugyeong\'s Cinema initialized successfully');
                
                // Mark app as loaded
                window.APP_LOADED = true;
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                this.showInitError();
            }
        }

        async checkSupabaseConnection() {
            if (!window.supabaseClient || !window.TABLES) {
                throw new Error('Supabase not configured');
            }

            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .select('count', { count: 'exact' });
                    
                if (error) throw error;
                console.log('✅ Supabase connected successfully');
            } catch (error) {
                console.error('Supabase connection error:', error);
                // Don't throw - allow app to run in limited mode
            }
        }

        onPageChange(pageId) {
            // Refresh data when page changes
            if (this.boardManager && this.boardManager.refreshCurrentPage) {
                this.boardManager.refreshCurrentPage();
            }
        }

        setupErrorHandling() {
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                // Don't show error toast for every promise rejection
            });

            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                // Only show errors for critical failures
                if (event.error && event.error.message && event.error.message.includes('Cannot read')) {
                    this.showError('An unexpected error occurred');
                }
            });
        }

        showInitError() {
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div class="error-container">
                        <h2>Connection Error</h2>
                        <p>Some features may be limited. Please check your connection and try again.</p>
                        <button onclick="location.reload()" class="retry-btn">Retry</button>
                    </div>
                `;
            }
        }

        showError(message) {
            // Create toast notification
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
    }

    // Initialize app when DOM is loaded
    async function initializeApp() {
        console.log('Starting app initialization...');
        
        // Load all required scripts
        const allLoaded = await loadAllScripts();
        
        if (!allLoaded) {
            console.warn('Not all scripts loaded successfully');
        }
        
        // Wait a bit for scripts to initialize their globals
        setTimeout(() => {
            new CinemaApp();
        }, 100);
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    // Export globally for debugging
    window.CinemaApp = CinemaApp;
})();