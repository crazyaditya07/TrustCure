const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex_db';

async function sync() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const mfg = await db.collection('users').findOne({ email: 'mfg@pharma.com' });
        if (!mfg) {
            console.error('❌ Manufacturer user not found!');
            process.exit(1);
        }

        const result = await db.collection('products').updateMany(
            { currentOwner: mfg.walletAddress.toLowerCase() },
            { $set: { manufacturer_id: mfg._id } }
        );

        console.log(`✅ Updated ${result.modifiedCount} products to point to manufacturer_id: ${mfg._id}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating product IDs:', err);
        process.exit(1);
    }
}

sync();
