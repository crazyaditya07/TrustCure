const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Event = require('../models/Event');
const User = require('../models/User');
const Transfer = require('../models/Transfer');

// Stage mapping from contract enum
const stageMap = {
    0: 'Created',
    1: 'Manufactured',
    2: 'InDistribution',
    3: 'InRetail',
    4: 'Sold'
};

class EventListener {
    constructor() {
        this.provider = null;
        this.supplyChainContract = null;
        this.accessManagerContract = null;
        this.io = null;
        this.isListening = false;
        this.lastProcessedBlock = 0;
        this.pollingInterval = null;
        this.POLL_TIME = 15000; // 15 seconds
    }

    async initialize() {
        try {
            // Load deployment info
            const deploymentsPath = path.join(__dirname, '..', '..', 'deployments');
            if (!fs.existsSync(deploymentsPath)) {
                console.log('⚠️ Deployments directory not found.');
                return false;
            }
            const files = fs.readdirSync(deploymentsPath);

            if (files.length === 0) {
                console.log('⚠️ No deployments found. Event listener not started.');
                return false;
            }

            // Get the most recent deployment
            const deploymentFile = files[files.length - 1];
            const deployment = JSON.parse(
                fs.readFileSync(path.join(deploymentsPath, deploymentFile))
            );

            // Load contract ABIs
            const frontendContractsPath = path.join(
                __dirname, '..', '..', 'frontend', 'src', 'contracts', 'deployedContracts.json'
            );

            if (!fs.existsSync(frontendContractsPath)) {
                console.log('⚠️ Contract ABIs not found. Run deployment first.');
                return false;
            }

            const contracts = JSON.parse(fs.readFileSync(frontendContractsPath));

            // Setup provider based on network
            const rpcUrl = deployment.network === 'sepolia'
                ? (process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
                : 'http://127.0.0.1:8545';

            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // Get current block to start polling from
            this.lastProcessedBlock = await this.provider.getBlockNumber();

            // Initialize contracts
            this.supplyChainContract = new ethers.Contract(
                contracts.contracts.SupplyChainNFT.address,
                contracts.contracts.SupplyChainNFT.abi,
                this.provider
            );

            this.accessManagerContract = new ethers.Contract(
                contracts.contracts.AccessManager.address,
                contracts.contracts.AccessManager.abi,
                this.provider
            );

            console.log(`✅ Event listener initialized at block ${this.lastProcessedBlock}`);
            console.log('📍 SupplyChainNFT:', contracts.contracts.SupplyChainNFT.address);
            console.log('📍 AccessManager:', contracts.contracts.AccessManager.address);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize event listener:', error.message);
            return false;
        }
    }

    async startListening(io) {
        this.io = io;

        const initialized = await this.initialize();
        if (!initialized) {
            console.log('⚠️ Event listener not active - waiting for deployment');
            return;
        }

        if (this.isListening) {
            console.log('⚠️ Event listener already running');
            return;
        }

        this.isListening = true;
        console.log(`🎧 Starting blockchain event polling (Interval: ${this.POLL_TIME/1000}s)...`);

        // Start polling loop
        this.pollingInterval = setInterval(() => this.poll(), this.POLL_TIME);
        
        // Initial run
        this.poll();
    }

    async poll() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            
            if (currentBlock <= this.lastProcessedBlock) return;

            const fromBlock = this.lastProcessedBlock + 1;
            const toBlock = currentBlock;

            console.log(`🔍 Polling events from block ${fromBlock} to ${toBlock}...`);

            // 1. SupplyChainNFT Events
            const mintEvents = await this.supplyChainContract.queryFilter('ProductMinted', fromBlock, toBlock);
            for (const event of mintEvents) {
                const { tokenId, productId, batchNumber, manufacturer, timestamp } = event.args;
                await this.handleProductMinted(tokenId, productId, batchNumber, manufacturer, timestamp, event);
            }

            const checkpointEvents = await this.supplyChainContract.queryFilter('CheckpointAdded', fromBlock, toBlock);
            for (const event of checkpointEvents) {
                const { tokenId, stage, location, handler, timestamp } = event.args;
                await this.handleCheckpointAdded(tokenId, stage, location, handler, timestamp, event);
            }

            const transferEvents = await this.supplyChainContract.queryFilter('ProductTransferred', fromBlock, toBlock);
            for (const event of transferEvents) {
                const { tokenId, from, to, newStage, timestamp } = event.args;
                await this.handleLifecycleTransition(tokenId, from, to, newStage, timestamp, event);
            }

            const roleEvents = await this.supplyChainContract.queryFilter('RoleGrantedToUser', fromBlock, toBlock);
            for (const event of roleEvents) {
                const { role, account, sender } = event.args;
                await this.handleRoleGranted(role, account, sender, event);
            }

            // 2. AccessManager Events
            const regEvents = await this.accessManagerContract.queryFilter('ParticipantRegistered', fromBlock, toBlock);
            for (const event of regEvents) {
                const { wallet, name, role, timestamp } = event.args;
                await this.handleParticipantRegistered(wallet, name, role, timestamp, event);
            }

            this.lastProcessedBlock = toBlock;

        } catch (error) {
            console.error('❌ Polling error:', error.message);
        }
    }

    async handleProductMinted(tokenId, productId, batchNumber, manufacturer, timestamp, event) {
        try {
            const txReceipt = await event.getTransactionReceipt();
            const block = await event.getBlock();

            // Create event record
            const eventRecord = new Event({
                eventType: 'ProductMinted',
                productId,
                tokenId: Number(tokenId),
                to: manufacturer.toLowerCase(),
                stage: 'Manufactured',
                timestamp: new Date(Number(timestamp) * 1000),
                blockNumber: block.number,
                transactionHash: txReceipt.hash,
                logIndex: event.index,
                contractAddress: this.supplyChainContract.target
            });

            await eventRecord.save();

            // Get product details from contract
            const product = await this.supplyChainContract.getProduct(tokenId);

            // Create/update product in MongoDB
            const productRecord = await Product.findOneAndUpdate(
                { productId },
                {
                    productId,
                    tokenId: Number(tokenId),
                    name: productId, // Can be updated with metadata
                    batchNumber,
                    currentStage: 'Manufactured',
                    currentOwner: manufacturer.toLowerCase(),
                    manufacturer: {
                        walletAddress: manufacturer.toLowerCase(),
                        location: product.manufacturingLocation
                    },
                    manufacturingDate: new Date(Number(timestamp) * 1000),
                    manufacturingLocation: {
                        address: product.manufacturingLocation
                    },
                    checkpoints: [{
                        timestamp: new Date(Number(timestamp) * 1000),
                        location: { address: product.manufacturingLocation },
                        stage: 'Manufactured',
                        handler: manufacturer.toLowerCase(),
                        transactionHash: txReceipt.hash,
                        blockNumber: block.number
                    }]
                },
                { upsert: true, new: true }
            );

            // Emit WebSocket notification
            this.emitNotification('productMinted', {
                tokenId: Number(tokenId),
                productId,
                manufacturer: manufacturer.toLowerCase()
            }, [manufacturer.toLowerCase()]);

        } catch (error) {
            console.error('Error handling ProductMinted:', error);
        }
    }

    async handleCheckpointAdded(tokenId, stage, location, handler, timestamp, event) {
        try {
            const txReceipt = await event.getTransactionReceipt();
            const block = await event.getBlock();
            const stageName = stageMap[Number(stage)];

            // Get product ID from tokenId
            const product = await this.supplyChainContract.getProduct(tokenId);

            // Create event record
            const eventRecord = new Event({
                eventType: 'CheckpointAdded',
                productId: product.productId,
                tokenId: Number(tokenId),
                to: handler.toLowerCase(),
                stage: stageName,
                location,
                timestamp: new Date(Number(timestamp) * 1000),
                blockNumber: block.number,
                transactionHash: txReceipt.hash,
                logIndex: event.index,
                contractAddress: this.supplyChainContract.target
            });

            await eventRecord.save();

            // Update product checkpoints
            await Product.findOneAndUpdate(
                { tokenId: Number(tokenId) },
                {
                    $push: {
                        checkpoints: {
                            timestamp: new Date(Number(timestamp) * 1000),
                            location: { address: location },
                            stage: stageName,
                            handler: handler.toLowerCase(),
                            transactionHash: txReceipt.hash,
                            blockNumber: block.number
                        }
                    },
                    currentStage: stageName
                }
            );

            // Emit WebSocket notification
            this.emitNotification('checkpointAdded', {
                tokenId: Number(tokenId),
                productId: product.productId,
                stage: stageName,
                location
            }, [handler.toLowerCase()]);

        } catch (error) {
            console.error('Error handling CheckpointAdded:', error);
        }
    }

    async handleLifecycleTransition(tokenId, from, to, stage, timestamp, event) {
        try {
            const txReceipt = await event.getTransactionReceipt();
            const block = await event.getBlock();
            const stageName = stageMap[Number(stage)];

            // Get product ID from tokenId
            const product = await this.supplyChainContract.getProduct(tokenId);

            // 1. Create event record
            const eventRecord = new Event({
                eventType: 'ProductTransferred',
                productId: product.productId,
                tokenId: Number(tokenId),
                from: from.toLowerCase(),
                to: to.toLowerCase(),
                stage: stageName,
                timestamp: new Date(Number(timestamp) * 1000),
                blockNumber: block.number,
                transactionHash: txReceipt.hash,
                logIndex: event.index,
                contractAddress: this.supplyChainContract.target
            });

            await eventRecord.save();

            // 2. Reconcile Transfer model
            const transfer = await Transfer.findOne({
                tokenId: Number(tokenId),
                fromWallet: from.toLowerCase(),
                toWallet: to.toLowerCase(),
                status: { $in: ['onchain_processing', 'confirmed', 'pending'] }
            });

            if (transfer) {
                transfer.status = 'finalized';
                transfer.txHash = txReceipt.hash;
                transfer.finalizedAt = new Date();
                await transfer.save();
            }

            // 3. Update Product owner and status
            await Product.findOneAndUpdate(
                { tokenId: Number(tokenId) },
                {
                    currentOwner: to.toLowerCase(),
                    currentStage: stageName,
                    transferStatus: 'none',
                    pendingTransferId: null
                }
            );

            // Emit WebSocket notifications to both parties
            this.emitNotification('productTransferred', {
                tokenId: Number(tokenId),
                productId: product.productId,
                from: from.toLowerCase(),
                to: to.toLowerCase(),
                stage: stageName,
                status: 'finalized',
                txHash: txReceipt.hash
            }, [from.toLowerCase(), to.toLowerCase()]);

        } catch (error) {
            console.error('Error handling LifecycleTransition:', error);
        }
    }

    async handleRoleGranted(role, account, sender, event) {
        try {
            const txReceipt = await event.getTransactionReceipt();
            const block = await event.getBlock();

            // Map role hash to name
            const roleNames = {
                [ethers.keccak256(ethers.toUtf8Bytes('MANUFACTURER_ROLE'))]: 'MANUFACTURER',
                [ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUTOR_ROLE'))]: 'DISTRIBUTOR',
                [ethers.keccak256(ethers.toUtf8Bytes('RETAILER_ROLE'))]: 'RETAILER',
                [ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))]: 'ADMIN'
            };

            const roleName = roleNames[role] || 'UNKNOWN';

            // Create event record
            const eventRecord = new Event({
                eventType: 'RoleGrantedToUser',
                to: account.toLowerCase(),
                from: sender.toLowerCase(),
                timestamp: new Date(),
                blockNumber: block.number,
                transactionHash: txReceipt.hash,
                logIndex: event.index,
                contractAddress: this.supplyChainContract.target,
                rawData: { role: roleName }
            });

            await eventRecord.save();

            // Update user role in MongoDB
            await User.findOneAndUpdate(
                { walletAddress: account.toLowerCase() },
                {
                    role: roleName,
                    isVerified: true
                },
                { upsert: true }
            );

            // Emit WebSocket notification
            this.emitNotification('roleGranted', {
                account: account.toLowerCase(),
                role: roleName
            }, [account.toLowerCase()]);

        } catch (error) {
            console.error('Error handling RoleGranted:', error);
        }
    }

    async handleParticipantRegistered(wallet, name, role, timestamp, event) {
        try {
            const txReceipt = await event.getTransactionReceipt();
            const block = await event.getBlock();

            // Map role hash to name
            const roleNames = {
                [ethers.keccak256(ethers.toUtf8Bytes('MANUFACTURER_ROLE'))]: 'MANUFACTURER',
                [ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUTOR_ROLE'))]: 'DISTRIBUTOR',
                [ethers.keccak256(ethers.toUtf8Bytes('RETAILER_ROLE'))]: 'RETAILER',
                [ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))]: 'ADMIN'
            };

            const roleName = roleNames[role] || 'CONSUMER';

            // Create event record
            const eventRecord = new Event({
                eventType: 'ParticipantRegistered',
                to: wallet.toLowerCase(),
                timestamp: new Date(Number(timestamp) * 1000),
                blockNumber: block.number,
                transactionHash: txReceipt.hash,
                logIndex: event.index,
                contractAddress: this.accessManagerContract.target,
                rawData: { name, role: roleName }
            });

            await eventRecord.save();

            // Create/update user in MongoDB
            await User.findOneAndUpdate(
                { walletAddress: wallet.toLowerCase() },
                {
                    walletAddress: wallet.toLowerCase(),
                    name,
                    role: roleName,
                    isVerified: true,
                    registeredAt: new Date(Number(timestamp) * 1000)
                },
                { upsert: true }
            );

            console.log(`✅ Registered participant: ${name} (${roleName})`);

        } catch (error) {
            console.error('Error handling ParticipantRegistered:', error);
        }
    }

    emitNotification(eventType, data, recipients) {
        if (!this.io) return;

        // Emit to specific recipients
        recipients.forEach(recipient => {
            this.io.to(recipient).emit('notification', {
                type: eventType,
                data,
                timestamp: new Date().toISOString()
            });
        });

        // Also emit to product room if applicable
        if (data.productId) {
            this.io.to(`product:${data.productId}`).emit('productUpdate', {
                type: eventType,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }

    stopListening() {
        if (this.supplyChainContract) {
            this.supplyChainContract.removeAllListeners();
        }
        if (this.accessManagerContract) {
            this.accessManagerContract.removeAllListeners();
        }
        this.isListening = false;
        console.log('🛑 Event listeners stopped');
    }
}

module.exports = new EventListener();
