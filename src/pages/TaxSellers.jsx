import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, TablePagination, TextField, InputAdornment } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { apiClient } from "../utils/apiClient";

export default function TaxSellers() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchSellers = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await apiClient.get('/api/sellers');
                setSellers(data);
            } catch (err) {
                setError(err.message || "Error fetching sellers");
            }
            setLoading(false);
        };
        fetchSellers();
    }, []);

    // Filter sellers by search
    const filteredSellers = sellers.filter(
        (seller) =>
            seller.name.toLowerCase().includes(search.toLowerCase()) ||
            seller.taxId.toLowerCase().includes(search.toLowerCase()) ||
            (seller.address || "").toLowerCase().includes(search.toLowerCase()) ||
            (seller.email || "").toLowerCase().includes(search.toLowerCase())
    );

    const paginatedSellers = filteredSellers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4, px: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">Registered Sellers</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View all registered sellers in the system
            </Typography>

            <TextField
                label="Search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                sx={{ mb: 3, width: 350 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {sellers.length === 0 && !loading ? (
                <Alert severity="info">No sellers found in the system.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Tax ID</TableCell>
                                <TableCell>Wallet Address</TableCell>
                                <TableCell>Email</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedSellers.map((seller, idx) => (
                                <TableRow key={seller._id || idx}>
                                    <TableCell>{seller.name}</TableCell>
                                    <TableCell>{seller.taxId}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {seller.address}
                                    </TableCell>
                                    <TableCell>{seller.email}</TableCell>
                                </TableRow>
                            ))}
                            {paginatedSellers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No sellers match your search</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredSellers.length}
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
