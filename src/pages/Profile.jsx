import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Avatar, Chip, Divider, Skeleton, Alert, Card, CardContent, Grid } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../utils/apiClient";

// Truncate address for display
function truncateAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

// Get role display info
function getRoleInfo(role) {
    const roleMap = {
        bank: { label: 'Bank', color: 'primary', description: 'Financial institution authorized to process payments' },
        seller: { label: 'Seller', color: 'success', description: 'Registered seller authorized to create invoices' },
        taxAdministration: { label: 'Tax Administrator', color: 'warning', description: 'Tax authority with read-only access to all records' },
        superAdmin: { label: 'Super Admin', color: 'error', description: 'Full system administrator with all permissions' },
        ttn: { label: 'TTN', color: 'info', description: 'Digital trade intermediary facilitating electronic document exchange and IT services' },
    };
    return roleMap[role] || { label: role, color: 'default', description: 'Unknown role' };
}

export default function Profile() {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await apiClient.get('/api/auth/me');
                setProfile(data);
            } catch (err) {
                setError(err.message || "Failed to load profile");
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const roleInfo = getRoleInfo(profile?.role || authUser?.role);

    if (loading) {
        return (
            <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: 2 }}>
                <Paper sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                        <Skeleton variant="circular" width={100} height={100} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={40} />
                            <Skeleton variant="text" width="40%" height={24} />
                        </Box>
                    </Box>
                    <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">My Profile</Typography>

            {/* Profile Header Card */}
            <Paper
                sx={{
                    p: 4,
                    mb: 3,
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Avatar
                        sx={{
                            width: 100,
                            height: 100,
                            fontSize: '2rem',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            border: '3px solid rgba(255,255,255,0.5)',
                        }}
                    >
                        {profile?.address ? profile.address.slice(2, 4).toUpperCase() : '?'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            Tunichain Account
                        </Typography>
                        <Chip
                            label={roleInfo.label}
                            color={roleInfo.color}
                            size="medium"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Account Details */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <AccountBalanceWalletIcon color="primary" />
                                <Typography variant="h6">Wallet Address</Typography>
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontFamily: 'monospace',
                                    bgcolor: 'action.hover',
                                    p: 1.5,
                                    borderRadius: 1,
                                    wordBreak: 'break-all'
                                }}
                            >
                                {profile?.address || authUser?.address || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Your Ethereum wallet address used for authentication
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <BadgeIcon color="primary" />
                                <Typography variant="h6">Role</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                    label={roleInfo.label}
                                    color={roleInfo.color}
                                    size="large"
                                    sx={{ fontWeight: 'bold' }}
                                />
                                <VerifiedUserIcon color="success" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                {roleInfo.description}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Additional Info */}
            <Paper sx={{ mt: 3, p: 3 }}>
                <Typography variant="h6" gutterBottom>Account Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Account Status</Typography>
                        <Chip label="Active" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Authentication</Typography>
                        <Typography>Sign-In with Ethereum (SIWE)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Network</Typography>
                        <Typography>Tunichain</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
