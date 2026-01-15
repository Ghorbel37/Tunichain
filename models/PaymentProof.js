// models/PaymentProof.js
import mongoose from "mongoose";
import { ethers } from "ethers";
import Bank from "./Bank.js";
import Invoice from "./Invoice.js";

const paymentProofSchema = new mongoose.Schema({
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    paymentReference: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    documentPath: { type: String }, // optional: where the proof PDF/image is stored securely
    paymentHash: { type: String, index: true },
    blockchain: {
        status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
        transactionHash: { type: String, default: null, index: true },
        blockNumber: { type: Number, default: null, index: true },
        logIndex: { type: Number, default: null },
        paymentId: { type: Number, default: null },
    },
});

// Pre-save middleware to generate paymentHash
paymentProofSchema.pre('save', async function(next) {
    // Generate payment hash if not already set
    if (!this.paymentHash && this.bank && this.invoice) {
        try {
            // Fetch bank and invoice data
            const bank = await Bank.findById(this.bank);
            const invoice = await Invoice.findById(this.invoice);
            
            if (bank && bank.address && invoice && invoice.invoiceHash) {
                const paymentData = {
                    bank: bank.address,
                    invoiceId: invoice.blockchain?.invoiceId || 0,
                    paymentReference: this.paymentReference,
                    amountPaid: this.amountPaid
                };
                const paymentDataString = JSON.stringify(paymentData);
                
                // Debug logging
                console.log('Payment hash generation data:', paymentDataString);
                
                this.paymentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(paymentDataString));
                
                console.log('Generated payment hash:', this.paymentHash);
            }
        } catch (error) {
            console.error("Error generating payment hash:", error);
        }
    }
    
    next();
});

// Post-save middleware to update Invoice paid status
paymentProofSchema.post('save', async function (doc) {
    try {
        if (doc.invoice) {
            await Invoice.findByIdAndUpdate(doc.invoice, {
                paidAt: doc.paidAt || new Date(),
                status: 'paid'
            });
            console.log(`Invoice ${doc.invoice} marked as paid`);
        }
    } catch (error) {
        console.error("Error updating invoice paid status:", error);
    }
});

export default mongoose.model("PaymentProof", paymentProofSchema);
