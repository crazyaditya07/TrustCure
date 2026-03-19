const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex';

async function updateWallets() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const updates = [
      { 
        role: 'MANUFACTURER', 
        wallet: '0x3f127F2FfdFE92D2C5BdB075eb0B77682F7B858E',
        email: 'mfg@pharma.com',
        name: 'Pharma Manufacturer'
      },
      { 
        role: 'DISTRIBUTOR', 
        wallet: '0xAb12836A055813ca2c2bDC7e7f4e2A02B0F95D14',
        email: 'dist@logistics.com',
        name: 'Logistics Distributor'
      },
      { 
        role: 'RETAILER', 
        wallet: '0xc4d10b41CFc25CCe0455269E203593a1abB6cd6e',
        email: 'retail@pharmacy.com',
        name: 'City Retailer'
      }
    ];

    for (const item of updates) {
      const walletLower = item.wallet.toLowerCase();
      const result = await User.findOneAndUpdate(
        { walletAddress: walletLower },
        { 
          walletAddress: walletLower,
          role: item.role,
          roles: [item.role],
          email: item.email,
          name: item.name,
          isVerified: true
        },
        { new: true, upsert: true }
      );
      console.log(`Updated/Created ${item.role}: ${result.walletAddress}`);
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateWallets();
