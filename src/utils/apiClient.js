const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'tunichain_jwt';

/**
 * Centralized API client with automatic JWT injection
 */
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Get JWT token from localStorage
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Build headers with automatic JWT injection
     */
    buildHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Generic request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.buildHeaders(options.headers),
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 unauthorized - token expired/invalid
            if (response.status === 401) {
                // Could trigger logout or token refresh here
                localStorage.removeItem(TOKEN_KEY);
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `Request failed with status ${response.status}`);
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
