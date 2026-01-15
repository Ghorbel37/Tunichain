import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Alert, TextField, MenuItem, Button, Card, CardContent,
    Grid, CircularProgress
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import PrintIcon from '@mui/icons-material/Print';
import { apiClient } from "../utils/apiClient";
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
applyPlugin(jsPDF)

export default function TaxSellerReport() {
    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();

    // Fetch sellers for dropdown
    useEffect(() => {
        apiClient.get('/api/sellers')
            .then(data => {
                setSellers(data);
                // Check for sellerId in query params
                const sellerId = searchParams.get('sellerId');
                if (sellerId) {
                    setSelectedSeller(sellerId);
                }
            })
            .catch(() => setSellers([]));
    }, [searchParams]);

    // Fetch invoices when seller and month are selected
    useEffect(() => {
        if (!selectedSeller || !selectedMonth) {
            setInvoices([]);
            return;
        }

        const fetchInvoices = async () => {
            setLoading(true);
            setError("");
            try {
                const monthStr = selectedMonth.format('YYYY-MM');
                const data = await apiClient.get(`/api/invoices/seller/${selectedSeller}?month=${monthStr}`);
                setInvoices(data);
                console.log(data);
            } catch (err) {
                setError(err.message || "Error fetching invoices");
                setInvoices([]);
            }
            setLoading(false);
        };
        fetchInvoices();
    }, [selectedSeller, selectedMonth]);

    // Calculate aggregated values (only for paid invoices)
    const aggregates = React.useMemo(() => {
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const totalAmount = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const vatAmount = paidInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
        const totalWithVat = totalAmount + vatAmount;

        return {
            totalAmount: (totalAmount / 1000).toFixed(3),
            vatAmount: (vatAmount / 1000).toFixed(3),
            totalWithVat: (totalWithVat / 1000).toFixed(3),
        };
    }, [invoices]);

    // Month label for display
    const monthLabel = selectedMonth ? selectedMonth.format('MMMM YYYY') : '';

    // Generate PDF
    const generatePDF = () => {
        const seller = sellers.find(s => s._id === selectedSeller);
        const monthStr = selectedMonth.format('YYYY-MM');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Monthly Invoice Report', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Seller: ${seller?.name || 'N/A'}`, 14, 25);
        doc.text(`Period: ${monthLabel}`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 39);

        // Invoice table
        const tableData = invoices.map(inv => [
            inv.invoiceNumber,
            inv.clientName,
            new Date(inv.issuedAt).toLocaleDateString(),
            `${(inv.vatRatePermille || 0) / 10}%`,
            (inv.totalAmount / 1000).toFixed(3),
            (inv.vatAmount / 1000).toFixed(3),
            ((inv.totalAmount + inv.vatAmount) / 1000).toFixed(3),
            inv.status === 'paid' ? 'Paid' : 'Unpaid'
        ]);

        doc.autoTable({
            startY: 45,
            head: [['Invoice #', 'Client', 'Date', 'VAT %', 'Amount', 'VAT', 'Total', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 126, 234] },
            styles: { fontSize: 8 },
        });

        // Summary section
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Summary', 14, finalY);

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Tax Base (excl. VAT): ${aggregates.totalAmount}`, 14, finalY + 8);
        doc.text(`Total VAT Amount: ${aggregates.vatAmount}`, 14, finalY + 15);

        doc.setFont(undefined, 'bold');
        doc.text(`Total Amount (incl. VAT): ${aggregates.totalWithVat}`, 14, finalY + 22);

        // Print PDF
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const sellerName = sellers.find(s => s._id === selectedSeller)?.name || '';

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">Seller Invoice Report</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Generate monthly invoice reports for sellers with aggregated totals
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Note:</strong> Totals are calculated <strong>only for paid invoices</strong>.
            </Alert>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: selectedSeller ? 4 : 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Select Seller"
                            value={selectedSeller}
                            onChange={(e) => setSelectedSeller(e.target.value)}
                        >
                            <MenuItem value="">-- Select Seller --</MenuItem>
                            {sellers.map(seller => (
                                <MenuItem key={seller._id} value={seller._id}>{seller.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Select Month"
                                value={selectedMonth}
                                onChange={(newValue) => setSelectedMonth(newValue)}
                                views={['year', 'month']}
                                openTo="month"
                                slotProps={{ textField: { fullWidth: true } }}
                                disabled={!selectedSeller}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && selectedSeller && selectedMonth && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Tax Base (excl. VAT)</Typography>
                                    <Typography variant="h5" fontWeight="bold">{aggregates.totalAmount}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>VAT Amount</Typography>
                                    <Typography variant="h5" fontWeight="bold">{aggregates.vatAmount}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>Total (incl. VAT)</Typography>
                                    <Typography variant="h5" fontWeight="bold">{aggregates.totalWithVat}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Report Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h6">
                                {sellerName} - {monthLabel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={generatePDF}
                            disabled={invoices.length === 0}
                        >
                            Print Report
                        </Button>
                    </Box>

                    {/* Invoice Table */}
                    {invoices.length === 0 ? (
                        <Alert severity="info">No invoices found for this seller in the selected month.</Alert>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice #</TableCell>
                                        <TableCell>Client Name</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="center">VAT Rate</TableCell>
                                        <TableCell align="right">Amount (excl. VAT)</TableCell>
                                        <TableCell align="right">VAT Amount</TableCell>
                                        <TableCell align="right">Total (incl. VAT)</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv._id}>
                                            <TableCell>{inv.invoiceNumber}</TableCell>
                                            <TableCell>{inv.clientName}</TableCell>
                                            <TableCell>{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                                            <TableCell align="center">{(inv.vatRatePermille || 0) / 10}%</TableCell>
                                            <TableCell align="right">{(inv.totalAmount / 1000).toFixed(3)}</TableCell>
                                            <TableCell align="right">{(inv.vatAmount / 1000).toFixed(3)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {((inv.totalAmount + inv.vatAmount) / 1000).toFixed(3)}
                                            </TableCell>
                                            <TableCell align="center">
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
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {!selectedSeller && !selectedMonth && (
                <Alert severity="info">Please select a seller and month to view the report.</Alert>
            )}
        </Box>
    );
}
