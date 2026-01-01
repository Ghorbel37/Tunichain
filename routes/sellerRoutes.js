// routes/sellerRoutes.js
import express from "express";
import Seller from "../models/Seller.js";
import User from "../models/User.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

// Add a new seller (called by tax administration)
router.post("/", async (req, res) => {
    try {
        const { name, taxId, address, email } = req.body;

        if (!address) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        // Check if seller already exists
        const existing = await Seller.findOne({ taxId });
        if (existing) {
            return res.status(400).json({ message: "Seller already registered" });
        }

        // Check if user already exists
        let user = await User.findOne({ address: address.toLowerCase() });
        if (!user) {
            // Create user with 'seller' role
            user = new User({
                address: address,
                role: USER_ROLES.SELLER
            });
            await user.save();
        }

        const seller = new Seller({
            name,
            taxId,
            address: address,
            email,
            user: user._id
        });
        await seller.save();
        res.status(201).json(seller);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all sellers
router.get("/", async (req, res) => {
    try {
        const sellers = await Seller.find();
        res.json(sellers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
