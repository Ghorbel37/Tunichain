// routes/paymentRoutes.js
import express from "express";
import PaymentProof from "../models/PaymentProof.js";
import Invoice from "../models/Invoice.js";
import Bank from "../models/Bank.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

// Get all payments (role-aware)
// Banks see only their own payments
// Tax admin and superAdmin see all payments
router.get("/", authMiddleware, requireRoles(USER_ROLES.BANK, USER_ROLES.TAX_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TTN), async (req, res) => {
    try {
        let query = {};

        // If user is a bank, filter by their bank account
        if (req.user.role === USER_ROLES.BANK) {
            const bank = await Bank.findOne({ address: req.user.address });
            if (!bank) {
                return res.status(404).json({ message: "Bank account not found for this user" });
            }
            query.bank = bank._id;
        }

        const payments = await PaymentProof.find(query)
            .populate("bank")
            .populate("invoice");
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a payment proof
// Banks can create payment proofs for themselves
// Tax admin and superAdmin can create payment proofs for any bank
router.post("/", authMiddleware, requireRoles(USER_ROLES.BANK, USER_ROLES.SUPER_ADMIN), async (req, res) => {
    try {
        let bankId = req.body.bank;

        // If user is a bank, automatically use their bank account
        if (req.user.role === USER_ROLES.BANK) {
            const bank = await Bank.findOne({ address: req.user.address });
            if (!bank) {
                return res.status(404).json({ message: "Bank account not found for this user" });
            }
            bankId = bank._id;
        }

        // For superAdmin, bank must be provided in request body
        if (!bankId && req.user.role === USER_ROLES.SUPER_ADMIN) {
            return res.status(400).json({ message: "Bank ID is required" });
        }

        const paymentData = { ...req.body, bank: bankId };
        const proof = new PaymentProof(paymentData);
        await proof.save();



        // Re-fetch with population to include related docs and ensure paymentHash is present
        const saved = await PaymentProof.findById(proof._id)
            .populate("bank")
            .populate("invoice");

        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all payments for a specific bank
router.get("/bank/:bankId", async (req, res) => {
    const payments = await PaymentProof.find({ bank: req.params.bankId })
        .populate("bank")
        .populate("invoice");
    res.json(payments);
});

// Get all payment receipts related to a specific seller
// Accessible by tax admin and superAdmin
router.get("/seller/:sellerId", authMiddleware, requireRoles(USER_ROLES.TAX_ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TTN), async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Find all invoices for this seller
        const invoices = await Invoice.find({ seller: sellerId });
        const invoiceIds = invoices.map(inv => inv._id);

        // Find all payments for these invoices
        const payments = await PaymentProof.find({ invoice: { $in: invoiceIds } })
            .populate("bank")
            .populate("invoice");

        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
