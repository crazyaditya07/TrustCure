const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustcure_db';

const targetWallets = {
    MANUFACTURER: '0x3f127F2FfdFE92D2C5BdB075eb0B77682F7B858E',
    DISTRIBUTOR: '0xAb12836A055813ca2c2bDC7e7f4e2A02B0F95D14',
    RETAILER: '0xc4d10b41CFc25CCe0455269E203593a1abB6cd6e'
};

const emails = {
    MANUFACTURER: 'mfg@pharma.com',
    DISTRIBUTOR: 'dist@pharma.com',
    RETAILER: 'retail@pharma.com'
};

async function updateWallets() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const [role, newWallet] of Object.entries(targetWallets)) {
            const email = emails[role];
            const lowerWallet = newWallet.toLowerCase();

            // 1. Remove ANY other user that has this wallet but NOT the correct email
            // This clears "ghost" accounts or accidental registrations
            const cleanup = await User.deleteMany({
                walletAddress: lowerWallet,
                email: { $ne: email }
            });
            if (cleanup.deletedCount > 0) {
                console.log(`🧹 Cleared ${cleanup.deletedCount} conflicting record(s) for wallet ${lowerWallet}`);
            }

            // 2. Update the target user
            const result = await User.updateOne(
                { email: email },
                { $set: { walletAddress: lowerWallet } }
            );
            
            if (result.matchedCount > 0) {
                console.log(`✅ Updated ${role} (${email}) to wallet: ${lowerWallet}`);
            } else {
                console.log(`⚠️ User ${email} not found!`);
            }
        }

        console.log('🎉 Wallet update complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating wallets:', err);
        process.exit(1);
    }
}

updateWallets();
