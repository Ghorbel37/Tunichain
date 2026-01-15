import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Define what routes each role can access
const ROLE_PERMISSIONS = {
    superAdmin: ['/', '/about', '/profile', '/banks', '/sellers', '/invoices', '/payments', '/my-invoices', '/my-payments', '/tax-sellers', '/tax-invoices', '/tax-payments', '/tax-seller-report'],
    bank: ['/', '/profile', '/my-payments'],
    seller: ['/', '/profile', '/my-invoices'],
    taxAdministration: ['/', '/profile', '/tax-sellers', '/tax-invoices', '/tax-payments', '/tax-seller-report'],
};

/**
 * ProtectedRoute component
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} [props.allowedRoles] - Optional: specific roles allowed (if not set, any authenticated user)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User doesn't have required role - redirect to their default route
        const userPermissions = ROLE_PERMISSIONS[user.role] || ['/'];
        const defaultRoute = userPermissions[0];
        return <Navigate to={defaultRoute} replace />;
    }

    // Check path-based access using ROLE_PERMISSIONS
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const currentPath = location.pathname;

    // Check if current path is allowed for user's role
    const isPathAllowed = userPermissions.some(
        (allowedPath) => currentPath === allowedPath || currentPath.startsWith(allowedPath + '/')
    );

    if (!isPathAllowed) {
        // Redirect to user's first allowed route
        const defaultRoute = userPermissions[0] || '/';
        return <Navigate to={defaultRoute} replace />;
    }

    return children;
}

export { ROLE_PERMISSIONS };
