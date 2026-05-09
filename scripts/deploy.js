const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment to", hre.network.name);

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Deploy AccessManager
    console.log("\n📦 Deploying AccessManager...");
    const AccessManager = await hre.ethers.getContractFactory("AccessManager");
    const accessManager = await AccessManager.deploy();
    await accessManager.waitForDeployment();
    const accessManagerAddress = await accessManager.getAddress();
    console.log("✅ AccessManager deployed to:", accessManagerAddress);

    // Deploy SupplyChainNFT
    console.log("\n📦 Deploying SupplyChainNFT...");
    const SupplyChainNFT = await hre.ethers.getContractFactory("SupplyChainNFT");
    const supplyChainNFT = await SupplyChainNFT.deploy();
    await supplyChainNFT.waitForDeployment();
    const supplyChainNFTAddress = await supplyChainNFT.getAddress();
    console.log("✅ SupplyChainNFT deployed to:", supplyChainNFTAddress);

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId || 31337,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        contracts: {
            AccessManager: accessManagerAddress,
            SupplyChainNFT: supplyChainNFTAddress
        }
    };

    // Save to multiple locations for easy access
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to:", deploymentPath);

    // Also save to frontend for easy access
    const frontendDir = path.join(__dirname, "..", "frontend", "src", "contracts");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    // Copy ABIs to frontend
    const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");

    const supplyChainArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "TraceXNFT.sol", "SupplyChainNFT.json"))
    );
    const accessManagerArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "AccessManager.sol", "AccessManager.json"))
    );

    const frontendContracts = {
        chainId: deploymentInfo.chainId,
        network: hre.network.name,
        contracts: {
            SupplyChainNFT: {
                address: supplyChainNFTAddress,
                abi: supplyChainArtifact.abi
            },
            AccessManager: {
                address: accessManagerAddress,
                abi: accessManagerArtifact.abi
            }
        }
    };

    fs.writeFileSync(
        path.join(frontendDir, "deployedContracts.json"),
        JSON.stringify(frontendContracts, null, 2)
    );
    console.log("📄 Contract ABIs and addresses saved to frontend");

    // Verify contracts on Etherscan (if not localhost)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\n⏳ Waiting for block confirmations...");
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

        console.log("🔍 Verifying contracts on Etherscan...");

        try {
            await hre.run("verify:verify", {
                address: accessManagerAddress,
                constructorArguments: []
            });
            console.log("✅ AccessManager verified");
        } catch (error) {
            console.log("⚠️ AccessManager verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: supplyChainNFTAddress,
                constructorArguments: []
            });
            console.log("✅ SupplyChainNFT verified");
        } catch (error) {
            console.log("⚠️ SupplyChainNFT verification failed:", error.message);
        }
    }

    console.log("\n🎉 Deployment complete!");
    console.log("=====================================");
    console.log("AccessManager:", accessManagerAddress);
    console.log("SupplyChainNFT:", supplyChainNFTAddress);
    console.log("=====================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
