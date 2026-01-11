import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination, InputAdornment } from "@mui/material";
import { ethers } from "ethers";
import InvoiceValidationABI from "../abi/InvoiceValidation.json";
import { apiClient } from "../utils/apiClient";

// Read contract address from .env
const INVOICE_VALIDATION_ADDRESS = import.meta.env.VITE_INVOICE_VALIDATION_ADDRESS;
const BLOCKCHAIN_NAME = import.meta.env.VITE_BLOCKCHAIN_NAME;
const BLOCKCHAIN_CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Invoices() {

  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    seller: "",
    invoiceNumber: "",
    clientName: "",
    vatRate: "190",
    items: [{ description: "", quantity: 1, price: "" }],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch sellers for dropdown
  useEffect(() => {
    apiClient.get('/api/sellers')
      .then(setSellers)
      .catch(() => setSellers([]));
  }, []);

  // Fetch invoices for selected seller
  useEffect(() => {
    if (selectedSeller) {
      if (selectedSeller === "all") {
        apiClient.get('/api/invoices')
          .then(setInvoices)
          .catch(() => setInvoices([]));
      } else {
        apiClient.get(`/api/invoices/seller/${selectedSeller}`)
          .then(setInvoices)
          .catch(() => setInvoices([]));
      }
    }
  }, [selectedSeller]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // For the filter menu
  const handleFilterSellerChange = (e) => {
    setSelectedSeller(e.target.value);
    setPage(0);
  };

  // For the form seller select
  const handleFormSellerChange = (e) => {
    setForm(f => ({ ...f, seller: e.target.value }));
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
      //Verify metamask is installed
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

      // Get seller's Ethereum address
      const seller = sellers.find(s => s._id === form.seller);
      if (!seller || !seller.address) {
        throw new Error("Seller address not found");
      }

      // Prepare invoice data (preserve before form reset)
      // Convert price from decimal (1.xxx) to integer (multiply by 1000) for precise calculations
      const invoiceItems = form.items.map(item => ({
        ...item,
        quantity: parseInt(item.quantity, 10),
        price: Math.round(parseFloat(item.price) * 1000) // Convert to integer: 1.5 -> 1500
      }));

      // Backend API call first - backend will listen for blockchain event
      const invoiceData = await apiClient.post('/api/invoices', {
        ...form,
        items: invoiceItems,
        vatRatePermille: parseInt(form.vatRate, 10)
      });
      // Showing invoice data returned from backend for debugging
      // console.log("Invoice added in backend:", invoiceData);

      // Blockchain transaction: submit invoice to InvoiceValidation contract
      // Use the hash and amount from backend response to ensure consistency
      const provider = new ethers.providers.Web3Provider(window.ethereum, {
        name: BLOCKCHAIN_NAME,
        chainId: BLOCKCHAIN_CHAIN_ID
      });
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(INVOICE_VALIDATION_ADDRESS, InvoiceValidationABI.abi, signer);

      // Use backend's calculated hash and total amount
      const invoiceHash = invoiceData.invoiceHash;
      const totalAmountBN = ethers.BigNumber.from(invoiceData.totalAmount.toString());
      const vatRatePermille = invoiceData.vatRatePermille;

      const tx = await contract.submitInvoice(invoiceHash, totalAmountBN, vatRatePermille);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // console.log("Blockchain transaction successful - backend listener will catch event");
      } else {
        throw new Error("Transaction failed on-chain.");
      }

      setSuccess("Invoice added and submitted to blockchain successfully");

      // Refresh invoices if a seller is selected in the filter
      if (selectedSeller) {
        if (selectedSeller === "all") {
          apiClient.get('/api/invoices')
            .then(setInvoices)
            .catch(() => setInvoices([]));
        } else {
          apiClient.get(`/api/invoices/seller/${selectedSeller}`)
            .then(setInvoices)
            .catch(() => setInvoices([]));
        }
      }

      setForm(f => ({
        seller: f.seller,
        invoiceNumber: "",
        clientName: "",
        vatRate: f.vatRate,
        items: [{ description: "", quantity: 1, price: "" }],
      }));
    } catch (err) {
      setError(err.message || "Error adding invoice");
      console.error("Error submitting invoice:", err);
    }
  };

  // Pagination for invoices
  const paginatedInvoices = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>Invoices</Typography>
      {/* Invoice form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3, p: 2, background: '#fafafa', borderRadius: 2 }}>
        <TextField
          select
          label="Seller"
          name="seller"
          value={form.seller}
          onChange={handleFormSellerChange}
          required
          sx={{ mr: 2, minWidth: 200 }}
        >
          {sellers.map(seller => (
            <MenuItem key={seller._id} value={seller._id}>{seller.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Invoice Number"
          name="invoiceNumber"
          value={form.invoiceNumber}
          onChange={handleFormChange}
          required
          sx={{ mr: 2 }}
        />
        <TextField
          label="Client Name"
          name="clientName"
          value={form.clientName}
          onChange={handleFormChange}
          required
          sx={{ mr: 2 }}
        />
        <TextField
          select
          label="VAT Rate"
          name="vatRate"
          value={form.vatRate}
          onChange={handleFormChange}
          required
          sx={{ mr: 2, minWidth: 150 }}
        >
          <MenuItem value="190">19%</MenuItem>
          <MenuItem value="70">7%</MenuItem>
          <MenuItem value="0">0%</MenuItem>
        </TextField>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Items</Typography>
        {form.items.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1 }}>
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
              inputProps={{ min: 0.000, step: 0.01 }}
              sx={{ width: 120 }}
            />
            <Button color="error" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>Remove</Button>
          </Box>
        ))}
        <Button onClick={addItem} sx={{ mb: 2 }}>Add Item</Button>
        <Box>
          <Button type="submit" variant="contained" color="primary">Add Invoice</Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>Invoices for Selected Seller</Typography>
      {/* Seller filter menu above the table */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Filter by Seller"
          value={selectedSeller}
          onChange={handleFilterSellerChange}
          sx={{ minWidth: 250, mr: 2 }}
        >
          <MenuItem key="all" value="all">All Sellers</MenuItem>
          {sellers.map(seller => (
            <MenuItem key={seller._id} value={seller._id}>{seller.name}</MenuItem>
          ))}
        </TextField>
      </Box>
      {selectedSeller && paginatedInvoices.length === 0 && (
        <Alert severity="info">No invoices found for this seller.</Alert>
      )}
      {selectedSeller && paginatedInvoices.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Client Name</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>VAT Amount</TableCell>
                <TableCell>Items</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.map((inv, idx) => (
                <TableRow key={inv._id || idx}>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.clientName}</TableCell>
                  <TableCell>{inv.totalAmount ? (inv.totalAmount / 1000).toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{inv.vatAmount ? (inv.vatAmount / 1000).toFixed(3) : '0.000'}</TableCell>
                  <TableCell>
                    {inv.items && inv.items.map((item, i) => (
                      <div key={i}>
                        {item.description} (x{item.quantity}) - {(item.price / 1000).toFixed(3)}
                      </div>
                    ))}
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
    </Box>
  );
}
