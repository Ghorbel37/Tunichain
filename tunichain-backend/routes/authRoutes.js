// routes/authRoutes.js
import express from "express";
import { SiweMessage, generateNonce } from "siwe";
import { utils } from "ethers";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// In-memory nonce storage (use Redis in production for multi-instance)
const nonces = new Map();

/**
 * @route   GET /api/auth/message
 * @desc    Generate full SIWE message for signing
 * @access  Public
 */
router.get("/message", async (req, res) => {
    try {
        const { address } = req.query;

        if (!address) {
            return res.status(400).json({ error: "Address query parameter required" });
        }

        // Normalize address to lowercase
        const normalizedAddress = address.toLowerCase();

        // Check if user exists and is active
        const user = await User.findOne({ address: normalizedAddress, isActive: true });
        if (!user) {
            return res.status(403).json({
                error: "User not registered",
                message: "Please contact an administrator to register your wallet"
            });
        }

        // Generate nonce
        const nonce = generateNonce();

        // Create SIWE message
        const frontend_domain = process.env.FRONTEND_DOMAIN || "localhost";
        const appName = process.env.APP_NAME || "Tunichain";
        const frontend_uri = process.env.FRONTEND_URI || `http://${frontend_domain}`;
        const chainId = process.env.CHAIN_ID || 1;
        const message = new SiweMessage({
            domain: frontend_domain,
            address: utils.getAddress(normalizedAddress),
            statement: `Sign in to ${appName}`,
            uri: frontend_uri,
            version: "1",
            chainId: chainId,
            nonce,
            issuedAt: new Date().toISOString()
        });

        // Store nonce with address for verification
        nonces.set(nonce, { address: normalizedAddress, createdAt: Date.now() });

        // Cleanup nonce after 5 minutes
        setTimeout(() => nonces.delete(nonce), 5 * 60 * 1000);

        // Return the full message to be signed
        res.json({ message: message.prepareMessage() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/auth/verify
 * @desc    Verify SIWE signature and issue JWT
 * @access  Public
 */
router.post("/verify", async (req, res) => {
    try {
        const { message, signature } = req.body;

        if (!message || !signature) {
            return res.status(400).json({ error: "Missing message or signature" });
        }

        // Parse and validate SIWE message
        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.verify({ signature: signature, nonce: siweMessage.nonce });

        // Verify nonce exists and matches address
        const nonceData = nonces.get(fields.data.nonce);
        if (!nonceData) {
            return res.status(400).json({ error: "Invalid or expired nonce" });
        }

        if (nonceData.address !== fields.data.address.toLowerCase()) {
            return res.status(400).json({ error: "Address mismatch" });
        }

        // Get user from database
        const user = await User.findOne({
            address: fields.data.address.toLowerCase(),
            isActive: true
        });

        if (!user) {
            return res.status(403).json({ error: "User not registered or inactive" });
        }

        // Create JWT with address and role
        const payload = {
            address: user.address,
            role: user.role
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

        // Delete used nonce
        nonces.delete(fields.data.nonce);

        res.json({
            token,
            user: {
                address: user.address,
                role: user.role
            }
        });
    } catch (err) {
        res.status(400).json({ error: "Invalid SIWE message or signature" });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ address: req.user.address });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            address: user.address,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
