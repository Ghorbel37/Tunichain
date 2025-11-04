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

export default function Banks() {
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ name: "", bicCode: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/banks`);
      if (!res.ok) throw new Error("Failed to fetch banks");
      const data = await res.json();
      setBanks(data);
    } catch (err) {
      setError(err.message || "Error fetching banks");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanks();
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
      const res = await fetch(`${BACKEND_URL}/api/banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add bank");
      setForm({ name: "", bicCode: "", address: "" });
      setSuccess("Bank added successfully");
      fetchBanks();

      // Blockchain transaction: call addBank on Registry contract
      const provider = new ethers.providers.Web3Provider(window.ethereum, {
        name: BLOCKCHAIN_NAME,
        chainId: BLOCKCHAIN_CHAIN_ID
      });
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(REGISTRY_ADDRESS, RegistryABI.abi, signer);
      // The correct ABI for addBank is (address bank, string meta)
      // We'll use form.address as the bank address, and meta as a JSON string with name and bicCode
      const meta = JSON.stringify({ name: form.name, bicCode: form.bicCode });

      const tx = await contract.addBank(form.address, meta);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        // Success
        // console.log(receipt)
        setSuccess(`Bank added successfully`);
      } else {
        throw new Error("Transaction failed on-chain.");
      }

    } catch (err) {
      // setError(err.message || "Error adding bank");
      setError("Error adding bank");
    }
  };

  // Filter banks by search
  const filteredBanks = banks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(search.toLowerCase()) ||
      bank.bicCode.toLowerCase().includes(search.toLowerCase()) ||
      (bank.address || "").toLowerCase().includes(search.toLowerCase())
  );

  // Paginate
  const paginatedBanks = filteredBanks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>Banks</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="BIC Code"
          name="bicCode"
          value={form.bicCode}
          onChange={handleChange}
          required
        />
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>
          Add Bank
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <TextField
        label="Search"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, width: 300 }}
        slotProps={{
            input: {startAdornment: (
            <InputAdornment position="start">
                <SearchIcon />
            </InputAdornment>),
            },
        }}
        />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>BIC Code</TableCell>
              <TableCell>Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBanks.map((bank, idx) => (
              <TableRow key={bank._id || idx}>
                <TableCell>{bank.name}</TableCell>
                <TableCell>{bank.bicCode}</TableCell>
                <TableCell>{bank.address}</TableCell>
              </TableRow>
            ))}
            {paginatedBanks.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No banks found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredBanks.length}
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
