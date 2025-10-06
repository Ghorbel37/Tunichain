import hre from "hardhat";

async function main() {
    const connection = await hre.network.connect();
    // const { apollo } = await connection.ignition.deploy(ApolloModule);
    const { ethers, network } = hre;
    const deployer = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    console.log("Deploying contracts with account:", deployer);
    console.log("Network:", network.name);

    // 1) Deploy Registry (constructor requires admin address)
    const Registry = await ethers.getContractFactory("Registry");
    const adminAddress = deployer;
    const registry = await Registry.deploy(adminAddress);
    await registry.deployed();
    console.log("Registry deployed to:", registry.address);

    // 2) Deploy InvoiceValidation (requires registry address)
    const InvoiceValidation = await ethers.getContractFactory("InvoiceValidation");
    const invoiceValidation = await InvoiceValidation.deploy(registry.address);
    await invoiceValidation.deployed();
    console.log("InvoiceValidation deployed to:", invoiceValidation.address);

    // 3) Deploy PaymentRegistry (requires registry and invoiceValidation addresses)
    const PaymentRegistry = await ethers.getContractFactory("PaymentRegistry");
    const paymentRegistry = await PaymentRegistry.deploy(registry.address, invoiceValidation.address);
    await paymentRegistry.deployed();
    console.log("PaymentRegistry deployed to:", paymentRegistry.address);

    // 4) Deploy VATControl (requires invoiceValidation and paymentRegistry addresses)
    const VATControl = await ethers.getContractFactory("VATControl");
    const vatControl = await VATControl.deploy(invoiceValidation.address, paymentRegistry.address);
    await vatControl.deployed();
    console.log("VATControl deployed to:", vatControl.address);

    // Optional: you may want to grant roles or register contracts in the Registry here
    // e.g. await registry.addSeller(...)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });