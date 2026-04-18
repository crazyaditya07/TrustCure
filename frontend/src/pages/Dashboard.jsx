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
    const { isConnected, account } = useWeb3();
    const { executeTransfer } = useTransferCustody();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
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
            
            console.log("REAL WALLET:", activeWallet);
            console.log("FETCHING PRODUCTS FOR:", activeWallet);
            
            let fetchedProducts = [];

            if (activeWallet && activeWallet !== '0x1111111111111111111111111111111111111111') {
                const productsResponse = await fetch(`${API_URL}/api/owner/${activeWallet}/products`);
                if (productsResponse.ok) {
                    fetchedProducts = await productsResponse.json();
                    console.log("ALL PRODUCTS FROM API:", fetchedProducts);
                }
            } else {
                // Email only fallback
                const productsResponse = await fetch(`${API_URL}/api/products?limit=20`);
                if (productsResponse.ok) {
                    const data = await productsResponse.json();
                    fetchedProducts = data.products || [];
                    console.log("DASHBOARD: FETCHED PUBLIC PRODUCTS:", fetchedProducts);
                }
            }

            // Filter products to double-check ownership on frontend
            const filteredProducts = fetchedProducts.filter(
                (p) => p.currentOwner?.toLowerCase() === activeWallet.toLowerCase()
            );
            console.log("FILTERED PRODUCTS:", filteredProducts);

            setProducts(filteredProducts);
            console.log("DASHBOARD: STATE UPDATED WITH", filteredProducts.length, "PRODUCTS");

            // Fetch unified stats reliably from Event timeline and Product queries via API
            try {
                const statsRes = await fetch(`${API_URL}/api/stats/${activeWallet}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats({
                        ownedProducts: statsData.ownedProducts || 0,
                        productsManufactured: statsData.productsManufactured || 0,
                        transfersIn: statsData.transfersIn || 0,
                        transfersOut: statsData.transfersOut || 0
                    });
                } else {
                    setStats({ ownedProducts: filteredProducts.length, productsManufactured: 0, transfersIn: 0, transfersOut: 0 });
                }
            } catch (_) { 
                 setStats({ ownedProducts: filteredProducts.length, productsManufactured: 0, transfersIn: 0, transfersOut: 0 });
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
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">
                                Dashboard
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Welcome back, <span className="text-gray-400 font-medium">{user?.name || user?.email || 'User'}</span>
                                {account && <span className="ml-2 text-gray-600 font-mono text-xs">({truncateWallet(account)})</span>}
                            </p>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-2">
                            {(user?.roles || [user?.role]).filter(Boolean).map((role, idx) => (
                                <div key={idx} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
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
                        title="Owned Products"
                        value={stats?.ownedProducts || 0}
                        subtitle="In your possession"
                        icon={Package}
                        color="indigo"
                        delay={0}
                    />
                    <DashboardCard
                        title="Manufactured"
                        value={stats?.productsManufactured || 0}
                        subtitle="Total created"
                        icon={Box}
                        color="green"
                        delay={0.1}
                    />
                    <DashboardCard
                        title="Transfers In"
                        value={stats?.transfersIn || 0}
                        subtitle="Received"
                        icon={ArrowRightLeft}
                        color="purple"
                        delay={0.2}
                    />
                    <DashboardCard
                        title="Transfers Out"
                        value={stats?.transfersOut || 0}
                        subtitle="Sent"
                        icon={ArrowRightLeft}
                        color="cyan"
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
                                <Link to="/scan" className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1 transition-colors">
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
                                        <Link to="/create-product" className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all">
                                            Create Product
                                        </Link>
                                    )}
                                    <Link to="/scan" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition-all">
                                        Scan Product
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Incoming Transfers Panel - right column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="lg:col-span-1"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold text-white tracking-tight">Incoming Transfers</h2>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        </div>
                        <div className="rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden">
                            <IncomingTransfers />
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
