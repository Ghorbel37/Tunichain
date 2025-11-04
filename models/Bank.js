// models/Bank.js
import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bicCode: { type: String, required: true, unique: true }, // Bank Identifier Code
    address: { type: String, required: false, index: true, lowercase: true, unique: true }, //Wallet address
    registeredAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    blockchain: {
        status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
        transactionHash: { type: String, default: null, index: true },
        blockNumber: { type: Number, default: null, index: true },
        logIndex: { type: Number, default: null },
    },
});

export default mongoose.model("Bank", bankSchema);
