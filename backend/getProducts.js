const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/supplychain');
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
    const products = await Product.find().lean();
    console.log(JSON.stringify(products.map(p => ({
        id: p.productId, 
        tokenId: p.tokenId, 
        owner: p.currentOwner, 
        stage: p.currentStage 
    })), null, 2));
    process.exit(0);
}
check().catch(console.error);
