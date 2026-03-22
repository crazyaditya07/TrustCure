const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Event = require('../models/Event');
const Transfer = require('../models/Transfer');
const { ethers } = require('ethers');

// ============================================
// Authentication & Users
// ============================================

// Verify wallet signature
router.post('/auth/verify', async (req, res) => {
    try {
        const { walletAddress, message, signature } = req.body;

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Update last login
        await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            { lastLogin: new Date() }
        );

        res.json({
            verified: true,
            walletAddress: walletAddress.toLowerCase()
        });
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Get user profile
router.get('/users/:walletAddress', async (req, res) => {
    try {
        const user = await User.findOne({
            walletAddress: req.params.walletAddress.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Create or update user
router.post('/users', async (req, res) => {
    try {
        const { walletAddress, name, email, company, location, role, roles } = req.body;

        // Handle roles array
        let rolesArray = roles || ['CONSUMER'];
        if (role && !rolesArray.includes(role)) {
            // If single role is provided but not in array, add it
            rolesArray = [...rolesArray.filter(r => r !== 'CONSUMER'), role];
        }

        // Determine primary role (first non-CONSUMER role)
        const nonConsumerRoles = rolesArray.filter(r => r !== 'CONSUMER');
        const primaryRole = nonConsumerRoles.length > 0 ? nonConsumerRoles[0] : 'CONSUMER';

        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            {
                walletAddress: walletAddress.toLowerCase(),
                name,
                email,
                company,
                location,
                roles: rolesArray,
                role: primaryRole,
                registeredAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user role (admin only - validate on frontend)
router.patch('/users/:walletAddress/role', async (req, res) => {
    try {
        const { role, roles } = req.body;

        let updateData = {};

        if (roles) {
            // Handle roles array update
            let rolesArray = Array.isArray(roles) ? roles : [roles];
            const nonConsumerRoles = rolesArray.filter(r => r !== 'CONSUMER');
            const primaryRole = nonConsumerRoles.length > 0 ? nonConsumerRoles[0] : 'CONSUMER';
            updateData = { roles: rolesArray, role: primaryRole };
        } else if (role) {
            updateData = { role };
        } else {
            return res.status(400).json({ error: 'role or roles required' });
        }

        const user = await User.findOneAndUpdate(
            { walletAddress: req.params.walletAddress.toLowerCase() },
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Get all users by role
router.get('/users', async (req, res) => {
    try {
        const { role, limit = 100 } = req.query;
        const query = role ? { role } : {};

        const users = await User.find(query)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// ============================================
// Products
// ============================================

const enrichProducts = (products) => {
    return products.map(p => {
        const product = p.toObject ? p.toObject() : p;
        let ownerName = 'Unknown';
        if (product.currentStage === 'Manufactured' && product.manufacturer_id && product.manufacturer_id.name) {
            ownerName = product.manufacturer_id.name;
        } else if (product.currentStage === 'InDistribution' && product.distributor_id && product.distributor_id.name) {
            ownerName = product.distributor_id.name;
        } else if (product.currentStage === 'InRetail' && product.retailer_id && product.retailer_id.name) {
            ownerName = product.retailer_id.name;
        } else if (product.currentStage === 'Sold' && product.consumer_id && product.consumer_id.name) {
            ownerName = product.consumer_id.name;
        }
        product.currentOwnerName = ownerName;
        return product;
    });
};

// Get all products with optional filters
router.get('/products', async (req, res) => {
    try {
        const {
            stage,
            owner,
            manufacturer,
            batchNumber,
            limit = 50,
            offset = 0
        } = req.query;

        const query = { isActive: true };

        if (stage) query.currentStage = stage;
        if (owner) query.currentOwner = owner.toLowerCase();
        if (manufacturer) query['manufacturer.walletAddress'] = manufacturer.toLowerCase();
        if (batchNumber) query.batchNumber = batchNumber;

        const products = await Product.find(query)
            .populate('manufacturer_id distributor_id retailer_id consumer_id', 'name')
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.json({
            products: enrichProducts(products),
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Get single product by ID
router.get('/products/:productId', async (req, res) => {
    try {
        console.log("BACKEND: FETCHING PRODUCT WITH ID/TOKEN:", req.params.productId);
        const product = await Product.findOne({
            $or: [
                { productId: req.params.productId },
                { tokenId: parseInt(req.params.productId) || -1 }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Get product history with role-based visibility
router.get('/products/:productId/history', async (req, res) => {
    try {
        const { userRoles, userAddress } = req.query;
        console.log("BACKEND: FETCHING HISTORY FOR PRODUCT ID/TOKEN:", req.params.productId);

        // Parse comma-separated roles
        const rolesArray = userRoles ? userRoles.split(',') : ['CONSUMER'];

        const product = await Product.findOne({
            $or: [
                { productId: req.params.productId },
                { tokenId: parseInt(req.params.productId) || -1 }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const visibleHistory = product.getVisibleHistory(rolesArray, userAddress);

        res.json({
            productId: product.productId,
            tokenId: product.tokenId,
            name: product.name,
            currentStage: product.currentStage,
            checkpoints: visibleHistory
        });
    } catch (error) {
        console.error('Get product history error:', error);
        res.status(500).json({ error: 'Failed to get product history' });
    }
});

// Create or update product (fast-path sync from frontend after blockchain confirm)
// NOTE: Canonical creation happens through eventListener.js (ProductMinted event).
//       This POST enriches the record with UI-supplied fields (name, notes, etc.)
//       and backfills manufacturer_id if not already set by the event listener.
router.post('/products', async (req, res) => {
    try {
        const productData = req.body;
        console.log("BACKEND: RECEIVED PRODUCT DATA:", productData);
        
        // Ensure tokenId is present for on-chain products
        if (!productData.tokenId) {
            console.error("BACKEND ERROR: Missing tokenId in request");
            return res.status(400).json({ error: 'tokenId is required for product synchronization' });
        }

        // Auto-populate manufacturer_id from wallet lookup so enrichProducts() works
        if (productData.currentOwner && !productData.manufacturer_id) {
            const mfgUser = await User.findOne({ walletAddress: productData.currentOwner.toLowerCase() });
            if (mfgUser) {
                productData.manufacturer_id = mfgUser._id;
                // Enrich the manufacturer sub-document too if not already set
                if (!productData.manufacturer || !productData.manufacturer.name) {
                    productData.manufacturer = {
                        walletAddress: mfgUser.walletAddress,
                        name: mfgUser.name || '',
                        email: mfgUser.email || '',
                        location: mfgUser.location || ''
                    };
                }
            }
        }

        // Normalise currentOwner to lowercase
        if (productData.currentOwner) {
            productData.currentOwner = productData.currentOwner.toLowerCase();
        }

        const product = await Product.findOneAndUpdate(
            { tokenId: productData.tokenId }, // tokenId is canonical key
            { 
               ...productData,
               productId: productData.productId || `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            },
            { upsert: true, new: true }
        );
        console.log("BACKEND: SAVED/UPDATED PRODUCT:", product._id, "| Owner:", product.currentOwner);

        res.json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Add checkpoint to product
router.post('/products/:productId/checkpoints', async (req, res) => {
    try {
        const checkpoint = req.body;
        const product = await Product.findOne({ 
            $or: [
                { productId: req.params.productId },
                { tokenId: parseInt(req.params.productId) || -1 }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Enforce unique checkpoint if transactionHash is provided
        if (checkpoint.transactionHash) {
            const exists = product.checkpoints.some(cp => cp.transactionHash === checkpoint.transactionHash);
            if (exists) {
                return res.json(product); // Deduplicate
            }
        }

        await product.addCheckpoint(checkpoint);

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`product:${req.params.productId}`).emit('checkpointAdded', {
                productId: req.params.productId,
                checkpoint
            });
        }

        res.json(product);
    } catch (error) {
        console.error('Add checkpoint error:', error);
        res.status(500).json({ error: 'Failed to add checkpoint' });
    }
});

// Get products by explicit role-based ownership
router.get('/owner/:walletAddress/products', async (req, res) => {
    try {
        const searchedWallet = req.params.walletAddress.toLowerCase();
        console.log("BACKEND: SEARCHING PRODUCTS FOR WALLET:", searchedWallet);

        const user = await User.findOne({ walletAddress: searchedWallet });
        if (!user) {
            console.log("BACKEND: No user record found for wallet, returning empty products.");
            return res.json([]);
        }

        const wallet = user.walletAddress.toLowerCase();
        let query = { isActive: true };
        
        switch (user.role) {
            case 'MANUFACTURER':
                query.$or = [
                    { manufacturer_id: user._id },
                    { 'manufacturer.walletAddress': wallet }
                ];
                break;
            case 'DISTRIBUTOR':
                query.$or = [
                    { distributor_id: user._id },
                    { currentOwner: wallet }
                ];
                break;
            case 'RETAILER':
                query.$or = [
                    { retailer_id: user._id },
                    { currentOwner: wallet }
                ];
                break;
            case 'CONSUMER':
            default:
                query.$or = [
                    { consumer_id: user._id },
                    { currentOwner: wallet }
                ];
                break;
        }

        const products = await Product.find(query)
            .populate('manufacturer_id distributor_id retailer_id consumer_id', 'name')
            .sort({ createdAt: -1 });

        console.log("DB PRODUCTS FOUND:", products.length, "for wallet:", wallet);
        if (products.length > 0) {
            console.log("FIRST PRODUCT OWNER/MANUFACTURER:", 
                products[0].currentOwner, 
                products[0].manufacturer?.walletAddress
            );
        }

        res.json(enrichProducts(products));
    } catch (error) {
        console.error('Get explicit ownership products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// ============================================
// Events
// ============================================

// Get events with filters
router.get('/events', async (req, res) => {
    try {
        const {
            eventType,
            walletAddress,
            productId,
            fromBlock,
            toBlock,
            limit = 50
        } = req.query;

        const query = {};

        if (eventType) query.eventType = eventType;
        if (productId) query.productId = productId;
        if (walletAddress) {
            query.$or = [
                { from: walletAddress.toLowerCase() },
                { to: walletAddress.toLowerCase() }
            ];
        }
        if (fromBlock) query.blockNumber = { $gte: parseInt(fromBlock) };
        if (toBlock) {
            query.blockNumber = query.blockNumber || {};
            query.blockNumber.$lte = parseInt(toBlock);
        }

        const events = await Event.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// Get events for specific wallet
router.get('/events/wallet/:walletAddress', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const events = await Event.getEventsForWallet(
            req.params.walletAddress,
            parseInt(limit)
        );
        res.json(events);
    } catch (error) {
        console.error('Get wallet events error:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// Get events for specific product
router.get('/events/product/:productId', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const events = await Event.getEventsForProduct(
            req.params.productId,
            parseInt(limit)
        );
        res.json(events);
    } catch (error) {
        console.error('Get product events error:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// ============================================
// Statistics
// ============================================

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [
            totalProducts,
            totalUsers,
            productsByStage,
            recentEvents
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: true }),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$currentStage', count: { $sum: 1 } } }
            ]),
            Event.getRecentEvents(10)
        ]);

        res.json({
            totalProducts,
            totalUsers,
            productsByStage: productsByStage.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            recentEvents
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get statistics for specific user
router.get('/stats/:walletAddress', async (req, res) => {
    try {
        const walletAddress = req.params.walletAddress.toLowerCase();

        const [
            ownedProducts,
            productsManufactured,
            transfersIn,
            transfersOut
        ] = await Promise.all([
            Product.countDocuments({ currentOwner: walletAddress, isActive: true }),
            Product.countDocuments({ 'manufacturer.walletAddress': walletAddress }),
            Event.countDocuments({ to: walletAddress, eventType: 'ProductTransferred' }),
            Event.countDocuments({ from: walletAddress, eventType: 'ProductTransferred' })
        ]);

        res.json({
            ownedProducts,
            productsManufactured,
            transfersIn,
            transfersOut
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// ============================================
// Transfers
// ============================================

// Initiate transfer (Sender)
router.post('/transfers', async (req, res) => {
    try {
        const { productId, tokenId, fromWallet, toWallet, fromRole, toRole, currentStage, nextStage, signature } = req.body;

        // 1. Validate sender owns product
        const product = await Product.findOne({ tokenId });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.currentOwner.toLowerCase() !== fromWallet.toLowerCase()) {
            return res.status(403).json({ error: 'Not the current owner' });
        }

        // 2. Validate no active transfer exists
        if (product.transferStatus !== 'none') {
            return res.status(400).json({ error: 'Product already has an active transfer' });
        }

        // 3. Create Transfer record
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

        const transfer = new Transfer({
            productId,
            tokenId,
            fromWallet: fromWallet.toLowerCase(),
            toWallet: toWallet.toLowerCase(),
            fromRole,
            toRole,
            currentStage,
            nextStage,
            senderSignature: signature,
            expiresAt,
            status: 'pending'
        });

        await transfer.save();

        // 4. Update Product status
        product.transferStatus = 'pending';
        product.pendingTransferId = transfer._id;
        await product.save();

        // 5. Notify receiver (optional: via socket)
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${toWallet.toLowerCase()}`).emit('transferIncoming', transfer);
        }

        res.status(201).json(transfer);
    } catch (error) {
        console.error('Initiate transfer error:', error);
        res.status(500).json({ error: 'Failed to initiate transfer' });
    }
});

// Get incoming transfers
router.get('/transfers/incoming/:wallet', async (req, res) => {
    try {
        const transfers = await Transfer.find({
            toWallet: req.params.wallet.toLowerCase(),
            status: 'pending'
        }).sort({ createdAt: -1 });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get incoming transfers' });
    }
});

// Get outgoing transfers
router.get('/transfers/outgoing/:wallet', async (req, res) => {
    try {
        const transfers = await Transfer.find({
            fromWallet: req.params.wallet.toLowerCase(),
            status: { $in: ['pending', 'confirmed', 'onchain_processing', 'retrying', 'onchain_failed'] }
        }).sort({ createdAt: -1 });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get outgoing transfers' });
    }
});

// Receiver confirms receipt
router.patch('/transfers/:id/confirm', async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
        if (transfer.status !== 'pending') return res.status(400).json({ error: 'Transfer not in pending state' });

        transfer.status = 'confirmed';
        transfer.confirmedAt = new Date();
        await transfer.save();

        // Update Product
        await Product.findOneAndUpdate(
            { tokenId: transfer.tokenId },
            { transferStatus: 'confirmed' }
        );

        // Notify sender to execute on-chain tx
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${transfer.fromWallet.toLowerCase()}`).emit('transferConfirmed', transfer);
        }

        res.json(transfer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to confirm receipt' });
    }
});

// Receiver rejects transfer
router.patch('/transfers/:id/reject', async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
        
        transfer.status = 'rejected';
        await transfer.save();

        // Restore Product
        await Product.findOneAndUpdate(
            { tokenId: transfer.tokenId },
            { transferStatus: 'none', pendingTransferId: null }
        );

        // Notify sender
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${transfer.fromWallet.toLowerCase()}`).emit('transferRejected', transfer);
        }

        res.json(transfer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject transfer' });
    }
});

// Sender submits transaction (mark as processing)
router.patch('/transfers/:id/submit', async (req, res) => {
    try {
        const { txHash } = req.body;
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

        transfer.status = 'onchain_processing';
        transfer.txHash = txHash;
        transfer.txAttempts.push({
            txHash,
            timestamp: new Date(),
            status: 'submitted'
        });
        await transfer.save();

        // Update Product
        await Product.findOneAndUpdate(
            { tokenId: transfer.tokenId },
            { transferStatus: 'onchain_processing' }
        );

        res.json(transfer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
