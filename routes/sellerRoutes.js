// routes/sellerRoutes.js
import express from "express";
import Seller from "../models/Seller.js";

const router = express.Router();

// Add a new seller (called by tax administration)
router.post("/", async (req, res) => {
    try {
        const seller = new Seller(req.body);
        await seller.save();
        res.status(201).json(seller);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all sellers
router.get("/", async (req, res) => {
    const sellers = await Seller.find();
    res.json(sellers);
});

export default router;
