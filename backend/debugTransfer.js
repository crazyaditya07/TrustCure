const { ethers } = require('ethers');
require('dotenv').config({ path: __dirname + '/../.env' });
const deployedContracts = require('../frontend/src/contracts/deployedContracts.json');
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function debug() {
    try {
        console.log("=== STEP 3 & 4: VERIFY WALLET & CONTRACT ===");
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
        const wallet = new ethers.Wallet(privateKey, provider);
        
        const supplyChainAddress = deployedContracts.contracts.SupplyChainNFT.address;
        const supplyChainAbi = deployedContracts.contracts.SupplyChainNFT.abi;
        const contract = new ethers.Contract(supplyChainAddress, supplyChainAbi, wallet);
        
        console.log("Signer Address:", wallet.address);
        console.log("Contract Address:", contract.target);

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain');
        console.log("Connected to MongoDB.");

        // Find a product owned by the manufacturer
        const product = await Product.findOne({ currentOwner: wallet.address.toLowerCase(), currentStage: 'Manufactured' });
        if (!product) {
            console.log("No product found for this manufacturer in Manufactured stage.");
            process.exit(0);
        }
        
        console.log("=== STEP 2: VERIFY FUNCTION PARAMS ===");
        const tokenId = product.tokenId;
        const recipient = '0xAb12836A055813ca2c2bDC7e7f4e2A02B0F95D14'; // Distributor
        const location = 'Test City';
        const notes = 'Debug Transfer';
        
        console.log("Token ID:", tokenId);
        console.log("Recipient:", recipient);

        console.log("=== STEP 7: VERIFY ON-CHAIN STATE ===");
        const owner = await contract.ownerOf(tokenId);
        console.log("On-Chain Owner:", owner);
        
        const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
        const hasRole = await contract.hasRole(DISTRIBUTOR_ROLE, recipient);
        console.log("Recipient has DISTRIBUTOR_ROLE?", hasRole);
        
        console.log("=== STEP 8: BACKEND CONSISTENCY CHECK ===");
        console.log("MongoDB Owner:", product.currentOwner);
        console.log("Match?", owner.toLowerCase() === product.currentOwner.toLowerCase());

        console.log("=== STEP 5: DRY RUN TRANSACTION ===");
        try {
            console.log("CALLING CONTRACT STATICALLY (ESTIMATE/DRY RUN)...");
            await contract.transferToDistributor.staticCall(tokenId, recipient, location, notes);
            console.log("STATIC CALL SUCCESSFUL - No Revert!");
        } catch (err) {
            console.error("=== STEP 6: EXTRACT ERROR DETAILS ===");
            console.error("STATIC ERROR:", err.message);
            console.error("Reason:", err.reason);
            console.error("Code:", err.code);
            console.error("Data:", err.data);
            process.exit(1);
        }

        process.exit(0);
    } catch (e) {
        console.error("FATAL SCRIPT ERROR:", e);
        process.exit(1);
    }
}

debug();
