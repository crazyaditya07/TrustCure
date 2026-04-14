/**
 * fixOwnership.js — One-time DB migration script
 * 
 * Repairs all Product documents that have a null/missing currentOwner.
 * Sets currentOwner from manufacturer.walletAddress and backfills
 * manufacturer_id by looking up the User record.
 * 
 * Usage (from backend/ dir): node ../scripts/fixOwnership.js
 */

require('dotenv').config({ path: '../.env' });
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustcure_db';

async function fixOwnership() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all products to refresh manufacturer_id and owner names
        const allProducts = await Product.find({});
        console.log(`🔍 Refreshing manufacturer metadata for ${allProducts.length} products...`);

        for (const product of allProducts) {
            try {
                const walletLower = (product.currentOwner || product.manufacturer?.walletAddress)?.toLowerCase();

                if (!walletLower) {
                    console.warn(`⚠️  Skipping product ${product.productId} — no wallet available`);
                    skipped++;
                    continue;
                }

                // Always ensure currentOwner is set
                product.currentOwner = walletLower;

                // Proactively lookup the user by wallet to refresh manufacturer_id
                const mfgUser = await User.findOne({ walletAddress: walletLower });
                if (mfgUser) {
                    product.manufacturer_id = mfgUser._id;
                    
                    // Update basic metadata in the sub-document if needed
                    if (mfgUser.name) product.manufacturer.name = mfgUser.name;
                    if (mfgUser.email) product.manufacturer.email = mfgUser.email;
                    if (mfgUser.company) product.manufacturer.company = mfgUser.company;

                    console.log(`  ✅ Linked ${product.productId} to user: ${mfgUser.email} (${mfgUser._id})`);
                    repaired++;
                } else {
                    console.warn(`  ⚠️  No user found for wallet ${walletLower} (Product: ${product.productId})`);
                    skipped++;
                }

                await product.save();
            } catch (err) {
                console.error(`❌ Error processing product ${product.productId}:`, err.message);
                skipped++;
            }
        }

        // Normalise all existing ownerAddresses to lowercase
        const mixedCaseResult = await Product.updateMany(
            { currentOwner: { $exists: true, $ne: null, $ne: '' } },
            [{ $set: { currentOwner: { $toLower: '$currentOwner' } } }]
        );
        console.log(`\n🔡 Normalised case on ${mixedCaseResult.modifiedCount} additional currentOwner fields`);

        console.log(`\n==============================`);
        console.log(`📊 Migration Summary`);
        console.log(`   Repaired : ${repaired}`);
        console.log(`   Skipped  : ${skipped}`);
        console.log(`   Total    : ${brokenProducts.length}`);
        console.log(`==============================\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

fixOwnership();
