import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, ChevronRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TransferModal = ({ isOpen, onClose, product, onTransferInitiated }) => {
    const { account, signer, contracts } = useWeb3();
    const [step, setStep] = useState(1); // 1: Select Recipient, 2: Confirm & Sign, 3: Success
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determine next role based on current stage
    const getNextRole = (stage) => {
        switch (stage) {
            case 'Manufactured': return 'DISTRIBUTOR';
            case 'InDistribution': return 'RETAILER';
            case 'InRetail': return 'CONSUMER';
            default: return null;
        }
    };

    const nextRole = getNextRole(product?.currentStage);

    useEffect(() => {
        if (isOpen && nextRole && step === 1) {
            fetchRecipients();
        }
    }, [isOpen, nextRole, step]);

    const fetchRecipients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/users`, {
                params: { role: nextRole }
            });
            // Filter out self
            const filtered = response.data.filter(u => u.walletAddress.toLowerCase() !== account?.toLowerCase());
            setRecipients(filtered);
        } catch (err) {
            console.error('Failed to fetch recipients:', err);
            setError('Could not load verified participants.');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiate = async () => {
        if (!selectedRecipient || !signer || !contracts) return;

        setLoading(true);
        setError(null);

        try {
            // ========== STEP 1: VERIFY CONTRACT CONNECTION ==========
            const contract = contracts.supplyChainNFT;
            if (!contract) {
                throw new Error("Contract not loaded. Please reconnect your wallet.");
            }
            console.log("CONNECTED CONTRACT:", contract.target);
            console.log("SIGNER ADDRESS:", account);
            console.log("EXPECTED CONTRACT: 0x313E14f51FEe170D19C3DCE9eFb03709E916510d");

            // Validate ownership before call
            if (!product.currentOwner || account.toLowerCase() !== product.currentOwner.toLowerCase()) {
                throw new Error("Unauthorized: Connected wallet is not the owner of this product");
            }

            let onChainOwner;
            try {
                onChainOwner = await contract.ownerOf(product.tokenId);
                console.log("ON-CHAIN OWNER:", onChainOwner);
            } catch (verifErr) {
                console.error("On-chain verification failed:", verifErr);
                throw new Error("Blockchain verification failed: This product may not exist on the current network.");
            }

            if (onChainOwner.toLowerCase() !== account.toLowerCase()) {
                throw new Error(`Unauthorized: You are not the on-chain owner. Current owner: ${onChainOwner.slice(0,6)}...${onChainOwner.slice(-4)}`);
            }

            // ========== STEP 2: EXECUTE SMART CONTRACT TRANSFER ==========
            const location = selectedRecipient.location?.city || "Unknown";
            const notes = `Transferred to ${selectedRecipient.name}`;
            
            let tx;
            console.log("MetaMask Triggered");
            console.log(`TRANSFER: tokenId=${product.tokenId}, recipient=${selectedRecipient.walletAddress}, role=${nextRole}`);

            if (nextRole === 'DISTRIBUTOR') {
                tx = await contract["transferToDistributor(uint256,address)"](
                    product.tokenId,
                    selectedRecipient.walletAddress
                );
            } else if (nextRole === 'RETAILER') {
                tx = await contract["transferToRetailer(uint256,address)"](
                    product.tokenId,
                    selectedRecipient.walletAddress
                );
            } else if (nextRole === 'CONSUMER') {
                tx = await contract.markAsSold(
                    product.tokenId
                );
            } else {
                throw new Error("Invalid transfer stage.");
            }

            console.log("TX SUBMITTED:", tx.hash);
            console.log("⏳ Waiting for confirmation...");
            const receipt = await tx.wait();
            console.log("TX SUCCESS:", tx.hash);
            console.log("BLOCK:", receipt.blockNumber);
            console.log("GAS USED:", receipt.gasUsed?.toString());

            // Log emitted events from receipt
            if (receipt.logs && receipt.logs.length > 0) {
                console.log(`EVENTS EMITTED: ${receipt.logs.length} log(s)`);
                receipt.logs.forEach((log, i) => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        if (parsed) {
                            console.log(`  EVENT[${i}]: ${parsed.name}`, parsed.args);
                        }
                    } catch (e) { /* skip unparseable logs */ }
                });
            }

            // ========== POST-TRANSACTION: Update backend ==========
            const nextStage = nextRole === 'DISTRIBUTOR' ? 'InDistribution' : nextRole === 'RETAILER' ? 'InRetail' : 'Sold';
            
            await axios.post(`${API_URL}/products/${product.productId}/checkpoints`, {
                timestamp: new Date(),
                location: selectedRecipient.location || { address: 'Unknown', city: 'Unknown', country: 'Unknown' },
                stage: nextStage,
                handler: selectedRecipient.walletAddress,
                handlerName: selectedRecipient.name,
                handlerEmail: selectedRecipient.email,
                notes: 'Transferred custody on-chain',
                transactionHash: tx.hash
            });

            setStep(3); // Success UI
            if (onTransferInitiated) onTransferInitiated();

        } catch (err) {
            // ========== STEP 3: CATEGORIZED ERROR HANDLING ==========
            console.error("TRANSFER ERROR:", err);

            let userMessage;
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                userMessage = "Transaction rejected by user in MetaMask.";
            } else if (err.code === 'CALL_EXCEPTION') {
                userMessage = `Transaction failed on-chain: ${err.reason || err.message}`;
            } else if (err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR') {
                userMessage = "Network error. Please check your connection and try again.";
            } else if (err.code === 'INSUFFICIENT_FUNDS') {
                userMessage = "Insufficient ETH for gas fees.";
            } else {
                userMessage = err?.reason || err.message || 'Failed to execute transfer.';
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };


    const getNextStageName = (stage) => {
        const stages = ['Manufactured', 'InDistribution', 'InRetail', 'Sold'];
        const idx = stages.indexOf(stage);
        return idx !== -1 && idx < stages.length - 1 ? stages[idx + 1] : stage;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
                    <div>
                        <h3 className="text-xl font-bold text-white">Initiate Transfer</h3>
                        <p className="text-xs text-slate-400 mt-1">Product: {product?.name} (#{product?.tokenId})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-300">
                                Select Verified {nextRole?.charAt(0) + nextRole?.slice(1).toLowerCase()}
                            </label>
                            
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-sm text-slate-500">Loading participants...</p>
                                </div>
                            ) : error ? (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {recipients.length > 0 ? (
                                        recipients.map((user) => (
                                            <button
                                                key={user.walletAddress}
                                                onClick={() => setSelectedRecipient(user)}
                                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group
                                                    ${selectedRecipient?.walletAddress === user.walletAddress 
                                                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                                            >
                                                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors
                                                    ${selectedRecipient?.walletAddress === user.walletAddress 
                                                        ? 'bg-indigo-500 text-white' 
                                                        : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{user.company} • {user.walletAddress.slice(0,6)}...{user.walletAddress.slice(-4)}</p>
                                                </div>
                                                {selectedRecipient?.walletAddress === user.walletAddress && (
                                                    <motion.div layoutId="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-slate-500 text-sm">No verified participants found for this stage.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                disabled={!selectedRecipient || loading}
                                onClick={() => setStep(2)}
                                className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Transfer Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Product</span>
                                        <span className="text-white font-medium">{product.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Token ID</span>
                                        <span className="text-white font-medium">#{product.tokenId}</span>
                                    </div>
                                    <div className="h-px bg-slate-700 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Recipient</span>
                                        <span className="text-indigo-400 font-bold">{selectedRecipient.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Role</span>
                                        <span className="text-slate-200 text-xs px-2 py-0.5 bg-slate-700 rounded-lg">{nextRole}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-200/80 leading-relaxed">
                                    By confirming, your wallet will prompt an Ethereum transaction to permanently transfer the custody of this product to the recipient directly on-chain.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleInitiate}
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Confirm & Sign
                                </button>
                            </div>
                            {error && <p className="text-center text-red-500 text-xs mt-2">{error}</p>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Transfer Completed!</h3>
                                <p className="text-emerald-400 mt-2 mb-1 font-semibold text-sm px-6">
                                    Transaction confirmed successfully.
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed px-6">
                                    The blockchain transaction has been finalized. The product has been securely transferred to {selectedRecipient.name}.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                            >
                                Close & Refresh Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TransferModal;
