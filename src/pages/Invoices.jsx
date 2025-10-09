
import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Divider, TablePagination, InputAdornment } from "@mui/material";

export default function Invoices() {

  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    seller: "",
    invoiceNumber: "",
    clientName: "",
    totalAmount: "",
    vatAmount: "",
    items: [{ description: "", quantity: 1, price: "" }],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch sellers for dropdown
  useEffect(() => {
    fetch("http://localhost:4000/api/sellers")
      .then(res => res.json())
      .then(setSellers)
      .catch(() => setSellers([]));
  }, []);

  // Fetch invoices for selected seller
  useEffect(() => {
    if (!selectedSeller) return;
    fetch(`http://localhost:4000/api/invoices/seller/${selectedSeller}`)
      .then(res => res.json())
      .then(setInvoices)
      .catch(() => setInvoices([]));
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
      const res = await fetch("http://localhost:4000/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalAmount: parseFloat(form.totalAmount),
          vatAmount: parseFloat(form.vatAmount),
          items: form.items.map(item => ({
            ...item,
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price)
          }))
        }),
      });
      if (!res.ok) throw new Error("Failed to add invoice");
      setSuccess("Invoice added successfully");
      setForm(f => ({
        seller: f.seller,
        invoiceNumber: "",
        clientName: "",
        totalAmount: "",
        vatAmount: "",
        items: [{ description: "", quantity: 1, price: "" }],
      }));
      // Refresh invoices
      fetch(`http://localhost:4000/api/invoices/seller/${selectedSeller}`)
        .then(res => res.json())
        .then(setInvoices)
        .catch(() => setInvoices([]));
    } catch (err) {
      setError(err.message || "Error adding invoice");
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
          label="Total Amount"
          name="totalAmount"
          value={form.totalAmount}
          onChange={handleFormChange}
          type="number"
          required
          sx={{ mr: 2 }}
        />
        <TextField
          label="VAT Amount"
          name="vatAmount"
          value={form.vatAmount}
          onChange={handleFormChange}
          type="number"
          required
        />
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
              sx={{ width: 100 }}
            />
            <TextField
              label="Price"
              type="number"
              value={item.price}
              onChange={e => handleItemChange(idx, 'price', e.target.value)}
              required
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
          <MenuItem value="">All Sellers</MenuItem>
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
                  <TableCell>{inv.totalAmount}</TableCell>
                  <TableCell>{inv.vatAmount}</TableCell>
                  <TableCell>
                    {inv.items && inv.items.map((item, i) => (
                      <div key={i}>
                        {item.description} (x{item.quantity}) - ${item.price}
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
