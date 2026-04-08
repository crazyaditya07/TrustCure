const mongoose = require('mongoose');
const { ethers } = require('ethers');

require('dotenv').config({ path: __dirname + '/.env' }); // load .env if necessary

async function backfillEvents() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect('mongodb://localhost:27017/supplychain');
        const Product = require('./models/Product');
        const Event = require('./models/Event');
        
        console.log("Connecting to Web3 Provider...");
        const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });

        console.log("Fetching products...");
        const products = await Product.find({});
        console.log(`Found ${products.length} products to evaluate.`);

        let newEvents = 0;

        for (let p of products) {
            if (!p.checkpoints) continue;
            
            for (let cp of p.checkpoints) {
                if (!cp.transactionHash) continue;
                
                // Map Checkpoint stages to new eventTypes
                let eventType = 'ProductTransferred';
                if (cp.stage === 'Manufactured') eventType = 'ProductMinted';
                if (cp.stage === 'InDistribution') eventType = 'TransferredToDistributor';
                if (cp.stage === 'InRetail') eventType = 'TransferredToRetailer';
                if (cp.stage === 'Sold') eventType = 'ProductSold';

                // Skip if this event already exists
                const existing = await Event.findOne({ transactionHash: cp.transactionHash, eventType });
                if (existing) continue;

                console.log(`Processing missing event for Tx: ${cp.transactionHash} (Stage: ${cp.stage})`);
                
                let txFrom = '';

                // Identify sender by prior stage completion in MongoDB checkpoint history
                if (cp.stage === 'Manufactured') {
                    txFrom = p.manufacturer?.walletAddress?.toLowerCase();
                } else if (cp.stage === 'InDistribution') {
                    txFrom = p.manufacturer?.walletAddress?.toLowerCase();
                } else if (cp.stage === 'InRetail') {
                    // Attempt to find distributor handler
                    const prev = p.checkpoints.find(c => c.stage === 'InDistribution');
                    if (prev) txFrom = prev.handler.toLowerCase();
                } else if (cp.stage === 'Sold') {
                    const prev = p.checkpoints.find(c => c.stage === 'InRetail');
                    if (prev) txFrom = prev.handler.toLowerCase();
                }

                if (txFrom) {
                    await Event.create({
                        eventType,
                        transactionHash: cp.transactionHash,
                        from: txFrom.toLowerCase(),
                        to: cp.handler ? cp.handler.toLowerCase() : undefined,
                        productId: p.productId,
                        tokenId: p.tokenId,
                        timestamp: cp.timestamp || new Date(),
                        blockNumber: cp.blockNumber || 0
                    });
                    newEvents++;
                    console.log(`✅ Backfilled ${eventType} (Initiator: ${txFrom})`);
                } else {
                    console.log(`❌ Could not determine initiator for Tx: ${cp.transactionHash}`);
                }
            }
        }

        console.log(`\n🎉 Backfill complete! Created ${newEvents} historical events.`);
        process.exit(0);
    } catch (err) {
        console.error("Backfill failed:", err);
        process.exit(1);
    }
}

backfillEvents();
