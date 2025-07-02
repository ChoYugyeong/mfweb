// src/js/services/netlifyAuthService.js

export class NetlifyAuthService {
    constructor() {
        this.SESSION_KEY = 'yugyeong_cinema_token';
        this.AUTH_ENDPOINT = '/.netlify/functions/auth';
        this.isModalOpen = false;
    }

    /**
     * 현재 토큰 가져오기
     */
    getToken() {
        return sessionStorage.getItem(this.SESSION_KEY);
    }

    /**
     * 인증 상태 확인
     */
    async isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(this.AUTH_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', token })
            });

            const data = await response.json();
            return data.valid === true;
        } catch {
            return false;
        }
    }

    /**
     * 로그인
     */
    async login(password) {
        try {
            const response = await fetch(this.AUTH_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', password })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                sessionStorage.setItem(this.SESSION_KEY, data.token);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    /**
     * 로그아웃
     */
    async logout() {
        const token = this.getToken();
        
        if (token) {
            try {
                await fetch(this.AUTH_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout', token })
                });
            } catch {
                // 로그아웃 실패해도 로컬 토큰은 삭제
            }
        }
        
        sessionStorage.removeItem(this.SESSION_KEY);
    }

    /**
     * 인증된 요청 헤더 생성
     */
    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'X-Auth-Token': token } : {};
    }

    /**
     * 인증이 필요한 액션 래퍼
     */
    async requireAuth(action) {
        const isAuth = await this.isAuthenticated();
        
        if (isAuth) {
            return action();
        } else {
            return new Promise((resolve, reject) => {
                this.showLoginModal(async (authenticated) => {
                    if (authenticated) {
                        resolve(await action());
                    } else {
                        reject(new Error('Authentication required'));
                    }
                });
            });
        }
    }

    /**
     * 로그인 모달 표시
     */
    showLoginModal(callback) {
        if (this.isModalOpen) return;
        
        const existingModal = document.getElementById('auth-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <button class="modal-close" aria-label="Close modal">&times;</button>
                <div class="modal-body">
                    <div class="auth-container">
                        <h2 class="modal-title">Cinema Staff Only</h2>
                        <p class="auth-subtitle">Please enter the password to continue</p>
                        
                        <form id="auth-form" class="cinema-form auth-form">
                            <div class="form-group">
                                <label for="auth-password">Password</label>
                                <input type="password" id="auth-password" name="password" 
                                       placeholder="Enter password" required autofocus>
                                <div class="error-message" id="auth-error" style="display: none;">
                                    Incorrect password. Please try again.
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-cancel" id="auth-cancel">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <span class="btn-text">Enter</span>
                                    <span class="btn-loading" style="display: none;">Verifying...</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.isModalOpen = true;

        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        setTimeout(() => {
            document.getElementById('auth-password')?.focus();
        }, 100);

        // Event handlers
        const form = modal.querySelector('#auth-form');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('#auth-cancel');
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorMsg = modal.querySelector('#auth-error');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                this.isModalOpen = false;
                if (callback) callback(false);
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loading').style.display = 'inline';
            errorMsg.style.display = 'none';
            
            const password = form.password.value;
            
            try {
                const success = await this.login(password);
                
                if (success) {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        modal.remove();
                        this.isModalOpen = false;
                        document.removeEventListener('keydown', handleEscape);
                        if (callback) callback(true);
                        this.showAuthStatus(); // 로그인 상태 표시
                    }, 300);
                } else {
                    // Error
                    errorMsg.style.display = 'block';
                    form.password.value = '';
                    form.password.focus();
                    
                    form.classList.add('shake');
                    setTimeout(() => {
                        form.classList.remove('shake');
                    }, 500);
                }
            } catch (error) {
                console.error('Auth error:', error);
                errorMsg.textContent = 'Connection error. Please try again.';
                errorMsg.style.display = 'block';
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').style.display = 'inline';
                submitBtn.querySelector('.btn-loading').style.display = 'none';
            }
        });
    }

    /**
     * 로그인 상태 표시
     */
    showAuthStatus() {
        const existingStatus = document.getElementById('auth-status');
        if (existingStatus) existingStatus.remove();

        const status = document.createElement('div');
        status.id = 'auth-status';
        status.className = 'auth-status';
        status.innerHTML = `
            <span class="auth-icon">🔓</span>
            <span class="auth-text">Staff Mode</span>
            <button class="auth-logout" title="Logout">×</button>
        `;

        document.body.appendChild(status);

        // Logout button
        status.querySelector('.auth-logout').addEventListener('click', async () => {
            await this.logout();
            status.remove();
            location.reload(); // Refresh to update UI
        });
    }
}

// Create singleton instance
export const authService = new NetlifyAuthService();