import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaymentRegistry", (m) => {
    const registryAddress = m.getParameter("registryAddress");
    const invoiceValidationAddress = m.getParameter("invoiceValidationAddress");
    const paymentRegistry = m.contract("PaymentRegistry", [registryAddress, invoiceValidationAddress]);

    // m.call(registry, "launch", []);
    return { paymentRegistry };
});
