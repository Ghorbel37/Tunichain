import React, { useState } from "react";
import { Button, Typography, Box, Alert, CircularProgress } from "@mui/material";

function isMetaMaskInstalled() {
    return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
}

export default function Login({ onLogin }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [metaMask, setMetaMask] = useState(isMetaMaskInstalled());

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            if (!metaMask) {
                setError("MetaMask is not installed. Please install MetaMask to continue.");
                setLoading(false);
                return;
            }
            // Request accounts
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const address = accounts[0];
            // SIWE v2 logic (pseudo, replace with actual siwe@2 usage)
            // You would use SIWE to create a message, sign it, and verify it server-side
            // For demo, just call onLogin
            onLogin(address);
        } catch (err) {
            setError(err.message || "Login failed");
        }
        setLoading(false);
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h4" gutterBottom>Tunichain Login</Typography>
            {!metaMask && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    MetaMask is not installed. Please install MetaMask to continue.
                </Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button
                variant="contained"
                color="primary"
                onClick={handleLogin}
                disabled={loading || !metaMask}
                sx={{ minWidth: 200 }}
            >
                {loading ? <CircularProgress size={24} /> : "Login with MetaMask"}
            </Button>
        </Box>
    );
}
