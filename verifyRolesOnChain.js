const { ethers } = require('ethers');
require('dotenv').config({ path: __dirname + '/.env' });
const deployedContracts = require('./frontend/src/contracts/deployedContracts.json');

const targetWallets = {
    MANUFACTURER: '0x3f127F2FfdFE92D2C5BdB075eb0B77682F7B858E',
    DISTRIBUTOR: '0xAb12836A055813ca2c2bDC7e7f4e2A02B0F95D14',
    RETAILER: '0xc4d10b41CFc25CCe0455269E203593a1abB6cd6e'
};

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const supplyChainAddress = deployedContracts.contracts.SupplyChainNFT.address;
    const supplyChainAbi = deployedContracts.contracts.SupplyChainNFT.abi;

    const contract = new ethers.Contract(supplyChainAddress, supplyChainAbi, provider);

    console.log('Contract Address:', supplyChainAddress);

    for (const [roleName, targetWallet] of Object.entries(targetWallets)) {
        const roleHash = ethers.keccak256(ethers.toUtf8Bytes(roleName + "_ROLE"));
        const hasRole = await contract.hasRole(roleHash, targetWallet);
        console.log(`${roleName} (${targetWallet}) has role? ${hasRole}`);
    }
}

main().catch(console.error);
