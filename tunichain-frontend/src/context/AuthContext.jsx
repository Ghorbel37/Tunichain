import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers, utils } from 'ethers';
import { getSiweMessage, verify, getMe } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'tunichain_jwt';

// Role-based default routes
const ROLE_ROUTES = {
    bank: '/',
    seller: '/',
    taxAdministration: '/',
    superAdmin: '/',
    ttn: '/',
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Restore session on mount
    useEffect(() => {
        async function restoreSession() {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            if (savedToken) {
                try {
                    const userData = await getMe(savedToken);
                    setUser(userData);
                    setToken(savedToken);
                } catch (err) {
                    // Token invalid/expired, clear it
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        }
        restoreSession();
    }, []);

    const login = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            // Check MetaMask
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            // Request accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = utils.getAddress(accounts[0]);
            // console.log(address)

            // Get full SIWE message from backend
            const { message } = await getSiweMessage(address);

            // Sign message with ethers v5
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const signature = await signer.signMessage(message);

            // Verify with backend
            const { token: jwtToken, user: userData } = await verify(message, signature);

            // Store token and user
            localStorage.setItem(TOKEN_KEY, jwtToken);
            setToken(jwtToken);
            setUser(userData);
            setLoading(false);

            // Return the default route for this role
            return ROLE_ROUTES[userData.role] || '/';
        } catch (err) {
            setError(err.message || 'Login failed');
            setLoading(false);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setError(null);
    }, []);

    const value = {
        user,
        token,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        getDefaultRoute: () => (user ? ROLE_ROUTES[user.role] || '/' : '/'),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export { ROLE_ROUTES };
