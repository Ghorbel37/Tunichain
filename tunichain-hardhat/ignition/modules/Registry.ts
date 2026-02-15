import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Registry", (m) => {
    const adminAddress = m.getParameter("adminAddress");
    const registry = m.contract("Registry", [adminAddress]);

    // m.call(registry, "launch", []);
    return { registry };
});
