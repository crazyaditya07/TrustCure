const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex_db';

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const mfg = await db.collection('users').findOne({ email: 'mfg@pharma.com' });
        console.log(`Manufacturer User: ${mfg?.email} | ID: ${mfg?._id} | Wallet: ${mfg?.walletAddress}`);

        const products = await db.collection('products').find({}).toArray();
        for (const p of products) {
            console.log(`Product ID: ${p.productId} | Owner: ${p.currentOwner} | manufacturer_id: ${p.manufacturer_id}`);
            if (mfg && p.manufacturer_id && p.manufacturer_id.toString() !== mfg._id.toString()) {
                console.log(`  ⚠️ MISMATCH: manufacturer_id ${p.manufacturer_id} != user._id ${mfg._id}`);
            } else if (mfg && !p.manufacturer_id) {
                console.log(`  ⚠️ MISSING: manufacturer_id`);
            } else {
                console.log(`  ✅ MATCH: Linked correctly`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

verify();
