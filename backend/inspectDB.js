const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex_db';

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected');
        
        const db = mongoose.connection.db;
        const products = await db.collection('products').find({}).toArray();
        console.log(`Found ${products.length} raw products in MongoDB`);
        
        products.forEach(p => {
            console.log(`- Product: ${p.productId} | Owner: ${p.currentOwner}`);
        });

        const users = await db.collection('users').find({}).toArray();
        console.log(`Found ${users.length} raw users in MongoDB`);
        users.forEach(u => {
            console.log(`- User: ${u.email} | Wallet: ${u.walletAddress}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

inspect();
