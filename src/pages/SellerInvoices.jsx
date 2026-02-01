import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination, IconButton } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ethers } from "ethers";
import InvoiceValidationABI from "../abi/InvoiceValidation.json";
import { apiClient } from "../utils/apiClient";
import InvoiceDetailsModal from "../components/InvoiceDetailsModal";

// Read contract address from .env
const INVOICE_VALIDATION_ADDRESS = import.meta.env.VITE_INVOICE_VALIDATION_ADDRESS;
const BLOCKCHAIN_NAME = import.meta.env.VITE_BLOCKCHAIN_NAME;
const BLOCKCHAIN_CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID);

export default function SellerInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [form, setForm] = useState({
        invoiceNumber: "",
        clientName: "",
        vatRate: "190",
        items: [{ description: "", quantity: 1, price: "" }],
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Fetch invoices for logged-in seller
    const fetchInvoices = async () => {
        try {
            const data = await apiClient.get('/api/invoices');
            setInvoices(data);
        } catch (err) {
            setInvoices([]);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleItemChange = (idx, field, value) => {
        const items = form.items.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item
        );
        setForm({ ...form, items });
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { description: "", quantity: 1, price: "" }] });
    };

    const removeItem = (idx) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            if (!window.ethereum) throw new Error("MetaMask is not installed");

            // Validate that quantity and price are positive
            for (const item of form.items) {
                if (parseInt(item.quantity, 10) <= 0) {
                    throw new Error("Quantity must be positive");
                }
                if (parseFloat(item.price) < 0.001) {
                    throw new Error("Price must be at least 0.001");
                }
            }

            // Convert price from decimal to integer (multiply by 1000)
            const invoiceItems = form.items.map(item => ({
                ...item,
                quantity: parseInt(item.quantity, 10),
                price: Math.round(parseFloat(item.price) * 1000)
            }));

            // Backend API call - seller is determined by JWT
            const invoiceData = await apiClient.post('/api/invoices', {
                ...form,
                items: invoiceItems,
                vatRatePermille: parseInt(form.vatRate, 10)
            });

            // Blockchain transaction
            const provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: BLOCKCHAIN_NAME,
                chainId: BLOCKCHAIN_CHAIN_ID
            });
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(INVOICE_VALIDATION_ADDRESS, InvoiceValidationABI.abi, signer);

            const invoiceHash = invoiceData.invoiceHash;
            const totalAmountBN = ethers.BigNumber.from(invoiceData.totalAmount.toString());
            const vatRatePermille = parseInt(form.vatRate, 10);

            const tx = await contract.submitInvoice(invoiceHash, totalAmountBN, vatRatePermille);
            const receipt = await tx.wait();
            if (receipt.status !== 1) {
                throw new Error("Transaction failed on-chain.");
            }

            setSuccess("Invoice created and submitted to blockchain");
            fetchInvoices();

            setForm({
                invoiceNumber: "",
                clientName: "",
                vatRate: form.vatRate,
                items: [{ description: "", quantity: 1, price: "" }],
            });
        } catch (err) {
            setError(err.message || "Error creating invoice");
            console.error("Error submitting invoice:", err);
        }
    };

    const paginatedInvoices = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">My Invoices</Typography>

            {/* Invoice form */}
            <Paper sx={{ mb: 3, p: 3 }} elevation={2}>
                <Typography variant="h6" gutterBottom>Create New Invoice</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <TextField
                            label="Invoice Number"
                            name="invoiceNumber"
                            value={form.invoiceNumber}
                            onChange={handleFormChange}
                            required
                            sx={{ minWidth: 200 }}
                        />
                        <TextField
                            label="Client Name"
                            name="clientName"
                            value={form.clientName}
                            onChange={handleFormChange}
                            required
                            sx={{ minWidth: 200 }}
                        />
                        <TextField
                            select
                            label="VAT Rate"
                            name="vatRate"
                            value={form.vatRate}
                            onChange={handleFormChange}
                            required
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="190">19%</MenuItem>
                            <MenuItem value="70">7%</MenuItem>
                            <MenuItem value="0">0%</MenuItem>
                        </TextField>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Items</Typography>

                    {form.items.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            <TextField
                                label="Description"
                                value={item.description}
                                onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                required
                                sx={{ minWidth: 200 }}
                            />
                            <TextField
                                label="Quantity"
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                required
                                inputProps={{ min: 1 }}
                                sx={{ width: 100 }}
                            />
                            <TextField
                                label="Price"
                                type="number"
                                value={item.price}
                                onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                required
                                inputProps={{ min: 0.001, step: 0.001 }}
                                sx={{ width: 120 }}
                            />
                            <Button color="error" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                                Remove
                            </Button>
                        </Box>
                    ))}

                    <Button onClick={addItem} sx={{ mb: 2 }}>Add Item</Button>
                    <Box>
                        <Button type="submit" variant="contained" color="primary" size="large">
                            Create Invoice
                        </Button>
                    </Box>

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                </Box>
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {/* Invoices table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Invoice History</Typography>

            {invoices.length === 0 ? (
                <Alert severity="info">No invoices found. Create your first invoice above.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Invoice Number</TableCell>
                                <TableCell>Client Name</TableCell>
                                <TableCell>Total (HT)</TableCell>
                                <TableCell>VAT Amount</TableCell>
                                <TableCell>Total (TTC)</TableCell>
                                <TableCell>Payment Status</TableCell>
                                <TableCell>TTN Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedInvoices.map((inv, idx) => (
                                <TableRow key={inv._id || idx}>
                                    <TableCell>{inv.invoiceNumber}</TableCell>
                                    <TableCell>{inv.clientName}</TableCell>
                                    <TableCell>{inv.totalAmount ? (inv.totalAmount / 1000).toFixed(3) : '0.000'}</TableCell>
                                    <TableCell>{inv.vatAmount ? (inv.vatAmount / 1000).toFixed(3) : '0.000'}</TableCell>
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
                                                backgroundColor: inv.status === "paid" ? 'success.light' : 'warning.light',
                                                color: inv.status === "paid" ? 'success.dark' : 'warning.dark',
                                            }}
                                        >
                                            {inv.status === "paid" ? 'Paid' : 'Unpaid'}
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
                                                backgroundColor: 
                                                    inv.ttnValidationStatus === 'valid' ? 'success.light' : 
                                                    inv.ttnValidationStatus === 'invalid' ? 'error.light' : 'warning.light',
                                                color: 
                                                    inv.ttnValidationStatus === 'valid' ? 'success.dark' : 
                                                    inv.ttnValidationStatus === 'invalid' ? 'error.dark' : 'warning.dark',
                                            }}
                                        >
                                            {inv.ttnValidationStatus?.charAt(0).toUpperCase() + inv.ttnValidationStatus?.slice(1) || 'Pending'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            onClick={() => {
                                                setSelectedInvoice(inv);
                                                setModalOpen(true);
                                            }}
                                            color="primary"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
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
                onClose={() => setModalOpen(false)}
                invoice={selectedInvoice}
            />
        </Box>
    );
}
