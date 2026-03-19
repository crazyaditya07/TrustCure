const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain';

async function wipe() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Note: Using dynamic models to avoid schema issues during wipe
        const collections = ['products', 'checkpoints', 'transfers', 'events'];
        
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col).countDocuments();
            console.log(`🧹 Wiping ${count} documents from ${col}...`);
            await mongoose.connection.db.collection(col).deleteMany({});
        }

        console.log('✨ Database clean of all invalid products and history.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Wipe failed:', err);
        process.exit(1);
    }
}

wipe();
