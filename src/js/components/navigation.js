export class CinemaNavigation {
    constructor(onPageChange) {
        this.pages = [];
        this.navButtons = [];
        this.currentPage = 'home';
        this.onPageChange = onPageChange;
        
        this.initializePages();
        this.initializeNavigation();
        this.setupEventListeners();
    }

    initializePages() {
        const pageElements = document.querySelectorAll('.page');
        pageElements.forEach(page => {
            if (page.id) {
                this.pages.push({
                    id: page.id,
                    element: page
                });
            }
        });
    }

    initializeNavigation() {
        // Navigation buttons
        const navButtonElements = document.querySelectorAll('.nav-btn');
        navButtonElements.forEach(button => {
            this.navButtons.push({
                element: button,
                pageId: button.getAttribute('data-page')
            });
        });
    }

    setupEventListeners() {
        // Nav button clicks
        this.navButtons.forEach(navButton => {
            navButton.element.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = navButton.pageId;
                if (pageId && pageId !== this.currentPage) {
                    this.showPage(pageId);
                    this.setActiveNavButton(navButton.element);
                }
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const pageId = e.state?.pageId || 'home';
            this.showPage(pageId, false);
            this.updateActiveNavButton(pageId);
        });

        // Listen for board refresh events
        document.addEventListener('refresh-board', () => {
            if (this.onPageChange) {
                this.onPageChange(this.currentPage);
            }
        });
    }

    showPage(pageId, pushState = true) {
        // Hide loading screen if it exists
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Hide all pages
        this.pages.forEach(page => {
            page.element.classList.remove('active');
        });

        // Show selected page
        const targetPage = this.pages.find(page => page.id === pageId);
        if (targetPage) {
            targetPage.element.classList.add('active');
            this.currentPage = pageId;
            
            // Update URL without page reload
            if (pushState) {
                const newUrl = pageId === 'home' ? '/' : `/#${pageId}`;
                window.history.pushState({ pageId }, '', newUrl);
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Trigger page change callback
            if (this.onPageChange) {
                this.onPageChange(pageId);
            }
        }
    }

    setActiveNavButton(activeButton) {
        // Remove active class from all nav buttons
        this.navButtons.forEach(navButton => {
            navButton.element.classList.remove('active');
        });

        // Add active class to clicked button
        activeButton.classList.add('active');
    }

    updateActiveNavButton(pageId) {
        const navButton = this.navButtons.find(btn => btn.pageId === pageId);
        if (navButton) {
            this.setActiveNavButton(navButton.element);
        }
    }

    // Initialize from URL hash
    initializeFromUrl() {
        const hash = window.location.hash.slice(1);
        if (hash && this.pages.some(page => page.id === hash)) {
            this.showPage(hash, false);
            this.updateActiveNavButton(hash);
        }
    }
}