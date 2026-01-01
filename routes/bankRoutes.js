// routes/bankRoutes.js
import express from "express";
import Bank from "../models/Bank.js";
import User from "../models/User.js";
import { USER_ROLES } from "../models/Roles.js";

const router = express.Router();

/**
 * @route   POST /api/banks
 * @desc    Add a new bank (called by tax administration)
 * @access  Public or protected (depending on your auth setup)
 */
router.post("/", async (req, res) => {
    try {
        const { name, bicCode, address } = req.body;

        if (!address) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        // Check if bank already exists
        const existing = await Bank.findOne({ bicCode });
        if (existing) {
            return res.status(400).json({ message: "Bank already registered" });
        }

        // Check if user already exists
        let user = await User.findOne({ address: address.toLowerCase() });
        if (!user) {
            // Create user with 'bank' role
            user = new User({
                address: address,
                role: USER_ROLES.BANK
            });
            await user.save();
        }

        const bank = new Bank({
            name,
            bicCode,
            address: address,
            user: user._id
        });
        await bank.save();

        res.status(201).json(bank);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   GET /api/banks
 * @desc    Get all banks
 * @access  Public
 */
router.get("/", async (req, res) => {
    try {
        const banks = await Bank.find();
        res.json(banks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   GET /api/banks/:id
 * @desc    Get a bank by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.id);
        if (!bank) return res.status(404).json({ message: "Bank not found" });
        res.json(bank);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   PUT /api/banks/:id
 * @desc    Update bank info (e.g., address, name)
 * @access  Admin only
 */
router.put("/:id", async (req, res) => {
    try {
        const { name, address, isActive } = req.body;
        const bank = await Bank.findById(req.params.id);

        if (!bank) return res.status(404).json({ message: "Bank not found" });

        if (name) bank.name = name;
        if (address) bank.address = address;
        if (typeof isActive === "boolean") bank.isActive = isActive;

        await bank.save();
        res.json(bank);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   DELETE /api/banks/:id
 * @desc    Deactivate or delete a bank
 * @access  Admin only
 */
router.delete("/:id", async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.id);
        if (!bank) return res.status(404).json({ message: "Bank not found" });

        // Instead of hard deleting, mark inactive for audit traceability
        bank.isActive = false;
        await bank.save();

        res.json({ message: "Bank deactivated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
