const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product'); // Ensure this points to the right path
require('dotenv').config({ path: '../.env' });// Try to auto-detect local IP for scanning across network (Phone <-> Laptop)
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback
}

const LOCAL_IP = getLocalIpAddress();
const FRONTEND_PORT = 5173; // Frontend runs on Vite default usually

// Generate base URL for QR codes. Customize this if you are using ngrok or hosting.
const SCAN_URL_BASE = `http://${LOCAL_IP}:${FRONTEND_PORT}/product/`;

console.log(`\n======================================================`);
console.log(`🌐 Base URL for scanning: ${SCAN_URL_BASE}`);
console.log(`📱 Ensure your phone and laptop are on the same WiFi!`);
console.log(`======================================================\n`);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustcure_db';

const categoryTypes = ['Pharmaceuticals'];
const medicalProducts = [
    'Paracetamol Tablets', 'Ibuprofen Tablets', 'Amoxicillin Capsules',
    'Vitamin D Tablets', 'Cough Syrup', 'Insulin Injection',
    'ORS Sachets', 'Antacid Tablets'
];

async function seedProducts(count = 50) {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️ Clearing existing products and users...');
        await Product.deleteMany({});
        const User = require('./models/User');
        await User.deleteMany({});

        // Create mock static chain of users
        const mockPassword = await bcrypt.hash('password123', 10);
        const manufacturer = await User.create({
            name: 'Farmson Pharmaceutical', email: 'mfg@pharma.com', password: mockPassword,
            role: 'MANUFACTURER', roles: ['MANUFACTURER'], walletAddress: '0x3f127F2FfdFE92D2C5BdB075eb0B77682F7B858E',
            company: 'Farmson', isVerified: true, isActive: true
        });
        const distributor = await User.create({
            name: 'Amol Pharmaceuticals', email: 'dist@pharma.com', password: mockPassword,
            role: 'DISTRIBUTOR', roles: ['DISTRIBUTOR'], walletAddress: '0xAb12836A055813ca2c2bDC7e7f4e2A02B0F95D14',
            company: 'Amol Logistics', isVerified: true, isActive: true
        });
        const retailer = await User.create({
            name: 'Aditya Pharmacy', email: 'retail@pharma.com', password: mockPassword,
            role: 'RETAILER', roles: ['RETAILER'], walletAddress: '0xc4d10b41CFc25CCe0455269E203593a1abB6cd6e',
            company: 'Aditya Retail', isVerified: true, isActive: true
        });
        const consumer = await User.create({
            name: 'Divy', email: 'consumer@pharma.com', password: mockPassword,
            role: 'CONSUMER', roles: ['CONSUMER'], walletAddress: '0x6c2332C89BEF1fEe56650392Dc8c133A605a180d',
            company: 'Individual', isVerified: true, isActive: true
        });
        console.log('✅ Created mock supply chain users (mfg, dist, retail, consumer) @pharma.com');

        const qrDir = path.join(__dirname, 'demo-qrs');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir);
        } else {
            fs.readdirSync(qrDir).forEach(file => fs.unlinkSync(path.join(qrDir, file)));
        }

        console.log(`🌱 Generating ${count} synthetic medical products...`);
        const productsList = [];

        for (let i = 0; i < count; i++) {
            const productId = `TRX-${faker.string.alphanumeric(8).toUpperCase()}`;
            const name = faker.helpers.arrayElement(medicalProducts);

            const createdDate = faker.date.recent({ days: 14 });
            const inDistDate = new Date(createdDate.getTime() + (2 * 24 * 60 * 60 * 1000));
            const inRetailDate = new Date(inDistDate.getTime() + (3 * 24 * 60 * 60 * 1000));
            const soldDate = new Date(inRetailDate.getTime() + (1 * 24 * 60 * 60 * 1000));

            const qrPayload = productId;
            const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);
            await QRCode.toFile(path.join(qrDir, `${productId}.png`), qrPayload);

            // Determine current stage
            // We'll distribute them: 20% Manufactured, 30% InDistribution, 30% InRetail, 20% Sold
            const stageRoll = Math.random();
            let currentStage = 'Manufactured';
            let ownerId = manufacturer._id;
            let currentOwnerWallet = manufacturer.walletAddress;

            const checkpoints = [{
                timestamp: createdDate,
                location: { address: 'Plot 14, GIDC', city: 'Ahmedabad', country: 'India', coordinates: { lat: 23.0225, lng: 72.5714 } },
                stage: 'Manufactured', handler: manufacturer.walletAddress, handlerName: manufacturer.name, handlerEmail: manufacturer.email,
                notes: 'Manufactured and cleared quality checks.', transactionHash: '0x' + faker.string.hexadecimal({ length: 64, prefix: '' })
            }];

            if (stageRoll > 0.2) {
                currentStage = 'InDistribution';
                ownerId = distributor._id;
                currentOwnerWallet = distributor.walletAddress;
                checkpoints.push({
                    timestamp: inDistDate,
                    location: { address: 'Warehouse C', city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lng: 72.8777 } },
                    stage: 'InDistribution', handler: distributor.walletAddress, handlerName: distributor.name, handlerEmail: distributor.email,
                    notes: 'Received in distribution hub.', transactionHash: '0x' + faker.string.hexadecimal({ length: 64, prefix: '' })
                });
            }
            if (stageRoll > 0.5) {
                currentStage = 'InRetail';
                ownerId = retailer._id;
                currentOwnerWallet = retailer.walletAddress;
                checkpoints.push({
                    timestamp: inRetailDate,
                    location: { address: 'Shop 12, Main St', city: 'Delhi', country: 'India', coordinates: { lat: 28.7041, lng: 77.1025 } },
                    stage: 'InRetail', handler: retailer.walletAddress, handlerName: retailer.name, handlerEmail: retailer.email,
                    notes: 'Stocked in pharmacy.', transactionHash: '0x' + faker.string.hexadecimal({ length: 64, prefix: '' })
                });
            }
            if (stageRoll > 0.8) {
                currentStage = 'Sold';
                ownerId = consumer._id;
                currentOwnerWallet = consumer.walletAddress;
                checkpoints.push({
                    timestamp: soldDate,
                    location: { address: 'Home', city: 'Delhi', country: 'India', coordinates: { lat: 28.7041, lng: 77.1025 } },
                    stage: 'Sold', handler: consumer.walletAddress, handlerName: consumer.name, handlerEmail: consumer.email,
                    notes: 'Purchased by patient.', transactionHash: '0x' + faker.string.hexadecimal({ length: 64, prefix: '' })
                });
            }

            const newProduct = new Product({
                productId: productId,
                tokenId: i + 1000,
                name: name,
                description: 'Medical grade pharmaceutical product with traceable supply chain.',
                category: 'Pharmaceuticals',
                imageUrl: 'https://via.placeholder.com/300?text=Medicine', // Simplified for medical mock
                batchNumber: faker.string.alphanumeric(6).toUpperCase(),
                currentStage: currentStage,
                currentOwner: currentOwnerWallet,
                manufacturer_id: manufacturer._id,
                distributor_id: distributor._id,
                retailer_id: retailer._id,
                consumer_id: consumer._id,
                manufacturer: {
                    walletAddress: checkpoints[0].handler,
                    name: 'Farmson Pharmaceutical',
                    email: 'mfg@pharma.com',
                    location: checkpoints[0].location.address
                },
                manufacturingDate: createdDate,
                checkpoints: checkpoints,
                qrCode: qrCodeDataUrl,
                metadata: {
                    weight: '500 mg',
                    certifications: ['FDA Approved', 'ISO 9001'],
                },
                isActive: true
            });

            productsList.push(newProduct);
        }

        await Product.insertMany(productsList);

        console.log(`✅ Successfully seeded ${count} products!`);
        console.log(`📁 QR Codes have been generated in: ${qrDir}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts(50);
