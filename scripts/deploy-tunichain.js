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
    function updateEnvFile(envPath, addressVars, prefix = "") {
        let lines = [];
        let foundVars = {};
        if (fs.existsSync(envPath)) {
            lines = fs.readFileSync(envPath, "utf-8").split("\n");
            lines = lines.map(line => {
                const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
                if (match) {
                    const varName = match[1];
                    // Only match and replace variables with the prefix (if prefix is set)
                    if (prefix && varName.startsWith(prefix)) {
                        const key = varName.substring(prefix.length);
                        if (addressVars.hasOwnProperty(key)) {
                            foundVars[key] = true;
                            return `${varName}=${addressVars[key]}`;
                        }
                    } else if (!prefix && addressVars.hasOwnProperty(varName)) {
                        foundVars[varName] = true;
                        return `${varName}=${addressVars[varName]}`;
                    }
                }
                return line;
            });
        }
        // Add any missing address variables at the end
        Object.entries(addressVars).forEach(([key, value]) => {
            const prefixedKey = prefix + key;
            if (!foundVars[key]) {
                lines.push(`${prefixedKey}=${value}`);
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

        // Update .env in backend folder
    const frontendEnvPath = path.resolve("../mui-app/.env");
    if (fs.existsSync(path.dirname(frontendEnvPath))) {
        updateEnvFile(frontendEnvPath, addressVars, "VITE_");
        console.log(`Contract addresses updated in mui-app/.env.`);
    } else {
        console.warn(`mui-app/.env not updated: backend folder not found.`);
    }

    // 6) Copy ABIs to ../mui-app/src/abi
    const abiOutputDir = path.resolve("../mui-app/src/abi");
    if (!fs.existsSync(abiOutputDir)) {
        fs.mkdirSync(abiOutputDir, { recursive: true });
    }

    const contractsToCopy = [
        { name: "Registry", sol: "Registry.sol" },
        { name: "InvoiceValidation", sol: "InvoiceValidation.sol" },
        { name: "PaymentRegistry", sol: "PaymentRegistry.sol" },
        { name: "VATControl", sol: "VATControl.sol" },
    ];

    contractsToCopy.forEach(({ name, sol }) => {
        const artifactPath = path.resolve(`./artifacts/contracts/${sol}/${name}.json`);
        const destPath = path.join(abiOutputDir, `${name}.json`);
        if (fs.existsSync(artifactPath)) {
            fs.copyFileSync(artifactPath, destPath);
            // console.log(`ABI copied: ${destPath}`);
        } else {
            console.warn(`ABI not found for ${name}: ${artifactPath}`);
        }
    });
    console.log("All ABIs copied to ../mui-app/src/abi");
}

main().catch(console.error);
// npx hardhat run scripts/deploy-tunichain.js --network localhost