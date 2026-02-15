import React, { useState } from "react";
import { Button, Typography, Box, Alert, CircularProgress, Paper } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from "../context/AuthContext";

function isMetaMaskInstalled() {
    return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
}

export default function Login({ onLoginSuccess }) {
    const { login, loading: authLoading, error: authError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(""); // Track current step for UX
    const metaMask = isMetaMaskInstalled();

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            if (!metaMask) {
                setError("MetaMask is not installed. Please install MetaMask to continue.");
                setLoading(false);
                return;
            }

            setStep("Connecting to MetaMask...");

            // Call the auth context login which handles the full SIWE flow
            const redirectPath = await login();

            setStep("Login successful!");

            // Callback to notify parent of successful login with redirect path
            if (onLoginSuccess) {
                onLoginSuccess(redirectPath);
            }
        } catch (err) {
            setError(err.message || "Login failed");
        }
        setLoading(false);
        setStep("");
    };

    const displayError = error || authError;
    const isLoading = loading || authLoading;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: (theme) =>
                    theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Paper
                elevation={10}
                sx={{
                    p: 5,
                    borderRadius: 4,
                    textAlign: 'center',
                    maxWidth: 400,
                    width: '90%',
                    backdropFilter: 'blur(10px)',
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 60, 0.85)'
                            : 'rgba(255, 255, 255, 0.95)',
                }}
            >
                <AccountBalanceWalletIcon
                    sx={{
                        fontSize: 64,
                        color: 'primary.main',
                        mb: 2,
                    }}
                />
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Tunichain
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in with your Ethereum wallet
                </Typography>

                {!metaMask && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        MetaMask is not installed. Please install MetaMask to continue.
                    </Alert>
                )}

                {displayError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {displayError}
                    </Alert>
                )}

                {step && !displayError && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {step}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleLogin}
                    disabled={isLoading || !metaMask}
                    startIcon={isLoading ? null : <AccountBalanceWalletIcon />}
                    sx={{
                        minWidth: 220,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        boxShadow: 3,
                        '&:hover': {
                            boxShadow: 6,
                        }
                    }}
                >
                    {isLoading ? (
                        <>
                            <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                            Signing In...
                        </>
                    ) : (
                        "Connect Wallet"
                    )}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                    Only registered users can sign in
                </Typography>
            </Paper>
        </Box>
    );
}
