import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VATControl", (m) => {
    const paymentRegistryAddress = m.getParameter("paymentRegistryAddress");
    const invoiceValidationAddress = m.getParameter("invoiceValidationAddress");
    const vatControl = m.contract("vatControl", [paymentRegistryAddress, invoiceValidationAddress]);

    // m.call(registry, "launch", []);
    return { vatControl };
});
