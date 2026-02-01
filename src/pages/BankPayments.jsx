import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination } from "@mui/material";
import { ethers } from "ethers";
import PaymentRegistryABI from "../abi/PaymentRegistry.json";
import { apiClient } from "../utils/apiClient";

// Read contract address from .env
const PAYMENT_REGISTRY_ADDRESS = import.meta.env.VITE_PAYMENT_REGISTRY_ADDRESS;
const BLOCKCHAIN_NAME = import.meta.env.VITE_BLOCKCHAIN_NAME;
const BLOCKCHAIN_CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID);

export default function BankPayments() {
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState({
        invoice: "",
        paymentReference: "",
        rib: "",
        documentPath: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Fetch unpaid invoices and bank's payments
    const fetchData = async () => {
        try {
            const [invoicesData, paymentsData] = await Promise.all([
                apiClient.get('/api/invoices/unpaid'),
                apiClient.get('/api/payments')
            ]);
            setInvoices(invoicesData);
            setPayments(paymentsData);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFormInvoiceChange = (e) => {
        setForm(f => ({ ...f, invoice: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            if (!window.ethereum) throw new Error("MetaMask is not installed");

            // Backend API call - bank is determined by JWT
            const paymentData = await apiClient.post('/api/payments', form);
            console.log("Payment added in backend:", paymentData);

            // Resolve hashes and amount from backend response
            let paymentHash = paymentData.paymentHash || paymentData?.blockchain?.paymentHash;
            let invoiceHash = (paymentData.invoice && paymentData.invoice.invoiceHash) || paymentData.invoiceHash;
            const amountPaidBN = ethers.BigNumber.from(String(paymentData.amountPaid));

            // Validate hashes
            if (!paymentHash || !ethers.utils.isHexString(paymentHash, 32)) {
                throw new Error("Invalid paymentHash from backend (must be 32-byte hex)");
            }
            if (!invoiceHash || !ethers.utils.isHexString(invoiceHash, 32)) {
                throw new Error("Invalid invoiceHash from backend (must be 32-byte hex)");
            }

            // Blockchain transaction
            const provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: BLOCKCHAIN_NAME,
                chainId: BLOCKCHAIN_CHAIN_ID
            });
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(PAYMENT_REGISTRY_ADDRESS, PaymentRegistryABI.abi, signer);

            const tx = await contract.storePayment(paymentHash, invoiceHash, amountPaidBN);
            const receipt = await tx.wait();
            if (receipt.status !== 1) {
                throw new Error("Transaction failed on-chain.");
            }

            setSuccess("Payment receipt submitted to blockchain");

            // Remove the selected invoice from list and refresh payments
            setInvoices(prev => prev.filter(inv => inv._id !== form.invoice));
            fetchData();

            setForm({
                invoice: "",
                paymentReference: "",
                rib: "",
                documentPath: "",
            });
        } catch (err) {
            setError(err.message || "Error submitting payment");
            console.error("Error submitting payment:", err);
        }
    };

    const paginatedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">My Payment Receipts</Typography>

            {/* Payment form */}
            <Paper sx={{ mb: 3, p: 3 }} elevation={2}>
                <Typography variant="h6" gutterBottom>Record New Payment</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <TextField
                            select
                            label="Invoice"
                            name="invoice"
                            value={form.invoice}
                            onChange={handleFormInvoiceChange}
                            required
                            sx={{ minWidth: 250 }}
                            SelectProps={{
                                renderValue: (selected) => {
                                    const selectedInvoice = invoices.find(inv => inv._id === selected);
                                    if (!selectedInvoice) return '';
                                    return `${selectedInvoice.seller?.name || 'N/A'} → ${selectedInvoice.clientName || 'N/A'} : ${selectedInvoice.totalAmountWithVat ? (selectedInvoice.totalAmountWithVat / 1000).toFixed(3) : '0.000'}`;
                                }
                            }}
                        >
                            {invoices.length === 0 ? (
                                <MenuItem disabled>No unpaid invoices available</MenuItem>
                            ) : (
                                invoices.map(inv => (
                                    <MenuItem key={inv._id} value={inv._id}>
                                        <Box>
                                            <Box fontWeight="bold">{inv.invoiceNumber}</Box>
                                            <Box fontSize="0.8rem" color="text.secondary">
                                                {inv.seller?.name || 'No seller'} → {inv.clientName || 'No client'}
                                            </Box>
                                            <Box fontSize="0.8rem">
                                                Total: {inv.totalAmountWithVat ? (inv.totalAmountWithVat / 1000).toFixed(3) : '0.000'}
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))
                            )}
                        </TextField>
                        <TextField
                            label="Payment Reference"
                            name="paymentReference"
                            value={form.paymentReference}
                            onChange={handleFormChange}
                            required
                            sx={{ minWidth: 200 }}
                        />
                        <TextField
                            label="RIB"
                            name="rib"
                            value={form.rib}
                            onChange={handleFormChange}
                            required
                            sx={{ minWidth: 200 }}
                        />
                        <TextField
                            label="Document Path (Optional)"
                            name="documentPath"
                            value={form.documentPath}
                            onChange={handleFormChange}
                            sx={{ minWidth: 200 }}
                        />
                    </Box>

                    <Button type="submit" variant="contained" color="primary" size="large">
                        Record Payment
                    </Button>

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                </Box>
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {/* Payments table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Payment History</Typography>

            {payments.length === 0 ? (
                <Alert severity="info">No payments recorded yet.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Payment Reference</TableCell>
                                <TableCell>Invoice Number</TableCell>
                                <TableCell>Seller</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell>Amount Paid</TableCell>
                                <TableCell>Buyer RIB</TableCell>
                                <TableCell>Paid At</TableCell>
                                <TableCell>Document</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedPayments.map((pay, idx) => (
                                <TableRow key={pay._id || idx}>
                                    <TableCell>{pay.paymentReference}</TableCell>
                                    <TableCell>{pay.invoice?.invoiceNumber || 'N/A'}</TableCell>
                                    <TableCell>{pay.invoice?.seller?.name || 'N/A'}</TableCell>
                                    <TableCell>{pay.invoice?.clientName || 'N/A'}</TableCell>
                                    <TableCell>{pay.amountPaid ? (pay.amountPaid / 1000).toFixed(3) : '0.000'}</TableCell>
                                    <TableCell>{pay.rib || 'N/A'}</TableCell>
                                    <TableCell>{new Date(pay.paidAt).toLocaleString()}</TableCell>
                                    <TableCell>{pay.documentPath ? '✓' : '✗'}</TableCell>
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
