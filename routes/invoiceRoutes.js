// routes/invoiceRoutes.js
import express from "express";
import Invoice from "../models/Invoice.js";

const router = express.Router();

// Create an invoice
router.post("/", async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
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
