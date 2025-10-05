// models/Seller.js
import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    taxId: { type: String, required: true, unique: true },
    address: { type: String },
    email: { type: String },
    registeredAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
});

export default mongoose.model("Seller", sellerSchema);
