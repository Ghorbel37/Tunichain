import { ethers } from "ethers";
import RegistryArtifact from "../abi/Registry.json" with { type: "json" };
import InvoiceValidationArtifact from "../abi/InvoiceValidation.json" with { type: "json" };
import Bank from "../models/Bank.js";
import Seller from "../models/Seller.js";
import Invoice from "../models/Invoice.js";

// Use the full ABI from the compiled contract
const REGISTRY_ABI = RegistryArtifact.abi;
const INVOICE_VALIDATION_ABI = InvoiceValidationArtifact.abi;

/**
 * Save bank event data to database
 * @param {Object} eventData - Blockchain event data
 */
async function saveBankEventToDatabase(eventData) {
  const {
    walletAddress,
    transactionHash,
    blockNumber,
    logIndex,
  } = eventData;

  // Find existing bank by wallet address
  const bank = await Bank.findOne({ "address": walletAddress });

  if (bank) {
    // Update existing bank with blockchain confirmation data
    bank.blockchain = {
      status: "confirmed",
      transactionHash,
      blockNumber,
      logIndex,
    };
    await bank.save();
    // console.log(`   Updated bank: ${bank.name} (${walletAddress})`);
    return bank;
  } else {
    // console.warn(`   No bank found with wallet address: ${walletAddress}`);
    // console.warn(`   Bank must be created via API first before blockchain events can update it.`);
    return null;
  }
}

/**
 * Initialize blockchain event listener for BankAdded events
 * @param {string} rpcUrl - RPC URL for blockchain connection
 * @param {string} registryAddress - Address of the registry contract
 */
export function initBankAddedListener(rpcUrl, registryAddress) {
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create contract instance
    const registryContract = new ethers.Contract(
      registryAddress,
      REGISTRY_ABI,
      provider
    );

    console.log(`Blockchain listener initialized for contract: ${registryAddress} \nListening for BankAdded events`);

    // Listen for BankAdded events
    registryContract.on("BankAdded", async (bank, meta, event) => {

      // ----- Debugging ----- 
      // ---------------------
      // console.log("\n=== BankAdded Event Detected ===");
      // console.log("Bank Address:", bank);
      // console.log("Metadata:", meta);
      // console.log("Transaction Hash:", event.transactionHash);
      // console.log("Block Number:", event.blockNumber);
      // console.log("Log Index:", event.logIndex);
      // console.log("Event Details:", {
      //   args: event.args,
      //   logIndex: event.logIndex,
      //   transactionIndex: event.transactionIndex
      // });
      
      // Get block timestamp
      try {
        const block = await provider.getBlock(event.blockNumber);
        const blockTimestamp = new Date(block.timestamp * 1000);
        
        // console.log("Block Timestamp:", blockTimestamp);
        
        // Update database with blockchain event data
        await saveBankEventToDatabase({
          walletAddress: bank.toLowerCase(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
        });
      } catch (dbError) {
        // console.error("Failed to save to database:", dbError.message);
      }
      
      // console.log("====================================\n");
    });

    // Handle provider errors
    provider.on("error", (error) => {
      console.error("Provider error:", error);
    });

    return { provider, registryContract };
  } catch (error) {
    console.error("Failed to initialize blockchain listener:", error);
    throw error;
  }
}

/**
 * Stop listening for events (cleanup function)
 * @param {ethers.Contract} registryContract - Contract instance
 */
export function stopBankAddedListener(registryContract) {
  if (registryContract) {
    registryContract.removeAllListeners("BankAdded");
    console.log("BankAdded event listener stopped");
  }
}

/**
 * Save seller event data to database
 * @param {Object} eventData - Blockchain event data
 */
async function saveSellerEventToDatabase(eventData) {
  const {
    walletAddress,
    transactionHash,
    blockNumber,
    logIndex,
  } = eventData;

  // Find existing seller by wallet address
  const seller = await Seller.findOne({ "address": walletAddress });

  if (seller) {
    // Update existing seller with blockchain confirmation data
    seller.blockchain = {
      status: "confirmed",
      transactionHash,
      blockNumber,
      logIndex,
    };
    await seller.save();
    // console.log(`   Updated seller: ${seller.name} (${walletAddress})`);
    return seller;
  } else {
    // console.warn(`   No seller found with wallet address: ${walletAddress}`);
    // console.warn(`   Seller must be created via API first before blockchain events can update it.`);
    return null;
  }
}

/**
 * Initialize blockchain event listener for SellerAdded events
 * @param {string} rpcUrl - RPC URL for blockchain connection
 * @param {string} registryAddress - Address of the registry contract
 */
export function initSellerAddedListener(rpcUrl, registryAddress) {
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create contract instance
    const registryContract = new ethers.Contract(
      registryAddress,
      REGISTRY_ABI,
      provider
    );

    console.log(`Blockchain listener initialized for contract: ${registryAddress} \nListening for SellerAdded events`);

    // Listen for SellerAdded events
    registryContract.on("SellerAdded", async (seller, meta, event) => {
      
      try {        
        // Update database with blockchain event data
        await saveSellerEventToDatabase({
          walletAddress: seller.toLowerCase(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
        });
      } catch (dbError) {
        console.error("Failed to save to database");
      }
      
    });

    // Handle provider errors
    provider.on("error", (error) => {
      console.error("Provider error:", error);
    });

    return { provider, registryContract };
  } catch (error) {
    console.error("Failed to initialize blockchain listener:", error);
    throw error;
  }
}

/**
 * Stop listening for seller events (cleanup function)
 * @param {ethers.Contract} registryContract - Contract instance
 */
export function stopSellerAddedListener(registryContract) {
  if (registryContract) {
    registryContract.removeAllListeners("SellerAdded");
    console.log("SellerAdded event listener stopped");
  }
}

/**
 * Save invoice event data to database
 * @param {Object} eventData - Blockchain event data
 */
async function saveInvoiceEventToDatabase(eventData) {
  const {
    invoiceId,
    invoiceHash,
    transactionHash,
    blockNumber,
    logIndex,
  } = eventData;

  // Find existing invoice by hash
  const invoice = await Invoice.findOne({ "invoiceHash": invoiceHash });

  if (invoice) {
    // Update existing invoice with blockchain confirmation data
    invoice.blockchain = {
      status: "confirmed",
      transactionHash,
      blockNumber,
      logIndex,
      invoiceId,
    };
    await invoice.save();
    // console.log(`   Updated invoice: ${invoice.invoiceNumber} (${invoiceHash})`);
    return invoice;
  } else {
    // console.warn(`   No invoice found with hash: ${invoiceHash}`);
    // console.warn(`   Invoice must be created via API first before blockchain events can update it.`);
    return null;
  }
}

/**
 * Initialize blockchain event listener for InvoiceStored events
 * @param {string} rpcUrl - RPC URL for blockchain connection
 * @param {string} invoiceValidationAddress - Address of the InvoiceValidation contract
 */
export function initInvoiceStoredListener(rpcUrl, invoiceValidationAddress) {
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create contract instance
    const invoiceContract = new ethers.Contract(
      invoiceValidationAddress,
      INVOICE_VALIDATION_ABI,
      provider
    );

    console.log(`Blockchain listener initialized for contract: ${invoiceValidationAddress} \nListening for InvoiceStored events`);

    // Listen for InvoiceStored events
    // event InvoiceStored(uint256 indexed id, address indexed seller, bytes32 hash, uint256 amount)
    invoiceContract.on("InvoiceStored", async (id, seller, hash, amount, event) => {
      
      try {        
        // Convert bytes32 hash to hex string
        const invoiceHash = hash;
        
        // Update database with blockchain event data
        await saveInvoiceEventToDatabase({
          invoiceId: id.toNumber(),
          invoiceHash: invoiceHash,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
        });
      } catch (dbError) {
        console.error("Failed to save invoice to database");
      }
      
    });

    // Handle provider errors
    provider.on("error", (error) => {
      console.error("Provider error:", error);
    });

    return { provider, invoiceContract };
  } catch (error) {
    console.error("Failed to initialize invoice blockchain listener:", error);
    throw error;
  }
}

/**
 * Stop listening for invoice events (cleanup function)
 * @param {ethers.Contract} invoiceContract - Contract instance
 */
export function stopInvoiceStoredListener(invoiceContract) {
  if (invoiceContract) {
    invoiceContract.removeAllListeners("InvoiceStored");
    console.log("InvoiceStored event listener stopped");
  }
}
