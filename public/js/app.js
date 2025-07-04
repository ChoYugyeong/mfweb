// public/js/app.js
(function() {
    'use strict';

    class CinemaApp {
        constructor() {
            this.navigation = null;
            this.boardManager = null;
            this.init();
        }

        async init() {
            try {
                // Check if all dependencies are loaded
                if (!window.CinemaNavigation || !window.BoardManager || !window.supabaseClient) {
                    throw new Error('Required dependencies not loaded');
                }

                // Check Supabase connection
                await this.checkSupabaseConnection();
                
                // Initialize components
                this.navigation = new window.CinemaNavigation(this.onPageChange.bind(this));
                this.boardManager = new window.BoardManager();
                
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
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .select('count', { count: 'exact' });
                    
                if (error) throw error;
                console.log('✅ Supabase connected successfully');
            } catch (error) {
                console.error('Supabase connection error:', error);
                throw new Error('Failed to connect to database');
            }
        }

        onPageChange(pageId) {
            // Refresh data when page changes
            if (this.boardManager) {
                this.boardManager.refreshCurrentPage();
            }
        }

        setupErrorHandling() {
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.showError('An unexpected error occurred');
            });

            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.showError('An unexpected error occurred');
            });
        }

        showInitError() {
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div class="error-container">
                        <h2>Connection Error</h2>
                        <p>Unable to connect to the database. Please check your connection and try again.</p>
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
            document.body.appendChild(toast);
            
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
    function initializeApp() {
        // Check if we're in development and need to load env variables
        if (window.location.hostname === 'localhost') {
            // In development, you might want to set these directly
            window.SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
            window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
        }
        
        // Wait a bit for all scripts to load
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