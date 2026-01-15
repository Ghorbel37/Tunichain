import React from "react";
import { Box, Typography, Paper, Container, Grid, Divider, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function About() {
    return (
        <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                    About Tunichain
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                    Building trust in the digital economy through blockchain-powered transparency and accountability.
                </Typography>
            </Box>

            <Grid container spacing={6}>
                {/* Mission Section */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 4, borderRadius: 2 }} elevation={2}>
                        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                            Our Mission
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                            Tunichain is designed to address the challenges of transparency and trust in online commercial transactions. By leveraging blockchain technology, we create a shared, immutable ledger accessible to all key stakeholders: Sellers, Banks, and Government Institutions.
                        </Typography>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                            Our goal is to streamline compliance, reduce fraud, and foster a healthier economic environment where every transaction is verifiable and secure.
                        </Typography>
                    </Paper>
                </Grid>

                {/* Stakeholders Section */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4, textAlign: 'center' }}>
                        Key Participants
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, height: '100%' }} elevation={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <StorefrontIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                                    <Typography variant="h5" fontWeight="bold">Sellers</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Registered merchants who issue invoices for goods and services. On Tunichain, their invoices are cryptographically secured, ensuring authenticity and preventing tampering.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, height: '100%' }} elevation={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                    <Typography variant="h5" fontWeight="bold">Banks</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Financial institutions that process payments. They verify transactions against issued invoices and record payment receipts directly on the blockchain.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, height: '100%' }} elevation={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <GavelIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                                    <Typography variant="h5" fontWeight="bold">Government</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Tax authorities and regulatory bodies (like TTN) who oversee the ecosystem. They have real-time access to transaction data for auditing and tax collection purposes.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Technology Section */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                            Powered by Blockchain
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <List>
                                    <ListItem>
                                        <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary="Immutable Records" secondary="Once data is written, it cannot be altered or deleted." />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary="Decentralized Trust" secondary="No single point of failure or control." />
                                    </ListItem>
                                </List>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <List>
                                    <ListItem>
                                        <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary="Smart Contracts" secondary="Automated logic for invoice validation and payment processing." />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                        <ListItemText primary="Real-time Auditing" secondary="Instant verification of financial activities." />
                                    </ListItem>
                                </List>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}
