import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, User, ChevronRight, AlertCircle, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const TransferModal = ({ isOpen, onClose, product, onTransferInitiated }) => {
    const { account, signer, contracts } = useWeb3();
    const { user } = useAuth();

    // Is this a "Mark as Sold" action (retailer at InRetail)?
    const isMarkAsSold = product?.currentStage === 'InRetail';

    // For regular transfers: determine next role
    const getNextRole = (stage) => {
        switch (stage) {
            case 'Manufactured': return 'DISTRIBUTOR';
            case 'InDistribution': return 'RETAILER';
            default: return null;
        }
    };

    const nextRole = getNextRole(product?.currentStage);

    const [step, setStep] = useState(1); // 1: Select/Confirm, 2: Confirm & Sign, 3: Success
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedRecipient(null);
            setError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && nextRole && step === 1 && !isMarkAsSold) {
            fetchRecipients();
        }
    }, [isOpen, nextRole, step, isMarkAsSold]);

    const fetchRecipients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/users`, { params: { role: nextRole } });
            const filtered = response.data.filter(u => u.walletAddress?.toLowerCase() !== account?.toLowerCase());
            setRecipients(filtered);
        } catch (err) {
            setError('Could not load verified participants.');
        } finally {
            setLoading(false);
        }
    };

    // ── Mark as Sold (on-chain + backend) ─────────────────────────────
    const handleMarkAsSold = async () => {
        setLoading(true);
        setError(null);
        try {
            const contract = contracts?.supplyChainNFT;
            if (!contract) throw new Error('Contract not loaded. Please reconnect your wallet.');

            // Verify on-chain ownership
            const onChainOwner = await contract.ownerOf(product.tokenId);
            if (onChainOwner.toLowerCase() !== account.toLowerCase()) {
                throw new Error('Unauthorized: Connected wallet is not the on-chain owner.');
            }

            // Call markAsSold on the smart contract
            const tx = await contract.markAsSold(product.tokenId);
            console.log('TX SUBMITTED (markAsSold):', tx.hash);
            const receipt = await tx.wait();
            console.log('TX CONFIRMED:', tx.hash, '| Block:', receipt.blockNumber);

            // Sync with backend — no consumer wallet required
            await axios.post(`${API_URL}/products/${product.productId}/mark-sold`, {
                retailerWallet: account,
                retailerName: user?.name || 'Retailer',
                retailerEmail: user?.email || null,
                transactionHash: tx.hash,
                notes: 'Product marked as sold at retail point'
            });

            setStep(3);
            if (onTransferInitiated) onTransferInitiated();
        } catch (err) {
            console.error('MARK AS SOLD ERROR:', err);
            let msg;
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) msg = 'Transaction rejected by user in MetaMask.';
            else if (err.code === 'CALL_EXCEPTION') msg = `Transaction failed on-chain: ${err.reason || err.message}`;
            else if (err.code === 'INSUFFICIENT_FUNDS') msg = 'Insufficient ETH for gas fees.';
            else if (err.response?.data?.error) msg = err.response.data.error;
            else msg = err?.reason || err.message || 'Failed to mark as sold.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Regular Transfer (Manufacturer→Distributor, Distributor→Retailer) ──
    const handleTransfer = async () => {
        if (!selectedRecipient || !signer || !contracts) return;
        setLoading(true);
        setError(null);
        try {
            const contract = contracts.supplyChainNFT;
            if (!contract) throw new Error('Contract not loaded. Please reconnect your wallet.');

            if (!product.currentOwner || account.toLowerCase() !== product.currentOwner.toLowerCase()) {
                throw new Error('Unauthorized: Connected wallet is not the owner of this product');
            }

            const onChainOwner = await contract.ownerOf(product.tokenId);
            if (onChainOwner.toLowerCase() !== account.toLowerCase()) {
                throw new Error(`Unauthorized: You are not the on-chain owner.`);
            }

            let tx;
            if (nextRole === 'DISTRIBUTOR') {
                tx = await contract['transferToDistributor(uint256,address)'](product.tokenId, selectedRecipient.walletAddress);
            } else if (nextRole === 'RETAILER') {
                tx = await contract['transferToRetailer(uint256,address)'](product.tokenId, selectedRecipient.walletAddress);
            } else {
                throw new Error('Invalid transfer stage.');
            }

            console.log('TX SUBMITTED:', tx.hash);
            const receipt = await tx.wait();
            console.log('TX SUCCESS:', tx.hash, '| Block:', receipt.blockNumber);

            const nextStage = nextRole === 'DISTRIBUTOR' ? 'InDistribution' : 'InRetail';
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

            setStep(3);
            if (onTransferInitiated) onTransferInitiated();
        } catch (err) {
            console.error('TRANSFER ERROR:', err);
            let msg;
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) msg = 'Transaction rejected by user in MetaMask.';
            else if (err.code === 'CALL_EXCEPTION') msg = `Transaction failed on-chain: ${err.reason || err.message}`;
            else if (err.code === 'INSUFFICIENT_FUNDS') msg = 'Insufficient ETH for gas fees.';
            else if (err.response?.data?.error) msg = err.response.data.error;
            else msg = err?.reason || err.message || 'Failed to execute transfer.';
            setError(msg);
        } finally {
            setLoading(false);
        }
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
                        <h3 className="text-xl font-bold text-white">
                            {isMarkAsSold ? 'Mark as Sold' : 'Initiate Transfer'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Product: {product?.name} (#{product?.tokenId})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">

                    {/* ── MARK AS SOLD — Step 1: Confirm ── */}
                    {isMarkAsSold && step === 1 && (
                        <div className="space-y-5">
                            <div className="flex flex-col items-center text-center gap-3 py-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-base">Confirm Sale</p>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        This will permanently mark <span className="text-white font-medium">{product?.name}</span> as sold on the blockchain.
                                        Ownership stays with your wallet — no consumer transfer required.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Product</span>
                                    <span className="text-white font-medium">{product?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Token ID</span>
                                    <span className="text-white font-medium">#{product?.tokenId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Current Stage</span>
                                    <span className="text-cyan-400 font-medium text-xs px-2 py-0.5 bg-cyan-500/10 rounded-lg">At Retailer</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Next Stage</span>
                                    <span className="text-emerald-400 font-medium text-xs px-2 py-0.5 bg-emerald-500/10 rounded-lg">Sold ✓</span>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/80 leading-relaxed">
                                    This action is <strong>irreversible</strong>. The product will be permanently frozen on-chain at the Sold stage.
                                </p>
                            </div>

                            {error && <p className="text-center text-red-400 text-xs">{error}</p>}

                            <button
                                onClick={handleMarkAsSold}
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                                {loading ? 'Processing...' : 'Confirm & Mark as Sold'}
                            </button>
                        </div>
                    )}

                    {/* ── REGULAR TRANSFER — Step 1: Select Recipient ── */}
                    {!isMarkAsSold && step === 1 && (
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
                                        recipients.map((u) => (
                                            <button
                                                key={u.walletAddress}
                                                onClick={() => setSelectedRecipient(u)}
                                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group
                                                    ${selectedRecipient?.walletAddress === u.walletAddress
                                                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                                            >
                                                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors
                                                    ${selectedRecipient?.walletAddress === u.walletAddress
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white truncate">{u.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{u.company} • {u.walletAddress.slice(0, 6)}...{u.walletAddress.slice(-4)}</p>
                                                </div>
                                                {selectedRecipient?.walletAddress === u.walletAddress && (
                                                    <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
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

                    {/* ── REGULAR TRANSFER — Step 2: Confirm & Sign ── */}
                    {!isMarkAsSold && step === 2 && (
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
                                    <div className="h-px bg-slate-700 my-2" />
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
                                    By confirming, your wallet will prompt an Ethereum transaction to permanently transfer custody of this product on-chain.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
                                    Back
                                </button>
                                <button
                                    onClick={handleTransfer}
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

                    {/* ── Step 3: Success ── */}
                    {step === 3 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    {isMarkAsSold ? 'Product Sold!' : 'Transfer Completed!'}
                                </h3>
                                <p className="text-emerald-400 mt-2 mb-1 font-semibold text-sm px-6">
                                    Transaction confirmed successfully.
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed px-6">
                                    {isMarkAsSold
                                        ? 'The product has been permanently marked as sold on the blockchain. The lifecycle is now frozen.'
                                        : `The product has been securely transferred to ${selectedRecipient?.name}.`}
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
