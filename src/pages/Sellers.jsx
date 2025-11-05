import React, { useEffect, useState } from "react";
import { Divider, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Alert, TablePagination, InputAdornment } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { ethers } from "ethers";
import RegistryABI from "../abi/Registry.json";

// Read contract address from .env
const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS;
const BLOCKCHAIN_NAME = import.meta.env.VITE_BLOCKCHAIN_NAME;
const BLOCKCHAIN_CHAIN_ID = parseInt(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [form, setForm] = useState({ name: "", taxId: "", address: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchSellers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/sellers`);
      if (!res.ok) throw new Error("Failed to fetch sellers");
      const data = await res.json();
      setSellers(data);
    } catch (err) {
      setError(err.message || "Error fetching sellers");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      //Verify metamask is installed
      if (!window.ethereum) throw new Error("MetaMask is not installed");

      // Validate form.address
      if (!ethers.utils.isAddress(form.address)) {
        throw new Error("Invalid Ethereum address provided for address");
      }
      // Backend API call
      const res = await fetch(`${BACKEND_URL}/api/sellers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add seller");
      setForm({ name: "", taxId: "", address: "", email: "" });
      setSuccess("Seller added successfully");
      fetchSellers();

      // Blockchain transaction: call addSeller on Registry contract
      const provider = new ethers.providers.Web3Provider(window.ethereum, {
        name: BLOCKCHAIN_NAME,
        chainId: BLOCKCHAIN_CHAIN_ID
      });
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(REGISTRY_ADDRESS, RegistryABI.abi, signer);
      // The correct ABI for addSeller is (address seller, string meta)
      // We'll use form.address as the seller address, and meta as a JSON string with name, taxId, and email
      const meta = JSON.stringify({ name: form.name, taxId: form.taxId, email: form.email });

      const tx = await contract.addSeller(form.address, meta);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // Success
        // console.log(receipt)
        setSuccess(`Seller added successfully`);
      } else {
        throw new Error("Transaction failed on-chain.");
      }

    } catch (err) {
      // setError(err.message || "Error adding seller");
      setError("Error adding seller");
    }
  };

  // Filter sellers by search
  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name.toLowerCase().includes(search.toLowerCase()) ||
      seller.taxId.toLowerCase().includes(search.toLowerCase()) ||
      (seller.address || "").toLowerCase().includes(search.toLowerCase()) ||
      (seller.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Paginate
  const paginatedSellers = filteredSellers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>Sellers</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="Tax ID"
          name="taxId"
          value={form.taxId}
          onChange={handleChange}
          required
        />
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
        />
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
        />
        <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>
          Add Seller
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <TextField
        label="Search"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, width: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tax ID</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSellers.map((seller, idx) => (
              <TableRow key={seller._id || idx}>
                <TableCell>{seller.name}</TableCell>
                <TableCell>{seller.taxId}</TableCell>
                <TableCell>{seller.address}</TableCell>
                <TableCell>{seller.email}</TableCell>
              </TableRow>
            ))}
            {paginatedSellers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">No sellers found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredSellers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
}
