const { ethers } = require('ethers');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

async function startEventListener(io) {
    console.log("🚀 Initializing Event Listener...");
    
    try {
        // Load contract info
        const deploymentsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts', 'deployedContracts.json');
        console.log(`📂 Loading deployments from: ${deploymentsPath}`);
        const contracts = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
        
        const contractInfo = contracts.contracts.SupplyChainNFT;
        console.log(`📝 Contract info loaded for: ${contractInfo.address}`);

        const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
        console.log(`🌐 Using RPC URL: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        
        console.log(`🔨 Creating contract instance...`);
        const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, provider);

        console.log(`✅ EVENT LISTENER STARTED`);
        console.log(`📍 Contract Address: ${contractInfo.address}`);

        // Async network info (don't block start)
        provider.getNetwork().then(network => {
            console.log(`🌐 Network Verified: ${network.name} (ChainID: ${network.chainId})`);
        }).catch(err => {
            console.warn(`⚠️ Could not fetch network info immediately, but continuing...`);
        });
        
        if (contract.target === contractInfo.address) {
            console.log("🔗 Contract instance created successfully");
        }

        // ─────────────────────────────────────────────────────────
        // Handler: ProductMinted — SOURCE OF TRUTH for new products
        // ─────────────────────────────────────────────────────────
        contract.on("ProductMinted", async (tokenId, productId, batchNumber, manufacturer, timestamp, event) => {
            const txHash = event.log.transactionHash;
            const manufacturerAddr = manufacturer.toLowerCase();
            console.log(`🔔 EVENT CAUGHT: ProductMinted | TokenID: ${tokenId} | ProductID: ${productId} | Manufacturer: ${manufacturerAddr} | TxHash: ${txHash}`);

            try {
                // Duplicate protection
                const existing = await Product.findOne({ tokenId: Number(tokenId) });
                if (existing) {
                    const isDuplicate = existing.checkpoints.some(cp => cp.transactionHash === txHash);
                    if (isDuplicate) {
                        return console.log(`⏭️ Duplicate ProductMinted event skipped: ${txHash}`);
                    }
                }

                // Look up manufacturer User record to set manufacturer_id
                const mfgUser = await User.findOne({ walletAddress: manufacturerAddr });

                const productDoc = {
                    tokenId: Number(tokenId),
                    productId: productId,
                    name: productId, // Will be enriched by frontend POST if present
                    batchNumber: batchNumber,
                    currentStage: 'Manufactured',
                    status: 'Manufactured',
                    currentOwner: manufacturerAddr,
                    manufacturer: {
                        walletAddress: manufacturerAddr,
                        name: mfgUser?.name || '',
                        email: mfgUser?.email || '',
                    },
                    manufacturingDate: new Date(Number(timestamp) * 1000),
                    isActive: true,
                    transferStatus: 'none',
                };

                if (mfgUser) {
                    productDoc.manufacturer_id = mfgUser._id;
                }

                const savedProduct = await Product.findOneAndUpdate(
                    { tokenId: Number(tokenId) },
                    {
                        $set: productDoc,
                        $push: {
                            checkpoints: {
                                timestamp: new Date(Number(timestamp) * 1000),
                                location: {},
                                stage: 'Manufactured',
                                handler: manufacturerAddr,
                                handlerName: mfgUser?.name || '',
                                handlerEmail: mfgUser?.email || '',
                                notes: 'Product manufactured and minted on blockchain',
                                transactionHash: txHash,
                            }
                        }
                    },
                    { upsert: true, new: true }
                );

                console.log(`✅ MongoDB Upserted: ProductMinted TokenID ${tokenId} -> Owner: ${manufacturerAddr}`);

                if (io) {
                    io.emit("productMinted", {
                        tokenId: Number(tokenId),
                        productId,
                        manufacturer: manufacturerAddr,
                        txHash
                    });
                }
            } catch (err) {
                console.error(`❌ Error in ProductMinted handler:`, err);
            }
        });

        // Handler for TransferredToDistributor
        contract.on("TransferredToDistributor", async (tokenId, distributor, event) => {
            const txHash = event.log.transactionHash;
            console.log(`🔔 EVENT CAUGHT: TransferredToDistributor | TokenID: ${tokenId} | Distributor: ${distributor} | TxHash: ${txHash}`);
            
            try {
                const product = await Product.findOne({ tokenId: Number(tokenId) });
                if (!product) return console.log(`❌ Product not found for TokenID: ${tokenId}`);

                // Duplicate Protection: Check transaction index/hash in checkpoints
                const isDuplicate = product.checkpoints.some(cp => cp.transactionHash === txHash);
                if (isDuplicate) {
                    return console.log(`⏭️ Duplicate event skipped: ${txHash}`);
                }

                const distAddr = distributor.toLowerCase();
                const distUser = await User.findOne({ walletAddress: distAddr });

                product.currentOwner = distAddr;
                product.status = "IN_TRANSIT";
                product.currentStage = "InDistribution";
                if (distUser) product.distributor_id = distUser._id;
                
                // Add checkpoint
                product.checkpoints.push({
                    timestamp: new Date(),
                    location: { address: "In Transit" },
                    stage: "InDistribution",
                    handler: distAddr,
                    handlerName: distUser?.name || '',
                    transactionHash: txHash,
                    notes: "Transferred to Distributor"
                });

                await product.save();
                console.log(`✅ MongoDB Updated: TokenID ${tokenId} -> IN_TRANSIT | Owner: ${distAddr}`);
                
                if (io) io.emit("productUpdate", { tokenId: Number(tokenId), status: "IN_TRANSIT" });
            } catch (err) {
                console.error(`❌ Error in TransferredToDistributor handler:`, err);
            }
        });

        // Handler for TransferredToRetailer
        contract.on("TransferredToRetailer", async (tokenId, retailer, event) => {
            const txHash = event.log.transactionHash;
            console.log(`🔔 EVENT CAUGHT: TransferredToRetailer | TokenID: ${tokenId} | Retailer: ${retailer} | TxHash: ${txHash}`);
            
            try {
                const product = await Product.findOne({ tokenId: Number(tokenId) });
                if (!product) return console.log(`❌ Product not found for TokenID: ${tokenId}`);

                const isDuplicate = product.checkpoints.some(cp => cp.transactionHash === txHash);
                if (isDuplicate) {
                    return console.log(`⏭️ Duplicate event skipped: ${txHash}`);
                }

                const retailAddr = retailer.toLowerCase();
                const retailUser = await User.findOne({ walletAddress: retailAddr });

                product.currentOwner = retailAddr;
                product.status = "DELIVERED";
                product.currentStage = "InRetail";
                if (retailUser) product.retailer_id = retailUser._id;

                product.checkpoints.push({
                    timestamp: new Date(),
                    location: { address: "Retail Store" },
                    stage: "InRetail",
                    handler: retailAddr,
                    handlerName: retailUser?.name || '',
                    transactionHash: txHash,
                    notes: "Transferred to Retailer"
                });

                await product.save();
                console.log(`✅ MongoDB Updated: TokenID ${tokenId} -> DELIVERED | Owner: ${retailAddr}`);
                
                if (io) io.emit("productUpdate", { tokenId: Number(tokenId), status: "DELIVERED" });
            } catch (err) {
                console.error(`❌ Error in TransferredToRetailer handler:`, err);
            }
        });

        // Handler for ProductSold
        contract.on("ProductSold", async (tokenId, event) => {
            const txHash = event.log.transactionHash;
            console.log(`🔔 EVENT CAUGHT: ProductSold | TokenID: ${tokenId} | TxHash: ${txHash}`);
            
            try {
                const product = await Product.findOne({ tokenId: Number(tokenId) });
                if (!product) return console.log(`❌ Product not found for TokenID: ${tokenId}`);

                const isDuplicate = product.checkpoints.some(cp => cp.transactionHash === txHash);
                if (isDuplicate) {
                    return console.log(`⏭️ Duplicate event skipped: ${txHash}`);
                }

                product.status = "SOLD";
                product.currentStage = "Sold";

                product.checkpoints.push({
                    timestamp: new Date(),
                    location: { address: "Customer" },
                    stage: "Sold",
                    transactionHash: txHash,
                    notes: "Product Sold"
                });

                await product.save();
                console.log(`✅ MongoDB Updated: TokenID ${tokenId} -> SOLD`);
                
                if (io) io.emit("productUpdate", { tokenId: Number(tokenId), status: "SOLD" });
            } catch (err) {
                console.error(`❌ Error in ProductSold handler:`, err);
            }
        });

    } catch (error) {
        console.error("❌ Failed to start listener:", error);
    }
}

module.exports = { startEventListener };
