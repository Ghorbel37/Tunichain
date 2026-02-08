import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VATControl", (m) => {
    const paymentRegistryAddress = m.getParameter("paymentRegistryAddress");
    const invoiceValidationAddress = m.getParameter("invoiceValidationAddress");
    const vatControl = m.contract("contracts/VATControl.sol:VATControl", [invoiceValidationAddress, paymentRegistryAddress]);

    // m.call(registry, "launch", []);
    return { vatControl };
});
