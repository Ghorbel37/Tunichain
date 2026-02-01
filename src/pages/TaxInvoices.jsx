import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, TablePagination, TextField, MenuItem, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, Divider, Chip, Grid
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiClient } from "../utils/apiClient";

export default function TaxInvoices() {
    const [sellers, setSellers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [validationSuccess, setValidationSuccess] = useState("");

    // Fetch sellers for filter dropdown
    useEffect(() => {
        apiClient.get('/api/sellers')
            .then(setSellers)
            .catch(() => setSellers([]));
    }, []);

    // Fetch invoices based on selected seller
    const fetchInvoices = async () => {
        setLoading(true);
        setError("");
        try {
            let data;
            if (selectedSeller && selectedSeller != "all") {
                data = await apiClient.get(`/api/invoices/seller/${selectedSeller}`);
            } else {
                data = await apiClient.get('/api/invoices');
            }
            setInvoices(data);
        } catch (err) {
            setError(err.message || "Error fetching invoices");
            setInvoices([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, [selectedSeller]);

    const handleOpenModal = (invoice) => {
        setSelectedInvoice(invoice);
        setModalOpen(true);
        setValidationError("");
        setValidationSuccess("");
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedInvoice(null);
        setValidationError("");
        setValidationSuccess("");
    };

    const handleValidation = async (status) => {
        if (!selectedInvoice) return;

        setValidating(true);
        setValidationError("");
        setValidationSuccess("");

        try {
            await apiClient.post(`/api/invoices/${selectedInvoice._id}/ttn-validation`, { status });
            setValidationSuccess(`Invoice marked as ${status}`);

            // Refresh invoices
            await fetchInvoices();

            // Close modal after a short delay
            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (err) {
            setValidationError(err.message || "Error updating validation status");
        } finally {
            setValidating(false);
        }
    };

    const getTtnStatusColor = (status) => {
        switch (status) {
            case 'valid':
                return { bg: 'success.light', color: 'success.dark', label: 'Valid' };
            case 'invalid':
                return { bg: 'error.light', color: 'error.dark', label: 'Invalid' };
            case 'pending':
            default:
                return { bg: 'warning.light', color: 'warning.dark', label: 'Pending' };
        }
    };

    const paginatedInvoices = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">All Invoices</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all invoices in the system. Filter by seller to see specific invoices.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    select
                    label="Filter by Seller"
                    value={selectedSeller}
                    onChange={(e) => { setSelectedSeller(e.target.value); setPage(0); }}
                    sx={{ minWidth: 300 }}
                >
                    <MenuItem key="all" value="all">All Sellers</MenuItem>
                    {sellers.map(seller => (
                        <MenuItem key={seller._id} value={seller._id}>{seller.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {invoices.length === 0 && !loading ? (
                <Alert severity="info">
                    {selectedSeller ? "No invoices found for this seller." : "No invoices found in the system."}
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Invoice Number</TableCell>
                                <TableCell>Seller</TableCell>
                                <TableCell>Client Name</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>VAT Amount</TableCell>
                                <TableCell>Payment Status</TableCell>
                                <TableCell>TTN Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedInvoices.map((inv) => {
                                const ttnStatus = getTtnStatusColor(inv.ttnValidationStatus);
                                return (
                                    <TableRow key={inv._id}>
                                        <TableCell>{inv.invoiceNumber}</TableCell>
                                        <TableCell>{inv.seller?.name || 'N/A'}</TableCell>
                                        <TableCell>{inv.clientName}</TableCell>
                                        <TableCell>{inv.totalAmount ? (inv.totalAmount / 1000).toFixed(3) : '0.000'}</TableCell>
                                        <TableCell>{inv.vatAmount ? (inv.vatAmount / 1000).toFixed(3) : '0.000'}</TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: inv.status == "paid" ? 'success.light' : 'warning.light',
                                                    color: inv.status == "paid" ? 'success.dark' : 'warning.dark',
                                                }}
                                            >
                                                {inv.status == "paid" ? 'Paid' : 'Unpaid'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: ttnStatus.bg,
                                                    color: ttnStatus.color,
                                                }}
                                            >
                                                {ttnStatus.label}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenModal(inv)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={invoices.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>
            )}

            {/* Invoice Details Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Invoice Details</Typography>
                        {selectedInvoice && (
                            <Chip
                                label={getTtnStatusColor(selectedInvoice.ttnValidationStatus).label}
                                sx={{
                                    bgcolor: getTtnStatusColor(selectedInvoice.ttnValidationStatus).bg,
                                    color: getTtnStatusColor(selectedInvoice.ttnValidationStatus).color,
                                    fontWeight: 'bold'
                                }}
                            />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedInvoice && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Invoice Number</Typography>
                                    <Typography variant="body1" fontWeight="medium">{selectedInvoice.invoiceNumber}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Client Name</Typography>
                                    <Typography variant="body1" fontWeight="medium">{selectedInvoice.clientName}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Seller</Typography>
                                    <Typography variant="body1" fontWeight="medium">{selectedInvoice.seller?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Date Issued</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {selectedInvoice.issuedAt ? new Date(selectedInvoice.issuedAt).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                                    <Chip
                                        label={selectedInvoice.status === "paid" ? 'Paid' : 'Unpaid'}
                                        color={selectedInvoice.status === "paid" ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">VAT Rate</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {selectedInvoice.vatRatePermille ? `${selectedInvoice.vatRatePermille / 10}%` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Invoice Items</Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="center">Quantity</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell align="center">{item.quantity}</TableCell>
                                                <TableCell align="right">{(item.price / 1000).toFixed(3)}</TableCell>
                                                <TableCell align="right">{((item.price * item.quantity) / 1000).toFixed(3)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                                <Grid container spacing={1}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body2" color="text.secondary">Subtotal (excl. VAT):</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body2" align="right" fontWeight="medium">
                                            {selectedInvoice.totalAmount ? (selectedInvoice.totalAmount / 1000).toFixed(3) : '0.000'}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body2" color="text.secondary">VAT Amount:</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body2" align="right" fontWeight="medium">
                                            {selectedInvoice.vatAmount ? (selectedInvoice.vatAmount / 1000).toFixed(3) : '0.000'}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body1" fontWeight="bold">Total (incl. VAT):</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="body1" align="right" fontWeight="bold">
                                            {selectedInvoice.totalAmount && selectedInvoice.vatAmount
                                                ? ((selectedInvoice.totalAmount + selectedInvoice.vatAmount) / 1000).toFixed(3)
                                                : '0.000'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {validationError && <Alert severity="error" sx={{ mt: 2 }}>{validationError}</Alert>}
                            {validationSuccess && <Alert severity="success" sx={{ mt: 2 }}>{validationSuccess}</Alert>}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedInvoice && selectedInvoice.ttnValidationStatus === 'pending' && (
                        <>
                            <Button
                                onClick={() => handleValidation('valid')}
                                color="success"
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                disabled={validating}
                            >
                                Mark as Valid
                            </Button>
                            <Button
                                onClick={() => handleValidation('invalid')}
                                color="error"
                                variant="contained"
                                startIcon={<CancelIcon />}
                                disabled={validating}
                            >
                                Mark as Invalid
                            </Button>
                        </>
                    )}
                    <Button onClick={handleCloseModal} disabled={validating}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
