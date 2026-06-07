import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Package,
    CheckCircle2,
    ArrowRightLeft,
    Users,
    Box,
    ChevronRight,
    Activity
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { useTransferCustody } from '../hooks/useTransferCustody';
import IncomingTransfers from '../components/IncomingTransfers';
import TransferModal from '../components/TransferModal';
import ActionHistory from '../components/ActionHistory';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Truncate a wallet address for display: 0x3f12...858e
const truncateWallet = (w) => (w && w.length > 10) ? `${w.slice(0, 6)}…${w.slice(-4)}` : (w || '');

const Dashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { account, isConnected } = useWeb3();
    const { executeTransfer } = useTransferCustody();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [actions, setActions] = useState([]);
    const [actionsLoading, setActionsLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    // Fetch Logic
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchDashboardData();
            
            // Setup socket
            const newSocket = io(API_URL.replace('/api', ''));
            const walletAddress = user.walletAddress || user.wallet;
            if (walletAddress) {
                newSocket.emit('join', walletAddress.toLowerCase());
            }
            setSocket(newSocket);

            return () => newSocket.disconnect();
        }
    }, [isAuthenticated, user]);

    // Handle incoming confirmed transfers for auto-execution
    useEffect(() => {
        if (socket && account) {
            socket.on('transferConfirmed', async (transfer) => {
                console.log('🔔 Transfer confirmed by receiver! Executing on-chain...', transfer);
                try {
                    await executeTransfer(
                        transfer._id,
                        transfer.tokenId,
                        transfer.toWallet,
                        // Could add location hash here if needed
                    );
                    console.log('✅ On-chain transfer successful');
                    fetchDashboardData(); // Refresh to show processing state
                } catch (err) {
                    console.error('Failed to auto-execute transfer:', err);
                }
            });

            socket.on('transferIncoming', () => fetchDashboardData());
            socket.on('transferRejected', () => fetchDashboardData());
            socket.on('transferExpired', () => fetchDashboardData());
            socket.on('productTransferred', () => fetchDashboardData());

            return () => {
                socket.off('transferConfirmed');
                socket.off('transferIncoming');
                socket.off('transferRejected');
                socket.off('transferExpired');
                socket.off('productTransferred');
            };
        }
    }, [socket, account, executeTransfer]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // FORCE REAL WALLET (Bypass potential state/dummy delays)
            let wallet = account;
            if (!wallet && window.ethereum) {
                try {
                    const tempProvider = new ethers.BrowserProvider(window.ethereum);
                    const tempSigner = await tempProvider.getSigner();
                    wallet = await tempSigner.getAddress();
                } catch (e) {
                    console.log("Could not force wallet fetch:", e.message);
                }
            }
            
            // Final active wallet for API (lowercase for safety)
            const activeWallet = (wallet || user?.walletAddress || '').toLowerCase();
            

            let fetchedProducts = [];

            if (activeWallet && activeWallet !== '0x1111111111111111111111111111111111111111') {
                const productsResponse = await fetch(`${API_URL}/api/owner/${activeWallet}/products`);
                if (productsResponse.ok) {
                    fetchedProducts = await productsResponse.json();
                }
            } else {
                // Email only fallback
                const productsResponse = await fetch(`${API_URL}/api/products?limit=20`);
                if (productsResponse.ok) {
                    const data = await productsResponse.json();
                    fetchedProducts = data.products || [];
                }
            }

            // Filter products: 
            // 1. Direct ownership
            // 2. OR if Retailer: show products they marked as SOLD
            const filteredProducts = fetchedProducts.filter((p) => {
                const roles = (user?.roles || [user?.role || '']).filter(Boolean);
                const isDirectOwner = p.currentOwner?.toLowerCase() === activeWallet.toLowerCase();
                const isSoldByMe = p.currentStage === 'Sold' && 
                                  roles.includes('RETAILER') &&
                                  (p.retailer_id === user?._id || p.currentOwnerName === user?.name);
                
                return isDirectOwner || isSoldByMe;
            });
            setProducts(filteredProducts);

            // Fetch unified stats reliably from Event timeline and Product queries via API
            try {
                const [statsRes, actionsRes] = await Promise.all([
                    fetch(`${API_URL}/api/stats/${activeWallet}`),
                    fetch(`${API_URL}/api/actions/${activeWallet}`)
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }
                
                if (actionsRes.ok) {
                    const actionsData = await actionsRes.json();
                    setActions(actionsData);
                }
            } catch (_) { 
                 // Fallback
            }

        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Helper to map product data to ProductCard props
    const mapProduct = (p) => {
        const stageMap = {
            'Manufactured': 'manufactured',
            'InDistribution': 'at_distributor',
            'InRetail': 'at_retailer',
            'Sold': 'sold'
        };

        // Build a human-readable owner display — never show 'Unknown'
        const ownerWallet = (p.currentOwner || '').toLowerCase();
        const ownerDisplay = p.currentOwnerName && p.currentOwnerName !== 'Unknown'
            ? p.currentOwnerName
            : truncateWallet(ownerWallet);

        return {
            id: p._id,
            tokenId: p.productId,
            productId: p.productId,
            name: p.name || p.productId,
            description: p.description || `Batch: ${p.batchNumber}`,
            manufacturer: p.manufacturer || 'Unknown',
            currentOwner: ownerDisplay || 'N/A',
            currentOwnerWallet: ownerWallet,
            createdAt: p.timestamp || new Date().toISOString(),
            status: stageMap[p.currentStage] || 'manufactured',
            transferStatus: p.transferStatus,
            pendingTransferId: p.pendingTransferId,
            raw: p
        };
    };

    const handleOpenTransfer = (product) => {
        setSelectedProduct(product.raw);
        setIsTransferModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-6 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)' }} className="mb-1 tracking-tight">
                                Dashboard
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Welcome back, <span className="text-gray-400 font-medium">{user?.name || user?.email || 'User'}</span>
                                {account && <span className="ml-2" style={{ color: '#4A4A40', fontSize: '12px', fontFamily: 'monospace' }}>({truncateWallet(account)})</span>}
                            </p>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-2">
                            {(user?.roles || [user?.role]).filter(Boolean).map((role, idx) => (
                                <div key={idx} style={{ background: '#252525', border: '1px solid #2E2E2A', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#7A7A6A' }}>
                                    <span style={{ textTransform: 'none', fontSize: '13px', fontWeight: 600, color: '#EDEADE' }}>
                                        {role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <DashboardCard
                        title="In Inventory"
                        value={stats?.ownedProducts || 0}
                        subtitle="Items currently with you"
                        icon={Package}
                        color="indigo"
                        delay={0}
                    />
                    <DashboardCard
                        title={
                            user?.role === 'MANUFACTURER' ? 'Total Manufactured' :
                            user?.role === 'DISTRIBUTOR' ? 'Total Received' :
                            user?.role === 'RETAILER' ? 'Stock Received' : 'Total Interactions'
                        }
                        value={stats?.primaryMetric || 0}
                        subtitle="Blockchain history"
                        icon={Box}
                        color="emerald"
                        delay={0.1}
                    />
                    <DashboardCard
                        title={
                            user?.role === 'MANUFACTURER' ? 'Sent to Distribution' :
                            user?.role === 'DISTRIBUTOR' ? 'Sent to Retailers' :
                            user?.role === 'RETAILER' ? 'Total Sold' : 'Transfers'
                        }
                        value={stats?.secondaryMetric || 0}
                        subtitle="Lifecycle status"
                        icon={ArrowRightLeft}
                        color="purple"
                        delay={0.2}
                    />
                    <DashboardCard
                        title="Active Role"
                        value={user?.role || 'Guest'}
                        subtitle="Current profile"
                        icon={Users}
                        color="orange"
                        delay={0.3}
                    />
                </div>

                {/* Products + Incoming Transfers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Products Panel - spans 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-2"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold text-white tracking-tight">Your Products</h2>
                            {products.length > 0 && (
                                <Link to="/scan" className="text-[var(--accent-teal-lt)] hover:text-[var(--accent-teal)] text-xs font-[600] flex items-center gap-1 transition-colors" style={{ textDecoration: 'none' }}>
                                    Scan Product <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>

                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {products.map((product, index) => (
                                    <ProductCard 
                                        key={product._id || index} 
                                        product={mapProduct(product)} 
                                        index={index}
                                        currentUserWallet={(account || user?.walletAddress || user?.wallet || '').toLowerCase()}
                                        onTransfer={() => handleOpenTransfer(mapProduct(product))}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white/[0.03] rounded-2xl border border-white/8">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-6 h-6 text-gray-600" />
                                </div>
                                <p className="text-gray-500 text-sm mb-5">No products found in your inventory.</p>
                                <div className="flex justify-center gap-3">
                                    {(user?.role === 'MANUFACTURER' || user?.role === 'ADMIN') && (
                                        <Link to="/create-product" style={{ background: '#3A6A5A', borderRadius: '6px', padding: '8px 16px', color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                                            Create Product
                                        </Link>
                                    )}
                                    <Link to="/scan" className="px-4 py-2 bg-transparent border border-[var(--border-warm)] rounded-[6px] text-[var(--accent-teal-lt)] text-sm font-[600] hover:bg-[var(--bg-raised)] transition-all" style={{ textDecoration: 'none' }}>
                                        Scan Product
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Sidebar Panel - right column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="lg:col-span-1 space-y-8"
                    >
                        {/* Incoming Transfers */}
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-white tracking-tight">Incoming Transfers</h2>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5A9A70' }} />
                            </div>
                            <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
                                <IncomingTransfers />
                            </div>
                        </div>

                        {/* Recent Actions */}
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-white tracking-tight">Recent Actions</h2>
                                <Activity className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
                                <ActionHistory actions={actions} loading={actionsLoading} />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Modals */}
                <TransferModal
                    isOpen={isTransferModalOpen}
                    onClose={() => setIsTransferModalOpen(false)}
                    product={selectedProduct}
                    onTransferInitiated={fetchDashboardData}
                />
            </div>
        </div>
    );
};

export default Dashboard;
