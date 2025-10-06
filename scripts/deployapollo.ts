import hre from "hardhat";
import ApolloModule from "../ignition/modules/Apollo.js";

async function getRocketNameFromAPI() {
    // Mock function to simulate an asynchronous API call
    return "Saturn VI";
}

async function main() {
    const rocketName = await getRocketNameFromAPI();

    const connection = await hre.network.connect();
    const { apollo } = await connection.ignition.deploy(ApolloModule, {
        parameters: { Apollo: { rocketName } },
    });

    console.log(`Apollo deployed to: ${apollo.address}`);
    console.log(` ${apollo.read}`);
}

main().catch(console.error);
