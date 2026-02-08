import { apiClient } from '../utils/apiClient';

/**
 * Get full SIWE message from backend
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<{message: string}>}
 */
export async function getSiweMessage(address) {
    try {
        return await apiClient.get(`/api/auth/message?address=${address}`);
    } catch (error) {
        throw new Error(error.message || 'Failed to get SIWE message.');
    }
}

/**
 * Verify SIWE signature and issue JWT
 * @param {string} message - SIWE message string
 * @param {string} signature - Signed message
 * @returns {Promise<{token: string, user: {address: string, role: string}}>}
 */
export async function verify(message, signature) {
    try {
        return await apiClient.post('/api/auth/verify', { message, signature });
    } catch (error) {
        throw new Error(error.message || 'Signature verification failed');
    }
}

/**
 * Get current authenticated user
 * @returns {Promise<{address: string, role: string}>}
 */
export async function getMe() {
    try {
        return await apiClient.get('/api/auth/me');
    } catch (error) {
        throw new Error(error.message || 'Failed to get user info');
    }
}
