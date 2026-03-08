const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Event = require('../models/Event');
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
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.json({
            products,
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

// Create or update product (synced from blockchain)
router.post('/products', async (req, res) => {
    try {
        const productData = req.body;

        const product = await Product.findOneAndUpdate(
            { productId: productData.productId },
            productData,
            { upsert: true, new: true }
        );

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

        const product = await Product.findOne({ productId: req.params.productId });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
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
        const user = await User.findOne({ walletAddress: req.params.walletAddress.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let query = { isActive: true };
        switch (user.role) {
            case 'MANUFACTURER':
                query.manufacturer_id = user._id;
                break;
            case 'DISTRIBUTOR':
                query.distributor_id = user._id;
                break;
            case 'RETAILER':
                query.retailer_id = user._id;
                break;
            case 'CONSUMER':
            default:
                query.consumer_id = user._id;
                // If they have dual roles or fallback, consumer takes precedence in default
                break;
        }

        const products = await Product.find(query);
        res.json(products);
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

module.exports = router;
