// models/Seller.js
import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    taxId: { type: String, required: true, unique: true },
    address: { type: String, required: false, index: true, lowercase: true, unique: true }, // Wallet address
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String },
    registeredAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    blockchain: {
        status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
        transactionHash: { type: String, default: null, index: true },
        blockNumber: { type: Number, default: null, index: true },
        logIndex: { type: Number, default: null },
    },
});

export default mongoose.model("Seller", sellerSchema);
