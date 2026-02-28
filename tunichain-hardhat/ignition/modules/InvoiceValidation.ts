import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("InvoiceValidation", (m) => {
    const registryAddress = m.getParameter("registryAddress");
    const invoiceValidation = m.contract("InvoiceValidation", [registryAddress]);

    // m.call(registry, "launch", []);
    return { invoiceValidation };
});
