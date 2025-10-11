import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination } from "@mui/material";

export default function Payments() {
  const [banks, setBanks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({
    bank: "",
    invoice: "",
    paymentReference: "",
    amountPaid: "",
    paidAt: "",
    documentPath: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch banks and invoices for dropdowns
  useEffect(() => {
    fetch("http://localhost:4000/api/banks")
      .then(res => res.json())
      .then(setBanks)
      .catch(() => setBanks([]));
    fetch("http://localhost:4000/api/invoices/unpaid")
      .then(res => res.json())
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  // Fetch payments for selected bank
  useEffect(() => {
    if (!selectedBank) return;
    fetch(`http://localhost:4000/api/payments/bank/${selectedBank}`)
      .then(res => res.json())
      .then(setPayments)
      .catch(() => setPayments([]));
  }, [selectedBank]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // For the filter menu
  const handleFilterBankChange = (e) => {
    setSelectedBank(e.target.value);
    setPage(0);
  };

  // For the form bank select
  const handleFormBankChange = (e) => {
    setForm(f => ({ ...f, bank: e.target.value }));
  };

  const handleFormInvoiceChange = (e) => {
    setForm(f => ({ ...f, invoice: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:4000/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add payment receipt");
      setSuccess("Payment receipt added successfully");
      // Remove the selected invoice from the invoices list
      setInvoices(prev => prev.filter(inv => inv._id !== form.invoice));
      setForm(f => ({
        bank: f.bank,
        invoice: "",
        paymentReference: "",
        amountPaid: "",
        paidAt: "",
        documentPath: "",
      }));
      // Refresh payments
      if (selectedBank) {
        fetch(`http://localhost:4000/api/payments/bank/${selectedBank}`)
          .then(res => res.json())
          .then(setPayments)
          .catch(() => setPayments([]));
      }
    } catch (err) {
      setError(err.message || "Error adding payment receipt");
    }
  };

  // Pagination for payments
  const paginatedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>Payment Receipts</Typography>
      {/* Payment form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3, p: 2, background: '#fafafa', borderRadius: 2 }}>
        <TextField
          select
          label="Bank"
          name="bank"
          value={form.bank}
          onChange={handleFormBankChange}
          required
          sx={{ mr: 2, minWidth: 200 }}
        >
          {banks.map(bank => (
            <MenuItem key={bank._id} value={bank._id}>{bank.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Invoice"
          name="invoice"
          value={form.invoice}
          onChange={handleFormInvoiceChange}
          required
          sx={{ mr: 2, minWidth: 200 }}
        >
          {invoices.map(inv => (
            <MenuItem key={inv._id} value={inv._id}>{inv.invoiceNumber}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Payment Reference"
          name="paymentReference"
          value={form.paymentReference}
          onChange={handleFormChange}
          required
          sx={{ mr: 2 }}
        />
        <TextField
          label="Amount Paid"
          name="amountPaid"
          value={form.amountPaid}
          onChange={handleFormChange}
          type="number"
          required
          sx={{ mr: 2 }}
        />
        <TextField
          label="Paid At"
          name="paidAt"
          value={form.paidAt}
          onChange={handleFormChange}
          type="datetime-local"
          required
          sx={{ mr: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Document Path"
          name="documentPath"
          value={form.documentPath}
          onChange={handleFormChange}
          sx={{ mr: 2 }}
        />
        <Button type="submit" variant="contained" color="primary">Add Payment</Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>Payments for Selected Bank</Typography>
      {/* Bank filter menu above the table */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Filter by Bank"
          value={selectedBank}
          onChange={handleFilterBankChange}
          sx={{ minWidth: 250, mr: 2 }}
        >
          <MenuItem value="">All Banks</MenuItem>
          {banks.map(bank => (
            <MenuItem key={bank._id} value={bank._id}>{bank.name}</MenuItem>
          ))}
        </TextField>
      </Box>
      {selectedBank && paginatedPayments.length === 0 && (
        <Alert severity="info">No payments found for this bank.</Alert>
      )}
      {selectedBank && paginatedPayments.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment Reference</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount Paid</TableCell>
                <TableCell>Paid At</TableCell>
                <TableCell>Document Path</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPayments.map((pay, idx) => (
                <TableRow key={pay._id || idx}>
                  <TableCell>{pay.paymentReference}</TableCell>
                  <TableCell>{pay.invoice._id}</TableCell>
                  <TableCell>{pay.amountPaid}</TableCell>
                  <TableCell>{pay.paidAt}</TableCell>
                  <TableCell>{pay.documentPath}</TableCell>
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
