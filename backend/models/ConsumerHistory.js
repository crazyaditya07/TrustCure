const mongoose = require('mongoose');

const consumerHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: String, // Can be productId or tokenId
        required: true
    },
    productName: String,
    scannedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a user doesn't have duplicate entries for the same product in a short time
// or just keep it simple for now as a chronological log.
consumerHistorySchema.index({ userId: 1, scannedAt: -1 });

const ConsumerHistory = mongoose.model('ConsumerHistory', consumerHistorySchema);

module.exports = ConsumerHistory;
