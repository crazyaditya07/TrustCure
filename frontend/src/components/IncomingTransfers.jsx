import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowRight, Check, X, Clock, User, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useWeb3 } from '../contexts/Web3Context';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const IncomingTransfers = ({ onUpdate }) => {
    const { account } = useWeb3();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (account) {
            fetchIncomingTransfers();
        }
    }, [account]);

    const fetchIncomingTransfers = async () => {
        try {
            const response = await axios.get(`${API_URL}/transfers/incoming/${account}`);
            setTransfers(response.data);
        } catch (err) {
            console.error('Failed to fetch incoming transfers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        setProcessingId(id);
        try {
            await axios.patch(`${API_URL}/transfers/${id}/${action}`);
            // Remove from list
            setTransfers(prev => prev.filter(t => t._id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(`Failed to ${action} transfer:`, err);
            alert(`Failed to ${action} transfer. Please try again.`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return null;
    if (transfers.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Incoming Products</h2>
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {transfers.length}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {transfers.map((transfer) => (
                        <motion.div
                            key={transfer._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 group relative overflow-hidden"
                        >
                            {/* Decorative background */}
                            <div className="absolute top-0 right-0 p-8 bg-indigo-500/5 rounded-full -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-colors"></div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-slate-800 rounded-2xl">
                                        <Package className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                        <Clock className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending Receipt</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase truncate">
                                        {transfer.productId}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1">Token ID: #{transfer.tokenId}</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-slate-700 rounded-lg text-slate-400">
                                            <User className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Sender</p>
                                            <p className="text-xs text-slate-200 truncate">{transfer.fromWallet}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">{transfer.currentStage}</span>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-slate-600" />
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-pulse"></div>
                                            <span className="text-[10px] text-indigo-400 uppercase font-bold">{transfer.nextStage}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => handleAction(transfer._id, 'confirm')}
                                        disabled={processingId === transfer._id}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                    >
                                        {processingId === transfer._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        <span className="text-sm">Confirm Receipt</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(transfer._id, 'reject')}
                                        disabled={processingId === transfer._id}
                                        className="p-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-500 text-slate-400 font-bold rounded-xl transition-all border border-slate-700 hover:border-red-500/30"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default IncomingTransfers;
