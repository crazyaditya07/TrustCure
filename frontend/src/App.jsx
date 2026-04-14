import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider, useWeb3 } from './contexts/Web3Context';
import { NotificationProvider } from './contexts/NotificationContext';
// Use the new Navbar
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Use new/existing pages
// Note: We'll likely need to update these component imports if we rename or move files
// For now, assume we will update the files in place or redirect imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import ConsumerView from './pages/ConsumerView';
import ScanProduct from './pages/ScanProduct';
import ManageUsers from './pages/ManageUsers';
import CreateProduct from './pages/CreateProduct';

import { AnimatePresence, motion } from 'framer-motion';

// Protected Route Component (unchanged)
function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, user, loading } = useAuth();
    const { account, isConnected } = useWeb3();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen bg-trustcure-darker">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && user) {
        const userRoles = user.roles || [user.role];
        if (!allowedRoles.some(role => userRoles.includes(role))) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Role-to-Wallet Strict Checking
    if (isConnected && account && user && user.walletAddress) {
        if (account.toLowerCase() !== user.walletAddress.toLowerCase()) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
                    <div className="bg-red-900/40 border border-red-500 rounded-lg p-8 max-w-lg shadow-2xl backdrop-blur-sm">
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-500/20 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Wallet Mismatch Detected</h2>
                        <p className="text-gray-200 text-lg mb-4">
                            Your logged-in profile dictates you use the following wallet for this role:
                            <br />
                            <span className="font-mono text-cyan-400 font-semibold block mt-2 text-sm">{user.walletAddress}</span>
                        </p>
                        <p className="text-gray-400">
                            Connected Wallet:<br/>
                            <span className="font-mono block mt-1 text-xs">{account}</span>
                        </p>
                        <div className="mt-8 pt-6 border-t border-red-500/30">
                            <p className="text-gray-300">
                                Please open MetaMask and switch to the assigned wallet address to continue using the application.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return children;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
        },
    },
}

const AnimatedPage = ({ children }) => (
    <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen pt-20" // Add padding top for fixed navbar
    >
        {children}
    </motion.div>
)

/**
 * ProductRouteGuard
 *
 * Decides whether /product/:productId renders the full internal ProductDetails
 * (for privileged roles) or the consumer-facing ConsumerView.
 *
 * Detection uses ROLE-BASED logic (not auth/wallet presence):
 *   - If the user has any privileged role → show ProductDetails
 *   - Otherwise (CONSUMER or no role) → show ConsumerView
 *
 * This handles the case where consumers may also have wallets connected.
 */
const PRIVILEGED_ROLES = ['MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'ADMIN'];

function ProductRouteGuard() {
    const { userRoles: walletRoles, isConnected } = useWeb3();
    const { user } = useAuth();

    // Resolve roles from wallet or auth — same pattern as ProductDetails.jsx
    const userRoles = isConnected ? walletRoles : (user?.roles || ['CONSUMER']);
    const isPrivileged = userRoles.some(r => PRIVILEGED_ROLES.includes(r));

    return isPrivileged ? <ProductDetails /> : <ConsumerView />;
}

function AppContent() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-trustcure-darker relative overflow-x-hidden font-sans text-gray-100">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] top-0 left-1/4 animate-pulse-glow" />
                <div className="absolute w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] bottom-1/4 right-0" />
                <div className="absolute w-64 h-64 bg-cyan-600/20 rounded-full blur-[100px] top-1/2 left-0" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-grow">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
                            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
                            <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <AnimatedPage><Dashboard /></AnimatedPage>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/product/:productId"
                                element={
                                    <AnimatedPage>
                                        <ProductRouteGuard />
                                    </AnimatedPage>
                                }
                            />
                            {/* Public consumer verification route */}
                            <Route
                                path="/verify/:productId"
                                element={<AnimatedPage><ConsumerView /></AnimatedPage>}
                            />
                            <Route
                                path="/scan"
                                element={<AnimatedPage><ScanProduct /></AnimatedPage>}
                            />
                            <Route
                                path="/create-product"
                                element={
                                    <ProtectedRoute allowedRoles={['MANUFACTURER', 'ADMIN']}>
                                        <AnimatedPage><CreateProduct /></AnimatedPage>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manage-users"
                                element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                        <AnimatedPage><ManageUsers /></AnimatedPage>
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AnimatePresence>
                </main>

                <Footer />
            </div>
        </div>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Web3Provider>
                <AuthProvider>
                    <NotificationProvider>
                        <AppContent />
                    </NotificationProvider>
                </AuthProvider>
            </Web3Provider>
        </Router>
    );
}

export default App;
