// models/PaymentProof.js
import mongoose from "mongoose";

const paymentProofSchema = new mongoose.Schema({
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    paymentReference: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    documentPath: { type: String }, // optional: where the proof PDF/image is stored securely
    paymentHash: { type: String }, // hashed for blockchain anchoring
});

export default mongoose.model("PaymentProof", paymentProofSchema);
