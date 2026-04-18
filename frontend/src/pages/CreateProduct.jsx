import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CreateProduct() {
    const navigate = useNavigate();
    const { contracts, account, isConnected } = useWeb3();
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useNotifications();

    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeResult, setGeocodeResult] = useState(null);
    const [formData, setFormData] = useState({
        productId: '',
        name: '',
        batchNumber: '',
        notes: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const generateProductId = () => {
        const id = `PROD-${Date.now().toString(36).toUpperCase()}`;
        setFormData(prev => ({ ...prev, productId: id }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productId || !formData.batchNumber) return;

        // Check if we have either wallet connection or email auth
        const canCreate = (isConnected && contracts.supplyChainNFT) || isAuthenticated;

        if (!canCreate) {
            alert('Please log in or connect wallet to create products');
            return;
        }

            try {
                setLoading(true);
                let tokenId;

            // Step 1 - Check Ethereum
            if (!window.ethereum) {
                throw new Error("MetaMask not installed");
            }

            // Step 2 - Force Account Retrieval (Bypass Context Delay)
            console.log("ACCOUNT BEFORE CHECK:", account);
            let activeAccount = account;
            
            if (!activeAccount) {
                console.log("🔍 Account missing from context. Requesting from MetaMask...");
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                activeAccount = accounts[0];
                console.log("FORCED ACCOUNT:", activeAccount);
            }

            if (!activeAccount) {
                throw new Error("No wallet account found. Please connect MetaMask.");
            }

            // Step 3 - Use Direct Signer for Minting
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            
            // Step 4 - Verify Network (Sepolia)
            const network = await browserProvider.getNetwork();
            console.log("NETWORK:", Number(network.chainId));
            if (Number(network.chainId) !== 11155111) {
                throw new Error("Wrong network. Please switch to Sepolia (Chain ID: 11155111)");
            }

            const signerInstance = await browserProvider.getSigner();
            const directAccount = await signerInstance.getAddress();
            console.log("DIRECT SIGNER ACCOUNT:", directAccount);
            
            // Step 5 - Initialize Contract Directly
            const contractAddress = "0x313E14f51FEe170D19C3DCE9eFb03709E916510d";
            const contractABI = [
                "function mintProduct(string productId, string batchNumber, string tokenURI, string notes) public returns (uint256)",
                "function name() public view returns (string)",
                "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
                "event ProductMinted(uint256 indexed tokenId, string productId, string batchNumber, address indexed manufacturer, uint256 timestamp)",
                "event ProductGenesis(uint256 indexed tokenId, string physicalId, address indexed manufacturer, uint256 timestamp)"
            ];
            
            const contract = new ethers.Contract(contractAddress, contractABI, signerInstance);
            console.log("CONTRACT ADDRESS:", contract.target);

            // Step 6 - Force Test Call
            console.log("TESTING CONTRACT CONNECTION...");
            try {
                const contractName = await contract.name();
                console.log("CONTRACT NAME:", contractName);
            } catch (testErr) {
                throw new Error("Contract test call failed: " + testErr.message);
            }

            const tokenURI = `data:application/json;base64,${btoa(JSON.stringify({ name: formData.name }))}`;

            console.log("🚀 CALLING MINT FUNCTION NOW");
            console.log("FINAL ACCOUNT USED:", directAccount);
            
            const tx = await contract.mintProduct(
                formData.productId, formData.batchNumber, tokenURI, formData.notes
            );
            
            console.log("MINT TX SENT:", tx.hash);
            showToast && showToast({ 
                type: 'info', 
                message: 'Transaction submitted. Waiting for blockchain confirmation...' 
            });

            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed:", receipt.hash);
            console.log("FULL RECEIPT:", receipt);

            // Extract tokenId from Transfer event OR ProductMinted/Genesis event
            let extractedTokenId = null;
            
            // Look for Transfer event (from address 0)
            const transferLog = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed.name === 'Transfer' && parsed.args.from === '0x0000000000000000000000000000000000000000';
                } catch (e) { return false; }
            });

            if (transferLog) {
                const parsedTransfer = contract.interface.parseLog(transferLog);
                extractedTokenId = Number(parsedTransfer.args.tokenId);
                console.log("EXTRACTED FROM TRANSFER:", extractedTokenId);
            }

            // Fallback: Look for ProductMinted or ProductGenesis events
            if (!extractedTokenId) {
                const mintLog = receipt.logs.find(log => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        return parsed.name === 'ProductMinted' || parsed.name === 'ProductGenesis';
                    } catch (e) { return false; }
                });

                if (mintLog) {
                    const parsedMint = contract.interface.parseLog(mintLog);
                    extractedTokenId = Number(parsedMint.args.tokenId);
                    console.log("EXTRACTED FROM MINT/GENESIS:", extractedTokenId);
                }
            }

            if (!extractedTokenId) {
                console.error("TOKEN ID EXTRACTION FAILED: No recognizable events found in logs");
                console.log("LOGS:", receipt.logs);
                throw new Error("Could not find Transfer or Mint event in transaction logs.");
            }

            tokenId = extractedTokenId;
            console.log("FINAL TOKEN ID:", tokenId);

            console.log("SENDING TO BACKEND:", {
                tokenId,
                productId: formData.productId
            });

            // Save to backend - Now including tokenId from LOGS
            await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: formData.productId,
                    tokenId: tokenId,
                    name: formData.name || formData.productId,
                    batchNumber: formData.batchNumber,
                    currentStage: 'Manufactured',
                    currentOwner: directAccount.toLowerCase(),
                    manufacturer: { walletAddress: directAccount.toLowerCase() },
                    checkpoints: [{
                        stage: 'Manufactured',
                        timestamp: new Date().toISOString(),
                        location: {},
                        handler: directAccount.toLowerCase(),
                        notes: formData.notes || 'Product manufactured',
                        transactionHash: receipt.hash
                    }]
                })
            });

                if (showToast) {
                    showToast({ type: 'productMinted', data: { productId: formData.productId, tokenId } });
                }

                if (!tokenId && (isConnected && contracts.supplyChainNFT)) {
                    throw new Error("Token ID extraction failed");
                }

                navigate(`/product/${tokenId || formData.productId}`);
            } catch (err) {
                alert('Failed: ' + err.message);
            } finally {
                setLoading(false);
            }
    };

    return (
        <div className="max-w-2xl mx-auto pt-6 pb-16 px-4">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Product</h1>
                {/* Blockchain status badge */}
                {isConnected && contracts.supplyChainNFT ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected to Blockchain — NFT Minting Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Database Mode — No Blockchain
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white/[0.04] border border-white/8 rounded-2xl p-8 space-y-6 backdrop-blur-sm">
                {/* Row 1: Product ID + Generate */}
                <div className="form-group">
                    <label className="form-label">Product ID *</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            name="productId"
                            className="form-input flex-1"
                            value={formData.productId}
                            onChange={handleChange}
                            required
                            placeholder="e.g., PROD-ABC123"
                        />
                        <button
                            type="button"
                            onClick={generateProductId}
                            className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/12 hover:border-white/20 transition-all duration-200 whitespace-nowrap"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                {/* Row 2: Name + Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="form-group !mb-0">
                        <label className="form-label">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Organic Coffee Beans"
                        />
                    </div>
                    <div className="form-group !mb-0">
                        <label className="form-label">Batch Number *</label>
                        <input
                            type="text"
                            name="batchNumber"
                            className="form-input"
                            value={formData.batchNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g., BATCH-2026-001"
                        />
                    </div>
                </div>

                {/* Row 3: Notes */}
                <div className="form-group !mb-0">
                    <label className="form-label">Notes</label>
                    <textarea
                        name="notes"
                        className="form-input"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Additional manufacturing notes..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full btn btn-primary py-2.5 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                        </span>
                    ) : '🏭 Create Product'}
                </button>
            </form>
        </div>
    );
}

export default CreateProduct;
