// public/js/services/netlifyAuthService.js
(function() {
    'use strict';

    class NetlifyAuthService {
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
            console.warn('Authentication service not fully implemented');
            if (callback) callback(false);
        }
    }

    // Create singleton instance and export
    const authService = new NetlifyAuthService();
    window.authService = authService;
    window.NetlifyAuthService = NetlifyAuthService;
})();