// models/Bank.js
import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bicCode: { type: String, required: true, unique: true }, // Bank Identifier Code
    address: { type: String },
    registeredAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    blockchain: {
        status: {
            type: String,
            enum: ["pending", "confirmed", "failed"],
            default: "pending",
        },
        transaction: { type: String, default: null },
    },
});

export default mongoose.model("Bank", bankSchema);
