const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    location: {
        address: String,
        city: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    stage: {
        type: String,
        enum: ['Created', 'Manufactured', 'InDistribution', 'InRetail', 'Sold'],
        required: true
    },
    handler: {
        type: String, // wallet address (optional for email-only users)
        required: false
    },
    handlerName: String,
    handlerEmail: String,
    notes: String,
    transactionHash: String,
    blockNumber: Number,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tokenId: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    category: String,
    imageUrl: String,
    batchNumber: {
        type: String,
        required: true,
        index: true
    },
    currentStage: {
        type: String,
        enum: ['Created', 'Manufactured', 'InDistribution', 'InRetail', 'Sold'],
        default: 'Created'
    },
    status: {
        type: String, // Lifecycle status: IN_TRANSIT, DELIVERED, SOLD
        default: 'Manufactured'
    },
    currentOwner: {
        type: String, // wallet address
        lowercase: true
    },
    manufacturer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    distributor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    retailer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    consumer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    manufacturer: {
        walletAddress: String,
        name: String,
        email: String,
        location: String
    },
    manufacturingDate: Date,
    checkpoints: [checkpointSchema],
    qrCode: String, // Base64 encoded QR code image
    tokenURI: String,
    metadata: {
        weight: String,
        dimensions: String,
        materials: [String],
        certifications: [String],
        expiryDate: Date,
        customFields: {
            type: Map,
            of: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    transferStatus: {
        type: String,
        enum: ['none', 'pending', 'confirmed', 'onchain_processing', 'onchain_failed', 'retrying'],
        default: 'none'
    },
    pendingTransferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transfer',
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes
productSchema.index({ currentStage: 1, currentOwner: 1 });
productSchema.index({ 'manufacturer.walletAddress': 1 });
productSchema.index({ createdAt: -1 });

// Virtual for checkpoint count
productSchema.virtual('checkpointCount').get(function () {
    return this.checkpoints?.length || 0;
});

// Method to add checkpoint
productSchema.methods.addCheckpoint = function (checkpoint) {
    this.checkpoints.push(checkpoint);
    this.currentStage = checkpoint.stage;
    if (checkpoint.handler) {
        this.currentOwner = checkpoint.handler.toLowerCase();
    }
    return this.save();
};

// Method to get public view (role-based)
productSchema.methods.getVisibleHistory = function (userRoles, userAddress) {
    const stages = ['Created', 'Manufactured', 'InDistribution', 'InRetail', 'Sold'];

    // Ensure userRoles is an array
    const roles = Array.isArray(userRoles) ? userRoles : (userRoles ? userRoles.split(',') : ['CONSUMER']);

    let maxVisibleStage = null;

    // Check for highest priority role
    if (roles.includes('ADMIN')) {
        maxVisibleStage = 'Sold';
    } else if (roles.includes('RETAILER')) {
        maxVisibleStage = 'InRetail';
    } else if (roles.includes('DISTRIBUTOR')) {
        maxVisibleStage = 'InDistribution';
    } else if (roles.includes('MANUFACTURER')) {
        maxVisibleStage = 'Manufactured';
    } else if (roles.includes('CONSUMER')) {
        // For standard consumers and guests, they can see the full journey up to its public state
        // If it's already sold, they see the whole journey.
        maxVisibleStage = this.currentStage === 'Sold' ? 'Sold' : 'InRetail';
    }

    if (!maxVisibleStage) {
        return [];
    }

    const maxIndex = stages.indexOf(maxVisibleStage);
    return this.checkpoints.filter(cp => {
        const cpIndex = stages.indexOf(cp.stage);
        return cpIndex <= maxIndex;
    });
};

// Static method to find by current owner
productSchema.statics.findByOwner = function (walletAddress) {
    return this.find({
        currentOwner: walletAddress.toLowerCase(),
        isActive: true
    });
};

// Static method to find by stage
productSchema.statics.findByStage = function (stage) {
    return this.find({
        currentStage: stage,
        isActive: true
    });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
