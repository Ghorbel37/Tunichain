import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, TablePagination, TextField, MenuItem } from "@mui/material";
import { apiClient } from "../utils/apiClient";

export default function TaxPayments() {
    const [sellers, setSellers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch sellers for filter dropdown
    useEffect(() => {
        apiClient.get('/api/sellers')
            .then(setSellers)
            .catch(() => setSellers([]));
    }, []);

    // Fetch payments based on selected seller
    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            setError("");
            try {
                let data;
                if (selectedSeller && selectedSeller != "all") {
                    data = await apiClient.get(`/api/payments/seller/${selectedSeller}`);
                } else {
                    data = await apiClient.get('/api/payments');
                }
                setPayments(data);
            } catch (err) {
                setError(err.message || "Error fetching payments");
                setPayments([]);
            }
            setLoading(false);
        };
        fetchPayments();
    }, [selectedSeller]);

    const paginatedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">All Payment Receipts</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all payment receipts in the system. Filter by seller to see specific payments.
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

            {payments.length === 0 && !loading ? (
                <Alert severity="info">
                    {selectedSeller ? "No payments found for this seller." : "No payments found in the system."}
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Payment Reference</TableCell>
                                <TableCell>Invoice</TableCell>
                                <TableCell>Bank</TableCell>
                                <TableCell>Amount Paid</TableCell>
                                <TableCell>Paid At</TableCell>
                                <TableCell>Document</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedPayments.map((pay) => (
                                <TableRow key={pay._id}>
                                    <TableCell>{pay.paymentReference}</TableCell>
                                    <TableCell>{pay.invoice?.invoiceNumber || 'N/A'}</TableCell>
                                    <TableCell>{pay.bank?.name || 'N/A'}</TableCell>
                                    <TableCell>{pay.amountPaid ? (pay.amountPaid / 1000).toFixed(3) : '0.000'}</TableCell>
                                    <TableCell>{pay.paidAt ? new Date(pay.paidAt).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell>{pay.documentPath || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={payments.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>
            )}
        </Box>
    );
}
