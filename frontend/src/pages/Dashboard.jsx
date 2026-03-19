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

            // Derive stats from the SAME product list (single source of truth)
            const ownedProducts = filteredProducts.length;
            const productsManufactured = filteredProducts.filter(p => {
                const mfgWallet = typeof p.manufacturer === 'object'
                    ? (p.manufacturer?.walletAddress || '').toLowerCase()
                    : '';
                return mfgWallet === activeWallet;
            }).length;

            // Count transfers from checkpoints
            let transfersIn = 0;
            let transfersOut = 0;
            fetchedProducts.forEach(p => {
                if (p.checkpoints && p.checkpoints.length > 0) {
                    p.checkpoints.forEach(cp => {
                        if (cp.handler && cp.handler.toLowerCase() === activeWallet && cp.stage !== 'Manufactured') {
                            transfersIn++;
                        }
                    });
                }
            });

            // Get outgoing transfers count from Transfer collection
            try {
                const outRes = await fetch(`${API_URL}/api/transfers/outgoing/${activeWallet}`);
                if (outRes.ok) {
                    const outData = await outRes.json();
                    transfersOut = outData.length;
                }
            } catch (_) { /* non-critical */ }

            setStats({
                ownedProducts,
                productsManufactured,
                transfersIn,
                transfersOut
            });

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

        return {
            id: p._id,
            tokenId: p.productId,
            productId: p.productId,
            name: p.name || p.productId,
            description: p.description || `Batch: ${p.batchNumber}`,
            manufacturer: p.manufacturer || 'Unknown',
            currentOwner: p.currentOwnerName || p.owner || 'Unknown',
            currentOwnerWallet: (p.currentOwner || '').toLowerCase(),
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
        <div className="min-h-screen pt-4 pb-12">
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
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                Dashboard
                            </h1>
                            <p className="text-gray-400">
                                Welcome back, {user?.name || user?.email || 'User'}!
                            </p>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-3">
                            {(user?.roles || [user?.role]).map((role, idx) => (
                                <div key={idx} className={`px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30`}>
                                    <span className={`text-sm font-medium text-indigo-400`}>
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

                {/* Products Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-3"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Your Products</h2>
                            {products.length > 0 && (
                                <Link to="/scan" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                                    Scan Product <ChevronRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>

                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((product, index) => (
                                    <ProductCard 
                                        key={product._id || index} 
                                        product={mapProduct(product)} 
                                        index={index}
                                        currentUserWallet={(user?.walletAddress || user?.wallet || '').toLowerCase()}
                                        onTransfer={() => handleOpenTransfer(mapProduct(product))}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-gray-400 mb-4">No products found.</p>
                                <div className="flex justify-center gap-4">
                                    {(user?.role === 'MANUFACTURER' || user?.role === 'ADMIN') && (
                                        <Link to="/create-product" className="px-4 py-2 bg-indigo-500 rounded-lg text-white font-medium hover:bg-indigo-600 transition-colors">
                                            Create Product
                                        </Link>
                                    )}
                                    <Link to="/scan" className="px-4 py-2 bg-white/10 rounded-lg text-white font-medium hover:bg-white/20 transition-colors">
                                        Scan Product
                                    </Link>
                                </div>
                            </div>
                        )}
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
