const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x313E14f51FEe170D19C3DCE9eFb03709E916510d";
    const USER_ADDRESS = "0x3f127f2ffdfe92d2c5bdb075eb0b77682f7b858e";

    console.log(`Connecting to contract at: ${CONTRACT_ADDRESS}`);
    const SupplyChainNFT = await hre.ethers.getContractFactory("SupplyChainNFT");
    const contract = SupplyChainNFT.attach(CONTRACT_ADDRESS);

    const MANUFACTURER_ROLE = hre.ethers.id("MANUFACTURER_ROLE");

    console.log(`Checking if ${USER_ADDRESS} has MANUFACTURER_ROLE...`);
    const hasRole = await contract.hasRole(MANUFACTURER_ROLE, USER_ADDRESS);
    
    if (hasRole) {
        console.log(`User already has the MANUFACTURER_ROLE. No action needed.`);
        return;
    }

    console.log(`Granting MANUFACTURER_ROLE to ${USER_ADDRESS}...`);
    const tx = await contract.grantRole(MANUFACTURER_ROLE, USER_ADDRESS);
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    
    console.log(`Waiting for confirmation...`);
    await tx.wait();
    console.log(`Role successfully granted!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error granting role:", error);
        process.exit(1);
    });
