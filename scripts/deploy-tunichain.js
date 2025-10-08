import hre from "hardhat";

import Registry from "../ignition/modules/Registry.js";
import InvoiceValidation from "../ignition/modules/InvoiceValidation.js";
import PaymentRegistry from "../ignition/modules/PaymentRegistry.js";
import VATControl from "../ignition/modules/VATControl.js";

import fs from "fs";
import path from "path";


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

    // 5) Add addresses to .env files
    // Helper to update .env file with contract addresses, preserving comments/formatting
    function updateEnvFile(envPath, addressVars) {
        let lines = [];
        let foundVars = {};
        if (fs.existsSync(envPath)) {
            lines = fs.readFileSync(envPath, "utf-8").split("\n");
            lines = lines.map(line => {
                const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
                if (match && addressVars.hasOwnProperty(match[1])) {
                    foundVars[match[1]] = true;
                    return `${match[1]}=${addressVars[match[1]]}`;
                }
                return line;
            });
        }
        // Add any missing address variables at the end
        Object.entries(addressVars).forEach(([key, value]) => {
            if (!foundVars[key]) {
                lines.push(`${key}=${value}`);
            }
        });
        // Remove trailing blank lines, then add one
        while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
        lines.push("");
        fs.writeFileSync(envPath, lines.join("\n"), { encoding: "utf-8" });
    }

    const addressVars = {
        REGISTRY_ADDRESS: registry.address,
        INVOICE_VALIDATION_ADDRESS: invoiceValidation.address,
        PAYMENT_REGISTRY_ADDRESS: paymentRegistry.address,
        VAT_CONTROL_ADDRESS: vatControl.address
    };

    // Update .env in hardhat folder
    const hardhatEnvPath = path.resolve("./.env");
    updateEnvFile(hardhatEnvPath, addressVars);
    console.log(`\nContract addresses updated in hardhat/.env.`);

    // Update .env in backend folder
    const backendEnvPath = path.resolve("../backend/.env");
    if (fs.existsSync(path.dirname(backendEnvPath))) {
        updateEnvFile(backendEnvPath, addressVars);
        console.log(`Contract addresses updated in backend/.env.`);
    } else {
        console.warn(`backend/.env not updated: backend folder not found.`);
    }
}

main().catch(console.error);
// npx hardhat run scripts/deploy-tunichain.js --network localhost