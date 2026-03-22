const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex_db';

async function listUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({}, 'name email walletAddress role');
        console.log('Users in DB:');
        users.forEach(u => {
            console.log(`- ${u.email} | ${u.walletAddress} | ${u.role} (${u.name})`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error listing users:', err);
        process.exit(1);
    }
}

listUsers();
