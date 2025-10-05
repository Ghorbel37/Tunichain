// models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    invoiceNumber: { type: String, required: true },
    clientName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    items: [
        {
            description: String,
            quantity: Number,
            price: Number,
        },
    ],
    issuedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["unpaid", "paid", "cancelled"],
        default: "unpaid",
    },
    // store hash that you can later anchor on blockchain
    invoiceHash: { type: String },
});

export default mongoose.model("Invoice", invoiceSchema);
