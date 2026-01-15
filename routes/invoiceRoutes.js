// routes/invoiceRoutes.js
import express from "express";
import Invoice from "../models/Invoice.js";
import Seller from "../models/Seller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

// Get all invoices (role-aware)
// Sellers see only their own invoices
// Tax admin and superAdmin see all invoices
router.get("/", authMiddleware, requireRoles(USER_ROLES.SELLER, USER_ROLES.TAX_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TTN), async (req, res) => {
    try {
        let query = {};

        // If user is a seller, filter by their seller account
        if (req.user.role === USER_ROLES.SELLER) {
            const seller = await Seller.findOne({ address: req.user.address });
            if (!seller) {
                return res.status(404).json({ message: "Seller account not found for this user" });
            }
            query.seller = seller._id;
        }

        const invoices = await Invoice.find(query).populate("seller");
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create an invoice
// Sellers can create invoices for themselves
// Tax admin and superAdmin can create invoices for any seller
router.post("/", authMiddleware, requireRoles(USER_ROLES.SELLER, USER_ROLES.SUPER_ADMIN), async (req, res) => {
    try {
        let sellerId = req.body.seller;

        // If user is a seller, automatically use their seller account
        if (req.user.role === USER_ROLES.SELLER) {
            const seller = await Seller.findOne({ address: req.user.address });
            if (!seller) {
                return res.status(404).json({ message: "Seller account not found for this user" });
            }
            sellerId = seller._id;
        }

        // For tax admin and superAdmin, seller must be provided in request body
        if (!sellerId && (req.user.role === USER_ROLES.TAX_ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN)) {
            return res.status(400).json({ message: "Seller ID is required" });
        }

        const invoiceData = { ...req.body, seller: sellerId };
        const invoice = new Invoice(invoiceData);
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get invoices for a specific seller, optionally filtered by month
// Accessible by tax admin, superAdmin, and the seller themselves
router.get("/seller/:sellerId", authMiddleware, requireRoles(USER_ROLES.SELLER, USER_ROLES.TAX_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TTN), async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { month } = req.query; // Format: YYYY-MM

        // If user is a seller, verify they're requesting their own data
        if (req.user.role === USER_ROLES.SELLER) {
            const seller = await Seller.findOne({ address: req.user.address });
            if (!seller) {
                return res.status(404).json({ message: "Seller account not found for this user" });
            }
            // Ensure seller can only access their own invoices
            if (seller._id.toString() !== sellerId) {
                return res.status(403).json({ message: "Access denied: You can only view your own invoices" });
            }
        }

        // Build query
        let query = { seller: sellerId };

        // Add month filter if provided
        if (month) {
            // Validate month format (YYYY-MM)
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2024-01)" });
            }

            // Parse month and create date range
            const [year, monthNum] = month.split('-');
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

            query.issuedAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const invoices = await Invoice.find(query).populate("seller");
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all unpaid invoices
// Sellers see only their own unpaid invoices
// Banks, Tax admin and superAdmin see all unpaid invoices
router.get("/unpaid", authMiddleware, async (req, res) => {
    try {
        let query = { status: "unpaid" };

        // If user is a seller, filter by their seller account
        if (req.user.role === USER_ROLES.SELLER) {
            const seller = await Seller.findOne({ address: req.user.address });
            if (!seller) {
                return res.status(404).json({ message: "Seller account not found for this user" });
            }
            query.seller = seller._id;
        }

        const unpaidInvoices = await Invoice.find(query).populate("seller");
        res.json(unpaidInvoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
