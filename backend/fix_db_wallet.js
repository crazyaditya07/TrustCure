const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/supplychain').then(async () => {
    try {
        await User.updateMany({}, { 
            $set: { walletAddress: '0x3f127f2ffdfe92d2c5bdb075eb0b77682f7b858e' } 
        });
        console.log('Successfully updated wallet address for all users to 0x3f127f2ffdfe92d2c5bdb075eb0b77682f7b858e');
    } catch (e) {
        console.error('Error updating users:', e);
    } finally {
        process.exit(0);
    }
});
