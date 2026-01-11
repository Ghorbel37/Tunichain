import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination } from "@mui/material";
import { ethers } from "ethers";
import PaymentRegistryABI from "../abi/PaymentRegistry.json";
import { apiClient } from "../utils/apiClient";

// Read contract address from .env
const PAYMENT_REGISTRY_ADDRESS = import.meta.env.VITE_PAYMENT_REGISTRY_ADDRESS;
const BLOCKCHAIN_NAME = import.meta.env.VITE_BLOCKCHAIN_NAME;
const BLOCKCHAIN_CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
    apiClient.get('/api/banks')
      .then(setBanks)
      .catch(() => setBanks([]));
    apiClient.get('/api/invoices/unpaid')
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  // Fetch payments for selected bank
  useEffect(() => {
    if (selectedBank) {
      if (selectedBank === "all") {
        apiClient.get(`/api/payments`)
          .then(setPayments)
          .catch(() => setPayments([]));
      } else {
        apiClient.get(`/api/payments/bank/${selectedBank}`)
          .then(setPayments)
          .catch(() => setPayments([]));
      }
    }
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
      //Verify metamask is installed
      if (!window.ethereum) throw new Error("MetaMask is not installed");

      // Validate amount is positive
      if (parseFloat(form.amountPaid) <= 0) {
        throw new Error("Amount paid must be positive");
      }

      // Get bank's Ethereum address
      const bank = banks.find(b => b._id === form.bank);
      if (!bank || !bank.address) {
        throw new Error("Bank address not found");
      }

      // Convert amount from decimal to integer (multiply by 1000)
      const amountPaidInteger = Math.round(parseFloat(form.amountPaid) * 1000);

      // Backend API call first - backend will listen for blockchain event
      const paymentData = await apiClient.post('/api/payments', {
        ...form,
        amountPaid: amountPaidInteger
      });
      console.log("Payment added in backend:", paymentData);

      // Resolve hashes and amount from backend response
      let paymentHash = paymentData.paymentHash || paymentData?.blockchain?.paymentHash;
      let invoiceHash = (paymentData.invoice && paymentData.invoice.invoiceHash) || paymentData.invoiceHash;
      const amountPaidBN = ethers.BigNumber.from(String(paymentData.amountPaid));

      // // Fallback: fetch invoice hash if missing
      // if (!invoiceHash && form.invoice) {
      //   try {
      //     const invRes = await fetch(`${BACKEND_URL}/api/invoices/${form.invoice}`);
      //     if (invRes.ok) {
      //       const inv = await invRes.json();
      //       invoiceHash = inv.invoiceHash;
      //     }
      //   } catch (_) {}
      // }

      // Validate hashes
      if (!paymentHash || !ethers.utils.isHexString(paymentHash, 32)) {
        throw new Error("Invalid paymentHash from backend (must be 32-byte hex)");
      }
      if (!invoiceHash || !ethers.utils.isHexString(invoiceHash, 32)) {
        throw new Error("Invalid invoiceHash from backend (must be 32-byte hex)");
      }

      // Blockchain transaction: store payment in PaymentRegistry contract
      const provider = new ethers.providers.Web3Provider(window.ethereum, {
        name: BLOCKCHAIN_NAME,
        chainId: BLOCKCHAIN_CHAIN_ID
      });
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      // Ensure signer is the bank address
      const connected = (await signer.getAddress()).toLowerCase();
      if (bank.address && connected !== bank.address.toLowerCase()) {
        throw new Error(`Please switch MetaMask to the bank's address: ${bank.address}`);
      }

      const contract = new ethers.Contract(PAYMENT_REGISTRY_ADDRESS, PaymentRegistryABI.abi, signer);

      const tx = await contract.storePayment(paymentHash, invoiceHash, amountPaidBN);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // console.log("Blockchain transaction successful - backend listener will catch event");
      } else {
        throw new Error("Transaction failed on-chain.");
      }

      setSuccess("Payment receipt added and submitted to blockchain successfully");

      // Remove the selected invoice from the invoices list
      setInvoices(prev => prev.filter(inv => inv._id !== form.invoice));

      // Refresh payments if a bank is selected in the filter
      if (selectedBank) {
        if (selectedBank === "all") {
          apiClient.get(`/api/payments`)
            .then(setPayments)
            .catch(() => setPayments([]));
        } else {
          apiClient.get(`/api/payments/bank/${selectedBank}`)
            .then(setPayments)
            .catch(() => setPayments([]));
        }
      }

      setForm(f => ({
        bank: f.bank,
        invoice: "",
        paymentReference: "",
        amountPaid: "",
        paidAt: "",
        documentPath: "",
      }));
    } catch (err) {
      setError(err.message || "Error adding payment receipt");
      console.error("Error submitting payment:", err);
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
          inputProps={{ min: 0.000, step: 0.01 }}
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
          <MenuItem key="all" value="all">All Banks</MenuItem>
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
                  <TableCell>{pay.amountPaid ? (pay.amountPaid / 1000).toFixed(3) : '0.000'}</TableCell>
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
