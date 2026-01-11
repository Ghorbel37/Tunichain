const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Get full SIWE message from backend
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<{message: string}>}
 */
export async function getSiweMessage(address) {
    const response = await fetch(`${API_BASE_URL}/api/auth/message?address=${address}`);
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get SIWE message.');
    }
    return response.json();
}

/**
 * Verify SIWE signature and issue JWT
 * @param {string} message - SIWE message string
 * @param {string} signature - Signed message
 * @returns {Promise<{token: string, user: {address: string, role: string}}>}
 */
export async function verify(message, signature) {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Signature verification failed');
    }
    return response.json();
}

/**
 * Get current authenticated user
 * @param {string} token - JWT token
 * @returns {Promise<{address: string, role: string}>}
 */
export async function getMe(token) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get user info');
    }
    return response.json();
}
