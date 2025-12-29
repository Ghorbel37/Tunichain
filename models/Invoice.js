// models/Invoice.js
import mongoose from "mongoose";
import { ethers } from "ethers";
import Seller from "./Seller.js";

const invoiceSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    invoiceNumber: { type: String, required: true },
    clientName: { type: String, required: true },
    totalAmount: { type: Number, default: 0 },
    vatRatePermille: { type: Number, default: 190 },
    vatAmount: { type: Number, default: 0 },
    totalAmountWithVat: { type: Number, default: 0 },
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
    invoiceHash: { type: String, index: true },
    blockchain: {
        status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
        transactionHash: { type: String, default: null, index: true },
        blockNumber: { type: Number, default: null, index: true },
        logIndex: { type: Number, default: null },
        invoiceId: { type: Number, default: null }, // On-chain invoice ID
    },
});

// Pre-save middleware to calculate totalAmount, vatAmount, and invoiceHash
invoiceSchema.pre('save', async function(next) {
    if (this.items && this.items.length > 0) {
        this.totalAmount = this.items.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);
        // Calculate VAT (19% of total amount)
        this.vatAmount = this.totalAmount * this.vatRatePermille / 1000;
        this.totalAmountWithVat = this.totalAmount + this.vatAmount;
    }
    
    // Generate invoice hash (matching frontend implementation)
    if (!this.invoiceHash && this.seller) {
        try {
            // Fetch seller address from Seller model
            const seller = await Seller.findById(this.seller);
            if (seller && seller.address) {
                // Clean items to match frontend structure (only description, quantity, price)
                const cleanItems = this.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price
                }));
                
                const hashData = {
                    invoiceNumber: this.invoiceNumber,
                    clientName: this.clientName,
                    seller: seller.address,
                    items: cleanItems
                };
                const invoiceDataString = JSON.stringify(hashData);
                
                // Debug logging
                console.log('Hash generation data:', invoiceDataString);
                
                this.invoiceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(invoiceDataString));
                
                console.log('Generated hash:', this.invoiceHash);
            }
        } catch (error) {
            console.error("Error generating invoice hash:", error);
        }
    }
    
    next();
});

export default mongoose.model("Invoice", invoiceSchema);
