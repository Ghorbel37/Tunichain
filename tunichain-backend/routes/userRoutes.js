// routes/userRoutes.js
import express from "express";
import User from "../models/User.js";
import { USER_ROLES } from "../models/Roles.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = express.Router();

// All routes require superAdmin role
router.use(authMiddleware);
router.use(requireRoles(USER_ROLES.SUPER_ADMIN));

/**
 * @route   POST /api/users
 * @desc    Create a new user (wallet + role)
 * @access  superAdmin only
 */
router.post("/", async (req, res) => {
    try {
        const { address, role } = req.body;

        if (!address || !role) {
            return res.status(400).json({ error: "Address and role are required" });
        }

        // Validate role
        const validRoles = Object.values(USER_ROLES);
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role",
                validRoles
            });
        }

        // Check if user already exists
        const existing = await User.findOne({ address: address.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const user = new User({
            address: address,
            role
        });
        await user.save();

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  superAdmin only
 */
router.get("/", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   GET /api/users/:address
 * @desc    Get user by wallet address
 * @access  superAdmin only
 */
router.get("/:address", async (req, res) => {
    try {
        const user = await User.findOne({
            address: req.params.address.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   PUT /api/users/:address
 * @desc    Update user role or status
 * @access  superAdmin only
 */
router.put("/:address", async (req, res) => {
    try {
        const { role, isActive } = req.body;
        const user = await User.findOne({
            address: req.params.address.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate role if provided
        if (role) {
            const validRoles = Object.values(USER_ROLES);
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: "Invalid role",
                    validRoles
                });
            }
            user.role = role;
        }

        if (typeof isActive === "boolean") {
            user.isActive = isActive;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   DELETE /api/users/:address
 * @desc    Deactivate a user (soft delete)
 * @access  superAdmin only
 */
router.delete("/:address", async (req, res) => {
    try {
        const user = await User.findOne({
            address: req.params.address.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Soft delete - mark as inactive
        user.isActive = false;
        await user.save();

        res.json({ message: "User deactivated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
