const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function runTest() {
    console.log("🚀 Starting Post-Deploy Verification Test (TokenID 2)...");
    
    try {
        const deploymentsPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'deployedContracts.json');
        const contracts = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
        const contractInfo = contracts.contracts.SupplyChainNFT;
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL, undefined, { staticNetwork: true });
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, wallet);

        const dummyDistributor = "0x2222222222222222222222222222222222222222";
        
        console.log(`\n📦 Minting NEW product...`);
        const testId = `TEST-SYNC-${Math.floor(Math.random() * 10000)}`;
        const batch = `B-${Math.floor(Math.random() * 1000)}`;
        const uri = "ipfs://test-sync-metadata";
        const note = "Automated sync test mint";

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
