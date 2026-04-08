const mongoose = require('mongoose');

async function fixProducts() {
    await mongoose.connect('mongodb://localhost:27017/supplychain');
    const Product = require('./models/Product');
    const User = require('./models/User');
    
    // Find missing manufacturer info
    const products = await Product.find({
        $or: [
            { 'manufacturer.walletAddress': { $exists: false } },
            { 'manufacturer.walletAddress': "" },
            { manufacturer_id: { $exists: false } },
            { manufacturer_id: null }
        ]
    });
    
    console.log('Products missing manufacturer info to fix:', products.length);
    
    for (let p of products) {
        // Try to recover from checkpoints finding the manufacturer (stage = Manufactured)
        const mfgCheckpoint = p.checkpoints.find(cp => cp.stage === 'Manufactured');
        let mfgWallet = '';
        if (mfgCheckpoint) {
            mfgWallet = mfgCheckpoint.handler;
        } else if (p.currentStage === 'Manufactured') {
            mfgWallet = p.currentOwner;
        }
        
        if (mfgWallet) {
            const user = await User.findOne({ walletAddress: mfgWallet.toLowerCase() });
            
            p.manufacturer = {
                walletAddress: mfgWallet.toLowerCase(),
                name: user ? user.name : '',
                email: user ? user.email : ''
            };
            if (user) {
                p.manufacturer_id = user._id;
            }
            await p.save();
            console.log('Fixed product', p.productId, 'with manufacturer', mfgWallet);
        } else {
            console.log('Could not find manufacturer info for product', p.productId);
        }
    }
    
    console.log('Fix complete.');
    process.exit();
}

fixProducts().catch(console.error);
