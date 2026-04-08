const mongoose = require('mongoose');

async function testQuery() {
    await mongoose.connect('mongodb://localhost:27017/supplychain');
    const Event = require('./models/Event');
    
    // Using $in
    const outIn = await Event.countDocuments({
        from: '0x3f127f2ffdfe92d2c5bdb075eb0b77682f7b858e',
        eventType: { $in: ['TransferredToDistributor', 'ProductMinted'] }
    });
    
    // Using $or
    const outOr = await Event.countDocuments({
        from: '0x3f127f2ffdfe92d2c5bdb075eb0b77682f7b858e',
        $or: [
            { eventType: 'TransferredToDistributor' },
            { eventType: 'ProductMinted' }
        ]
    });
    
    console.log('Result IN:', outIn);
    console.log('Result OR:', outOr);
    process.exit();
}

testQuery().catch(console.error);
