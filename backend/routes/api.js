const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Event = require('../models/Event');
const Transfer = require('../models/Transfer');
const ConsumerHistory = require('../models/ConsumerHistory');
const { ethers } = require('ethers');
const {
    maskWallet,
    maskContract,
    buildConsumerCheckpoints,
    computeChainIntegrity,
    NFT_CONTRACT_ADDRESS,
} = require('../utils/maskData');

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
        try {
            const product = p.toObject ? p.toObject() : { ...p };

            // Ensure no consumer_id ever leaks
            delete product.consumer_id;

            let ownerName = 'Unknown';
            if (product.currentStage === 'Manufactured' && product.manufacturer_id && product.manufacturer_id.name) {
                ownerName = product.manufacturer_id.name;
            } else if (product.currentStage === 'InDistribution' && product.distributor_id && product.distributor_id.name) {
                ownerName = product.distributor_id.name;
            } else if (product.currentStage === 'InRetail' && product.retailer_id && product.retailer_id.name) {
                ownerName = product.retailer_id.name;
            } else if (product.currentStage === 'Sold') {
                ownerName = 'End Consumer';
                product.currentOwner = '0x0000...0000';
            }

            product.currentOwnerName = ownerName;
            return product;
        } catch (e) {
            console.error('enrichProducts: skipping malformed product', e.message);
            return null;
        }
    }).filter(Boolean);
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
            .populate('manufacturer_id distributor_id retailer_id', 'name')
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

        // ============================================================
        // CONSUMER VIEW: ?view=consumer — backend-enforced whitelist
        // ============================================================
        if (req.query.view === 'consumer') {
            // Populate manufacturer, distributor, and retailer names safely
            const product = await Product.findOne({
                $or: [
                    { productId: req.params.productId },
                    { tokenId: parseInt(req.params.productId) || -1 }
                ]
            }).populate('manufacturer_id distributor_id retailer_id', 'name');

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get consumer-visible checkpoints using existing role-based method
            const visibleCheckpoints = product.getVisibleHistory(['CONSUMER'], null);

            // Compute chain integrity server-side
            const chainIntegrity = computeChainIntegrity(product, visibleCheckpoints);

            // Resolve names safely
            const mName = (product.manufacturer_id && product.manufacturer_id.name) ||
                          (product.manufacturer && product.manufacturer.name) ||
                          null;
            const dName = (product.distributor_id && product.distributor_id.name) || null;
            const rName = (product.retailer_id && product.retailer_id.name) || null;

            // Build consumer-safe checkpoint list (wallet masking applied here)
            // and attach `actorName` to each checkpoint based on rawStage
            const baseSafeCheckpoints = buildConsumerCheckpoints(visibleCheckpoints, maskWallet);
            const safeCheckpoints = baseSafeCheckpoints.map(cp => {
                let actorName = null;
                if (cp.rawStage === 'Manufactured' || cp.rawStage === 'Created') {
                    actorName = mName;
                } else if (cp.rawStage === 'InDistribution') {
                    actorName = dName;
                } else if (cp.rawStage === 'InRetail') {
                    actorName = rName;
                }
                return {
                    ...cp,
                    actorName
                };
            });

            // Contract address from maskData (env or deployedContracts.json fallback)
            const contractAddress = NFT_CONTRACT_ADDRESS;

            // === WHITELIST-ONLY RESPONSE — nothing else is sent ===
            return res.json({
                name:             product.name,
                batchNumber:      product.batchNumber,
                tokenId:          product.tokenId,
                currentStage:     product.currentStage,
                manufacturingDate: product.manufacturingDate || null,
                expiryDate:       (product.metadata && product.metadata.expiryDate) || null,
                manufacturerName: mName, // Retained for backwards compatibility if needed
                
                // Privacy-safe actor objects
                manufacturer:     mName ? { name: mName } : null,
                distributor:      dName ? { name: dName } : null,
                retailer:         rName ? { name: rName } : null,

                checkpoints:      safeCheckpoints,
                contractAddress:  contractAddress ? maskContract(contractAddress) : null,
                contractAddressFull: contractAddress || null,
                chainIntegrity,
            });
        }

        // ============================================================
        // INTERNAL VIEW: no view param — existing behaviour unchanged
        // ============================================================
        const product = await Product.findOne({
            $or: [
                { productId: req.params.productId },
                { tokenId: parseInt(req.params.productId) || -1 }
            ]
        });

        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
                hint: `No product matched productId="${req.params.productId}" or tokenId=${parseInt(req.params.productId) || 'N/A'}. Use the TRX-XXXXXXXX product ID shown on the label.`
            });
        }

        // Use enrichProducts to ensure privacy masking is applied even for single lookups
        const [enrichedProduct] = enrichProducts([product]);
        res.json(enrichedProduct);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Get product history with role-based visibility
router.get('/products/:productId/history', async (req, res) => {
    try {
        const { userRoles, userAddress } = req.query;

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
        
        // Ensure tokenId is present and a number
        if (productData.tokenId === undefined || productData.tokenId === null) {
            console.error("BACKEND ERROR: Missing tokenId in request");
            return res.status(400).json({ error: 'tokenId is required' });
        }
        productData.tokenId = Number(productData.tokenId);

        // Map currentStage to status enum to ensure DB consistency
        const stageToStatus = {
            'Created': 'MANUFACTURED',
            'Manufactured': 'MANUFACTURED',
            'InDistribution': 'IN_TRANSIT',
            'InRetail': 'AT_RETAILER',
            'Sold': 'SOLD'
        };

        if (productData.currentStage && !productData.status) {
            productData.status = stageToStatus[productData.currentStage] || 'MANUFACTURED';
        }

        // Auto-populate manufacturer_id from wallet lookup so enrichProducts() works
        if (productData.currentOwner && !productData.manufacturer_id) {
            const mfgUser = await User.findOne({ walletAddress: productData.currentOwner.toLowerCase() });
            if (mfgUser) {
                productData.manufacturer_id = mfgUser._id;
                // Enrich the manufacturer sub-document too if not already set
                if (!productData.manufacturer || !productData.manufacturer.name) {
                    const formattedLocation = mfgUser.location
                        ? (typeof mfgUser.location === 'string'
                            ? mfgUser.location
                            : [mfgUser.location.address, mfgUser.location.city, mfgUser.location.country].filter(Boolean).join(', '))
                        : '';
                        
                    productData.manufacturer = {
                        walletAddress: mfgUser.walletAddress,
                        name: mfgUser.name || '',
                        email: mfgUser.email || '',
                        location: formattedLocation
                    };
                }
            }
        }

        // Normalise currentOwner to lowercase
        if (productData.currentOwner) {
            productData.currentOwner = productData.currentOwner.toLowerCase();
        }

        // PRE-CHECK: Ensure productId is unique if we're creating a new one
        // This prevents 11000 errors if the user re-uses an ID from a previous attempt
        if (productData.productId) {
            const existingById = await Product.findOne({ 
                productId: productData.productId, 
                tokenId: { $ne: productData.tokenId } 
            });
            if (existingById) {
                return res.status(400).json({ 
                    error: `Product ID ${productData.productId} is already in use by another token (ID: ${existingById.tokenId}). Please use a unique Product ID.` 
                });
            }
        }

        const product = await Product.findOneAndUpdate(
            { tokenId: productData.tokenId }, // tokenId is canonical key
            { 
               ...productData,
               productId: productData.productId || `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            },
            { upsert: true, new: true, runValidators: false } // runValidators: false to be safe during migration
        );

        res.json(product);
    } catch (error) {
        console.error('Create product error details:', error);
        res.status(500).json({ 
            error: 'Failed to create product',
            details: error.message
        });
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

// Mark product as sold (Retailer only — no consumer transfer)
router.post('/products/:productId/mark-sold', async (req, res) => {
    try {
        const { retailerWallet, retailerName, retailerEmail, transactionHash, notes } = req.body;

        const product = await Product.findOne({
            $or: [
                { productId: req.params.productId },
                { tokenId: parseInt(req.params.productId) || -1 }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Idempotent: if already sold (e.g. event listener beat us here), return success
        if (product.status === 'SOLD' || product.currentStage === 'Sold') {
            return res.json({ success: true, product, alreadySold: true });
        }

        // Guard: product should be at InRetail. If the stage is wrong, log a warning
        // but still proceed — the on-chain tx already confirmed, so we must stay in sync.
        if (product.currentStage !== 'InRetail') {
            console.warn(`mark-sold: product ${product.productId} is at stage "${product.currentStage}" (expected InRetail). Proceeding anyway as on-chain tx confirmed.`);
        }

        // Update lifecycle state — no ownership transfer, no consumer_id
        product.currentStage = 'Sold';
        product.status = 'SOLD';

        // Append SOLD checkpoint
        const soldCheckpoint = {
            timestamp: new Date(),
            stage: 'Sold',
            handler: retailerWallet || null,
            handlerName: retailerName || 'Retailer',
            handlerEmail: retailerEmail || null,
            notes: notes || 'Product sold to customer',
            transactionHash: transactionHash || null,
            metadata: new Map([
                ['role', 'RETAILER'],
                ['action', 'SOLD']
            ])
        };

        product.checkpoints.push(soldCheckpoint);
        await product.save();

        // Emit real-time socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`product:${req.params.productId}`).emit('productSold', {
                productId: req.params.productId,
                checkpoint: soldCheckpoint
            });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Mark sold error:', error);
        res.status(500).json({ error: 'Failed to mark product as sold' });
    }
});

// Get products by explicit role-based ownership
router.get('/owner/:walletAddress/products', async (req, res) => {
    try {
        const searchedWallet = req.params.walletAddress.toLowerCase();

        const user = await User.findOne({ walletAddress: searchedWallet });
        if (!user) {
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
            .populate('manufacturer_id distributor_id retailer_id', 'name')
            .sort({ createdAt: -1 });

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
        const user = await User.findOne({ walletAddress });
        const role = user?.role || 'CONSUMER';

        const stats = {
            ownedProducts: await Product.countDocuments({ currentOwner: walletAddress, isActive: true }),
            primaryMetric: 0, 
            secondaryMetric: 0 
        };

        if (role === 'MANUFACTURER') {
            stats.primaryMetric = await Product.countDocuments({ 'manufacturer.walletAddress': walletAddress });
            stats.secondaryMetric = await Event.countDocuments({ from: walletAddress, eventType: 'TransferredToDistributor' });
        } else if (role === 'DISTRIBUTOR') {
            stats.primaryMetric = await Event.countDocuments({ to: walletAddress, eventType: 'TransferredToDistributor' });
            stats.secondaryMetric = await Event.countDocuments({ from: walletAddress, eventType: 'TransferredToRetailer' });
        } else if (role === 'RETAILER') {
            stats.primaryMetric = await Event.countDocuments({ to: walletAddress, eventType: 'TransferredToRetailer' });
            stats.secondaryMetric = await Product.countDocuments({ currentStage: 'Sold', retailer_id: user?._id });
        }

        res.json(stats);
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get action history for specific user (Role-based)
router.get('/actions/:walletAddress', async (req, res) => {
    try {
        const walletAddress = req.params.walletAddress.toLowerCase();
        const user = await User.findOne({ walletAddress });
        const role = user?.role || 'CONSUMER';

        let query = {};
        if (role === 'MANUFACTURER') {
            query.$or = [
                { eventType: 'ProductMinted', from: walletAddress },
                { eventType: 'TransferredToDistributor', from: walletAddress }
            ];
        } else if (role === 'DISTRIBUTOR') {
            query.$or = [
                { eventType: 'TransferredToDistributor', to: walletAddress },
                { eventType: 'TransferredToRetailer', from: walletAddress }
            ];
        } else if (role === 'RETAILER') {
            query.$or = [
                { eventType: 'TransferredToRetailer', to: walletAddress },
                { eventType: 'ProductSold', from: walletAddress },
                { eventType: 'ProductSold', to: walletAddress }
            ];
        } else {
            // Consumers see everything they've scanned (from ConsumerHistory)
            // But this route is specifically for blockchain-linked actions.
            query.$or = [{ from: walletAddress }, { to: walletAddress }];
        }

        const actions = await Event.find(query)
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(actions);
    } catch (error) {
        console.error('Get user actions error:', error);
        res.status(500).json({ error: 'Failed to get action history' });
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

// ============================================
// Consumer History
// ============================================

// Record a scan (authenticated users only)
router.post('/consumer/scans', async (req, res) => {
    try {
        const { userId, productId, productName } = req.body;
        
        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId and productId are required' });
        }

        // Keep only the most recent scan if duplicate in last 5 minutes? 
        // For now, just save every scan.
        const scan = new ConsumerHistory({
            userId,
            productId,
            productName: productName || productId
        });

        await scan.save();
        res.status(201).json(scan);
    } catch (error) {
        console.error('Record scan error:', error);
        res.status(500).json({ error: 'Failed to record scan' });
    }
});

// Get scan history for a user
router.get('/consumer/scans/:userId', async (req, res) => {
    try {
        const scans = await ConsumerHistory.find({ userId: req.params.userId })
            .sort({ scannedAt: -1 })
            .limit(50);
        
        res.json(scans);
    } catch (error) {
        console.error('Get scan history error:', error);
        res.status(500).json({ error: 'Failed to get scan history' });
    }
});

module.exports = router;
