import hre from "hardhat";

import Registry from "../ignition/modules/Registry.js";
import InvoiceValidation from "../ignition/modules/InvoiceValidation.js";
import PaymentRegistry from "../ignition/modules/PaymentRegistry.js";
import VATControl from "../ignition/modules/VATControl.js";


async function main() {
    // Get the network connection from Hardhat Runtime Environment
    const connection = await hre.network.connect();

    // 1) Deploy Registry (constructor requires admin address)
    const adminAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const { registry } = await connection.ignition.deploy(Registry, {
        parameters: { Registry: { adminAddress } },
    });
    console.log(`Registry deployed to: ${registry.address}`);

    // 2) Deploy InvoiceValidation (constructor requires registry address)
    const registryAddress = registry.address;
    const { invoiceValidation } = await connection.ignition.deploy(InvoiceValidation, {
        parameters: { InvoiceValidation: { registryAddress } },
    });
    console.log(`InvoiceValidation deployed to: ${invoiceValidation.address}`);

    // 3) Deploy PaymentRegistry (constructor requires registry and invoiceValidation addresses)
    const invoiceValidationAddress = invoiceValidation.address;
    const { paymentRegistry } = await connection.ignition.deploy(PaymentRegistry, {
        parameters: { PaymentRegistry: { registryAddress, invoiceValidationAddress } },
    });
    console.log(`PaymentRegistry deployed to: ${paymentRegistry.address}`);

    // 4) Deploy VATControl (constructor requires paymentRegistry and invoiceValidation addresses)
    const paymentRegistryAddress = paymentRegistry.address;
    const { vatControl } = await connection.ignition.deploy(VATControl, {
        parameters: { VATControl: { paymentRegistryAddress, invoiceValidationAddress } },
    });
    console.log(`VATControl deployed to: ${vatControl.address}`);
}

main().catch(console.error);
// npx hardhat run scripts/deploy-tunichain.js --network localhost