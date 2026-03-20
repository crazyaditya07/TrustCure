const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function runTest() {
    console.log("🚀 Starting Post-Deploy Verification Test...");
    
    try {
        const deploymentsPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'deployedContracts.json');
        const contracts = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
        const contractInfo = contracts.contracts.SupplyChainNFT;
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL, undefined, { staticNetwork: true });
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, wallet);

        const DISTRIBUTOR_ROLE = ethers.id("DISTRIBUTOR_ROLE");
        const MANUFACTURER_ROLE = ethers.id("MANUFACTURER_ROLE");
        const dummyDistributor = "0x2222222222222222222222222222222222222222";
        
        console.log(`\n🛠️  Ensuring role assignments for test...`);
        try {
            // Grant MANUFACTURER_ROLE to deployer so they can mint
            const hasMan = await contract.hasRole(MANUFACTURER_ROLE, wallet.address);
            if (!hasMan) {
                console.log("🛠️  Granting MANUFACTURER_ROLE to deployer...");
                const txMan = await contract.grantRole(MANUFACTURER_ROLE, wallet.address);
                await txMan.wait();
                console.log("✅ MANUFACTURER_ROLE granted");
            } else {
                console.log("✅ MANUFACTURER_ROLE already held by deployer");
            }

            // Grant DISTRIBUTOR_ROLE to dummyDistributor
            const hasDist = await contract.hasRole(DISTRIBUTOR_ROLE, dummyDistributor);
            if (!hasDist) {
                console.log("🛠️  Granting DISTRIBUTOR_ROLE to recipient...");
                const tx1 = await contract.grantRole(DISTRIBUTOR_ROLE, dummyDistributor);
                await tx1.wait();
                console.log("✅ DISTRIBUTOR_ROLE granted");
            } else {
                console.log("✅ DISTRIBUTOR_ROLE already granted");
            }
        } catch (e) {
             console.log("ℹ️ Role management skipped/failed (possibly already set):", e.message);
        }

        console.log(`\n📦 Minting new product...`);
        const testId = `TEST-${Math.floor(Math.random() * 10000)}`;
        const batch = `B-${Math.floor(Math.random() * 1000)}`;
        const uri = "ipfs://test-metadata";
        const note = "Automated post-deploy test mint";

        const mintTx = await contract.mintProduct(
            testId,
            batch,
            uri,
            note
        );
        console.log(`⏳ Waiting for mint confirmation... (Tx: ${mintTx.hash})`);
        const mintReceipt = await mintTx.wait();
        console.log(`✅ Minted successfully!`);

        // Find the ProductMinted event to get the tokenId
        let tokenId;
        for (const log of mintReceipt.logs) {
            try {
                // If it's a known event from the interface
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === 'ProductMinted') {
                    tokenId = parsedLog.args.tokenId;
                    break;
                }
            } catch (e) {}
        }

        if (tokenId === undefined) {
             console.error("❌ Could not find TokenID in mint receipt logs.");
             return;
        }

        console.log(`🔖 New TokenID: ${tokenId}`);

        console.log(`\n🚚 Transferring TokenID ${tokenId} to Distributor...`);
        try {
            // Explicitly call the 2-arg version to avoid overload ambiguity
            const tx3 = await contract["transferToDistributor(uint256,address)"](tokenId, dummyDistributor);
            console.log(`⏳ Waiting for confirmation (Tx: ${tx3.hash})...`);
            await tx3.wait();
            console.log("✅ TransferredToDistributor Event Emitted on-chain!");
        } catch (e) {
            console.error("❌ Transfer to Distributor Failed:", e.message);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

runTest();
