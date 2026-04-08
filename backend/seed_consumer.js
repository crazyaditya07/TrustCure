const mongoose = require('mongoose');

async function seedUser() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect('mongodb://localhost:27017/supplychain');
        const User = require('./models/User');

        const walletAddress = '0x6c2332C89BEF1fEe56650392Dc8c133A605a180d'.toLowerCase();

        const user = await User.findOneAndUpdate(
            { walletAddress },
            {
                walletAddress,
                email: 'consumer_test@example.com',
                password: 'hash_is_optional',
                roles: ['CONSUMER'],
                role: 'CONSUMER',
                name: 'Test Consumer',
                company: 'Consumer Org',
                location: {
                    address: '123 Consumer Lane',
                    city: 'Test City',
                    country: 'Test Country'
                },
                isVerified: true,
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log("✅ Successfully seeded Consumer wallet:");
        console.log(user);

    } catch (e) {
        console.error("❌ Failed to seed user:", e);
    } finally {
        process.exit();
    }
}

seedUser();
