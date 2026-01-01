// server.js
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { initBankAddedListener, initSellerAddedListener, initInvoiceStoredListener, initPaymentStoredListener } from "./routes/blockchainListener.js";
import app from "./index.js";

dotenv.config();
connectDB();

// Initialize blockchain event listener
const RPC_URL = process.env.RPC_URL;
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
const INVOICE_VALIDATION_ADDRESS = process.env.INVOICE_VALIDATION_ADDRESS;
const PAYMENT_REGISTRY_ADDRESS = process.env.PAYMENT_REGISTRY_ADDRESS;

if (REGISTRY_ADDRESS && RPC_URL) {
  try {
    initBankAddedListener(RPC_URL, REGISTRY_ADDRESS);
    initSellerAddedListener(RPC_URL, REGISTRY_ADDRESS);
  } catch (error) {
    console.error("Failed to start blockchain listener:", error.message);
  }
} else {
  console.warn("REGISTRY_ADDRESS or RPC_URL not found in .env file. Blockchain listeners not started.");
}

if (INVOICE_VALIDATION_ADDRESS && RPC_URL) {
  try {
    initInvoiceStoredListener(RPC_URL, INVOICE_VALIDATION_ADDRESS);
  } catch (error) {
    console.error("Failed to start invoice blockchain listener:", error.message);
  }
} else {
  console.warn("INVOICE_VALIDATION_ADDRESS or RPC_URL not found in .env file. Invoice listener not started.");
}

if (PAYMENT_REGISTRY_ADDRESS && RPC_URL) {
  try {
    initPaymentStoredListener(RPC_URL, PAYMENT_REGISTRY_ADDRESS);
  } catch (error) {
    console.error("Failed to start payment blockchain listener:", error.message);
  }
} else {
  console.warn("PAYMENT_REGISTRY_ADDRESS or RPC_URL not found in .env file. Payment listener not started.");
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}\nAPI docs at http://localhost:${PORT}/api-docs`));
