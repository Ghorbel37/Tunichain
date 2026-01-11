// routes/paymentRoutes.js
import express from "express";
import PaymentProof from "../models/PaymentProof.js";
import Invoice from "../models/Invoice.js";
import Bank from "../models/Bank.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

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

        // Update invoice status
        await Invoice.findByIdAndUpdate(req.body.invoice, { status: "paid" });

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

export default router;
