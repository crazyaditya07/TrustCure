const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: [
            'ProductMinted',
            'CheckpointAdded',
            'ProductTransferred',
            'TransferredToDistributor',
            'TransferredToRetailer',
            'ProductSold',
            'RoleGrantedToUser',
            'ParticipantRegistered',
            'ParticipantDeactivated'
        ],
        index: true
    },
    productId: {
        type: String,
        index: true
    },
    tokenId: {
        type: Number,
        index: true
    },
    from: {
        type: String, // wallet address
        lowercase: true
    },
    to: {
        type: String, // wallet address
        lowercase: true
    },
    stage: {
        type: String,
        enum: ['Created', 'Manufactured', 'InDistribution', 'InRetail', 'Sold']
    },
    location: String,
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    blockNumber: {
        type: Number,
        required: true,
        index: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    logIndex: {
        type: Number
    },
    contractAddress: {
        type: String,
        lowercase: true
    },
    rawData: {
        type: mongoose.Schema.Types.Mixed
    },
    processed: {
        type: Boolean,
        default: true
    },
    notificationsSent: [{
        recipient: String,
        sentAt: Date,
        type: String
    }]
}, {
    timestamps: true
});

// Compound indexes for common queries
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ from: 1, timestamp: -1 });
eventSchema.index({ to: 1, timestamp: -1 });
eventSchema.index({ productId: 1, timestamp: -1 });

// Static method to get events for a wallet
eventSchema.statics.getEventsForWallet = function (walletAddress, limit = 50) {
    return this.find({
        $or: [
            { from: walletAddress.toLowerCase() },
            { to: walletAddress.toLowerCase() }
        ]
    })
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method to get events for a product
eventSchema.statics.getEventsForProduct = function (productId, limit = 50) {
    return this.find({ productId })
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method to get recent events
eventSchema.statics.getRecentEvents = function (limit = 100) {
    return this.find()
        .sort({ blockNumber: -1, logIndex: -1 })
        .limit(limit);
};

// Method to check if event already exists (for deduplication)
eventSchema.statics.eventExists = function (transactionHash, logIndex) {
    return this.findOne({
        transactionHash,
        logIndex: logIndex || { $exists: false }
    });
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
