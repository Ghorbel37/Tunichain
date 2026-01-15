import React from "react";
import { Box, Typography, Button, Grid, Paper, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GavelIcon from '@mui/icons-material/Gavel';

export default function Home() {
    const navigate = useNavigate();

    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 8,
                    textAlign: 'center',
                    borderRadius: { xs: 0, md: '0 0 50% 50% / 40px' },
                    mb: 6
                }}
            >
                <Container maxWidth="md">
                    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                        Welcome to Tunichain
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                        Revolutionizing Online Commerce with Blockchain Transparency
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
                        A secure, decentralized platform connecting Sellers, Banks, and Government Institutions to ensure trust and efficiency in every transaction.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        onClick={() => navigate('/about')}
                        sx={{ fontWeight: 'bold', px: 4, py: 1.5 }}
                    >
                        Learn More
                    </Button>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ mb: 8 }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 4, height: '100%', textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }} elevation={3}>
                            <SecurityIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" gutterBottom fontWeight="bold">Secure & Transparent</Typography>
                            <Typography color="text.secondary">
                                Every invoice and payment is recorded on the blockchain, creating an immutable audit trail that prevents fraud and ensures accountability.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 4, height: '100%', textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }} elevation={3}>
                            <AccountBalanceIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" gutterBottom fontWeight="bold">Banking Integration</Typography>
                            <Typography color="text.secondary">
                                Seamless integration with banking systems allows for verified payment receipts that are instantly accessible to all authorized parties.
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 4, height: '100%', textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }} elevation={3}>
                            <GavelIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h5" gutterBottom fontWeight="bold">Regulatory Compliance</Typography>
                            <Typography color="text.secondary">
                                Empowering tax authorities and government bodies with real-time oversight of commercial activities and tax obligations.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
