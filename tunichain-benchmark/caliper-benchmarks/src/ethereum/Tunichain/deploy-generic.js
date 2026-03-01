const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Configuration - Defaults to user provided values for Besu
    const providerUrl = process.env.PROVIDER_URL || "http://localhost:8545";
    const privateKey = process.env.PRIVATE_KEY || "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";

    console.log(`Connecting to ${providerUrl}...`);

    let provider;
    if (providerUrl.startsWith("ws")) {
        provider = new ethers.WebSocketProvider(providerUrl);
    } else {
        provider = new ethers.JsonRpcProvider(providerUrl);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Deploying from account: ${wallet.address}`);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    // Load artifacts
    const loadArtifact = (name) => {
        const artifactPath = path.resolve(__dirname, `${name}.json`);
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact not found: ${artifactPath}`);
        }
        return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    };

    // Use the names provided by the user (or fallback to defaults)
    const RegistryArtifact = loadArtifact("RegistryArtifact");
    const InvoiceValidationArtifact = loadArtifact("InvoiceValidationArtifact");
    const PaymentRegistryArtifact = loadArtifact("PaymentRegistryArtifact");
    const VATControlArtifact = loadArtifact("VATControlArtifact");

    const deployOptions = {
        gasLimit: 5000000 // Fixed gas limit to bypass eth_estimateGas issues on some Besu versions
    };

    // 1. Deploy Registry
    console.log("\nDeploying Registry...");
    const RegistryFactory = new ethers.ContractFactory(RegistryArtifact.abi, RegistryArtifact.bytecode, wallet);
    const registry = await RegistryFactory.deploy(wallet.address, deployOptions);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`Registry deployed to: ${registryAddress}`);

    // 2. Deploy InvoiceValidation
    console.log("\nDeploying InvoiceValidation...");
    const InvoiceValidationFactory = new ethers.ContractFactory(InvoiceValidationArtifact.abi, InvoiceValidationArtifact.bytecode, wallet);
    const invoiceValidation = await InvoiceValidationFactory.deploy(registryAddress, deployOptions);
    await invoiceValidation.waitForDeployment();
    const invoiceValidationAddress = await invoiceValidation.getAddress();
    console.log(`InvoiceValidation deployed to: ${invoiceValidationAddress}`);

    // 3. Deploy PaymentRegistry
    console.log("\nDeploying PaymentRegistry...");
    const PaymentRegistryFactory = new ethers.ContractFactory(PaymentRegistryArtifact.abi, PaymentRegistryArtifact.bytecode, wallet);
    const paymentRegistry = await PaymentRegistryFactory.deploy(registryAddress, invoiceValidationAddress, deployOptions);
    await paymentRegistry.waitForDeployment();
    const paymentRegistryAddress = await paymentRegistry.getAddress();
    console.log(`PaymentRegistry deployed to: ${paymentRegistryAddress}`);

    // 4. Deploy VATControl
    console.log("\nDeploying VATControl...");
    const VATControlFactory = new ethers.ContractFactory(VATControlArtifact.abi, VATControlArtifact.bytecode, wallet);
    const vatControl = await VATControlFactory.deploy(invoiceValidationAddress, paymentRegistryAddress, deployOptions);
    await vatControl.waitForDeployment();
    const vatControlAddress = await vatControl.getAddress();
    console.log(`VATControl deployed to: ${vatControlAddress}`);

    // 5. Wire up VATControl
    console.log("\nWiring up VATControl...");

    console.log("Setting VATControl on InvoiceValidation...");
    const tx1 = await invoiceValidation.setVATControl(vatControlAddress);
    await tx1.wait();
    console.log("InvoiceValidation.setVATControl() complete");

    console.log("Setting VATControl on PaymentRegistry...");
    const tx2 = await paymentRegistry.setVATControl(vatControlAddress);
    await tx2.wait();
    console.log("PaymentRegistry.setVATControl() complete");

    console.log("\nDeployment Complete!");
    console.log("----------------------------------------------------");
    console.log(`Registry:          ${registryAddress}`);
    console.log(`InvoiceValidation: ${invoiceValidationAddress}`);
    console.log(`PaymentRegistry:   ${paymentRegistryAddress}`);
    console.log(`VATControl:        ${vatControlAddress}`);
    console.log("----------------------------------------------------");
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

// Requires ethers@6
// node src/ethereum/Tunichain/deploy-generic.js
