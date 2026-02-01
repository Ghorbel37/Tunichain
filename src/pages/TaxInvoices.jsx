import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, TablePagination, TextField, MenuItem, IconButton, Tooltip
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiClient } from "../utils/apiClient";
import InvoiceDetailsModal from "../components/InvoiceDetailsModal";

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
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedInvoice(null);
    };

    const handleValidationSuccess = async () => {
        // Refresh invoices after validation
        await fetchInvoices();
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
                                <TableCell>Total (HT)</TableCell>
                                <TableCell>VAT Rate</TableCell>
                                <TableCell>Total (TTC)</TableCell>
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
                                        <TableCell>{typeof inv.vatRatePermille === 'number' ? `${inv.vatRatePermille / 10}%` : 'N/A'}</TableCell>
                                        <TableCell>{inv.totalAmountWithVat ? (inv.totalAmountWithVat / 1000).toFixed(3) : '0.000'}</TableCell>
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

            <InvoiceDetailsModal
                open={modalOpen}
                onClose={handleCloseModal}
                invoice={selectedInvoice}
                onValidationSuccess={handleValidationSuccess}
                showValidationButtons={true}
            />
        </Box>
    );
}
