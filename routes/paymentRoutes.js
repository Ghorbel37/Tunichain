// routes/paymentRoutes.js
import express from "express";
import PaymentProof from "../models/PaymentProof.js";
import Invoice from "../models/Invoice.js";

const router = express.Router();

// Add a payment proof
router.post("/", async (req, res) => {
    try {
        const { bank, invoice, amountPaid, paymentReference } = req.body;

        const proof = new PaymentProof(req.body);
        await proof.save();

        // Update invoice status
        await Invoice.findByIdAndUpdate(invoice, { status: "paid" });

        res.status(201).json(proof);
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
