/**
 * fixOwnership.js — One-time DB migration script
 * 
 * Repairs all Product documents that have a null/missing currentOwner.
 * Sets currentOwner from manufacturer.walletAddress and backfills
 * manufacturer_id by looking up the User record.
 * 
 * Usage: node scripts/fixOwnership.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../backend/models/Product');
const User = require('../backend/models/User');


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustcure_db';

async function fixOwnership() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all products with missing currentOwner
        const brokenProducts = await Product.find({
            $or: [
                { currentOwner: null },
                { currentOwner: '' },
                { currentOwner: { $exists: false } }
            ]
        });

        console.log(`🔍 Found ${brokenProducts.length} products with missing currentOwner`);

        let repaired = 0;
        let skipped = 0;

        for (const product of brokenProducts) {
            // Derive wallet from manufacturer sub-document
            const wallet = product.manufacturer?.walletAddress;

            if (!wallet) {
                console.warn(`⚠️  Skipping product ${product.productId} — no manufacturer wallet available`);
                skipped++;
                continue;
            }

            const walletLower = wallet.toLowerCase();

            // Backfill currentOwner
            product.currentOwner = walletLower;

            // Backfill manufacturer_id if missing
            if (!product.manufacturer_id) {
                const mfgUser = await User.findOne({ walletAddress: walletLower });
                if (mfgUser) {
                    product.manufacturer_id = mfgUser._id;
                    // Also enrich manufacturer sub-doc
                    if (!product.manufacturer.name && mfgUser.name) {
                        product.manufacturer.name = mfgUser.name;
                    }
                    if (!product.manufacturer.email && mfgUser.email) {
                        product.manufacturer.email = mfgUser.email;
                    }
                    console.log(`  ↳ Linked manufacturer_id: ${mfgUser._id} (${mfgUser.name})`);
                }
            }

            await product.save();
            console.log(`✅ Repaired ${product.productId} | tokenId: ${product.tokenId} | currentOwner: ${walletLower}`);
            repaired++;
        }

        // Also ensure all existing products have lowercase currentOwner
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
