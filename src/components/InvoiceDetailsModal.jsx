import React, { useState, useContext } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    Chip, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Alert
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiClient } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

/**
 * Reusable Invoice Details Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.invoice - Invoice object to display
 * @param {Function} props.onValidationSuccess - Callback after successful validation
 * @param {boolean} props.showValidationButtons - Whether to show validation buttons (default: false)
 */
export default function InvoiceDetailsModal({
    open,
    onClose,
    invoice,
    onValidationSuccess,
    showValidationButtons = false
}) {
    const { user } = useAuth();
    const isTTNUser = user?.role === 'ttn';
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [validationSuccess, setValidationSuccess] = useState("");

    const handleValidation = async (status) => {
        if (!invoice) return;

        setValidating(true);
        setValidationError("");
        setValidationSuccess("");

        try {
            await apiClient.post(`/api/invoices/${invoice._id}/ttn-validation`, { status });
            setValidationSuccess(`Invoice marked as ${status}`);

            // Notify parent component
            if (onValidationSuccess) {
                onValidationSuccess(invoice._id, status);
            }

            // Close modal after a short delay
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            setValidationError(err.message || "Error updating validation status");
        } finally {
            setValidating(false);
        }
    };

    const handleClose = () => {
        setValidationError("");
        setValidationSuccess("");
        onClose();
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

    if (!invoice) return null;

    const ttnStatus = getTtnStatusColor(invoice.ttnValidationStatus);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Invoice Details</Typography>
                    <Chip
                        label={ttnStatus.label}
                        sx={{
                            bgcolor: ttnStatus.bg,
                            color: ttnStatus.color,
                            fontWeight: 'bold'
                        }}
                    />
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Invoice Number</Typography>
                            <Typography variant="body1" fontWeight="medium">{invoice.invoiceNumber}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Client Name</Typography>
                            <Typography variant="body1" fontWeight="medium">{invoice.clientName}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Seller</Typography>
                            <Typography variant="body1" fontWeight="medium">{invoice.seller?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Date Issued</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                            <Chip
                                label={invoice.status === "paid" ? 'Paid' : 'Unpaid'}
                                color={invoice.status === "paid" ? 'success' : 'warning'}
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">VAT Rate</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {typeof invoice.vatRatePermille === 'number' ? `${invoice.vatRatePermille / 10}%` : 'N/A'}
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
                                {invoice.items && invoice.items.map((item, idx) => (
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
                                    {invoice.totalAmount ? (invoice.totalAmount / 1000).toFixed(3) : '0.000'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">VAT Amount:</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body2" align="right" fontWeight="medium">
                                    {invoice.vatAmount ? (invoice.vatAmount / 1000).toFixed(3) : '0.000'}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body1" fontWeight="bold">Total (incl. VAT):</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body1" align="right" fontWeight="bold">
                                    {invoice.totalAmountWithVat ? (invoice.totalAmountWithVat / 1000).toFixed(3) : '0.000'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {validationError && <Alert severity="error" sx={{ mt: 2 }}>{validationError}</Alert>}
                    {validationSuccess && <Alert severity="success" sx={{ mt: 2 }}>{validationSuccess}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions>
                {isTTNUser && invoice.ttnValidationStatus === 'pending' && (
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
                <Button onClick={handleClose} disabled={validating}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
