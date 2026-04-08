const mongoose = require('mongoose');

async function fixConsumerWallet() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect('mongodb://localhost:27017/supplychain');
        const User = require('./models/User');

        const targetAddress = '0x6c2332c89bef1fee56650392dc8c133a605a180d';

        console.log("Deleting consumer_test@example.com (if exists)...");
        await User.deleteOne({ email: 'consumer_test@example.com' });

        console.log("Updating consumer@pharma.com wallet to target address...");
        const result = await User.updateOne(
            { email: 'consumer@pharma.com' },
            { $set: { walletAddress: targetAddress } }
        );

        console.log("Update result:", result);
        console.log("✅ Successfully mapped consumer@pharma.com to wallet 0x6c23...");
    } catch (e) {
        console.error("❌ Failed to update:", e);
    } finally {
        process.exit();
    }
}

fixConsumerWallet();
