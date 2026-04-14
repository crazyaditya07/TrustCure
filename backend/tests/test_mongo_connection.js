const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config(); // Should load from .env

const MONGODB_URI = 'mongodb://localhost:27017/trustcure_db';
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustcure_db';

console.log('Testing MongoDB Connection to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB successfully');

        try {
            const count = await User.countDocuments();
            console.log(`📊 Current User Count: ${count}`);

            const users = await User.find().sort({ createdAt: -1 }).limit(5);
            console.log('📝 Recent Users:');
            users.forEach(u => {
                console.log(` - ${u.name} (${u.email}) - Role: ${u.role}`);
            });

        } catch (err) {
            console.error('❌ Error querying users:', err);
        } finally {
            mongoose.disconnect();
            console.log('👋 Disconnected');
            process.exit(0);
        }
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Failed:', err);
        process.exit(1);
    });
