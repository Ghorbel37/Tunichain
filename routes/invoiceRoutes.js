// routes/invoiceRoutes.js
import express from "express";
import Invoice from "../models/Invoice.js";
import Seller from "../models/Seller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

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

// Get invoices for a specific seller
router.get("/seller/:sellerId", async (req, res) => {
    const invoices = await Invoice.find({ seller: req.params.sellerId }).populate("seller");
    res.json(invoices);
});

// Get all unpaid invoices
router.get("/unpaid", async (req, res) => {
    try {
        const unpaidInvoices = await Invoice.find({ status: "unpaid" }).populate("seller");
        res.json(unpaidInvoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
