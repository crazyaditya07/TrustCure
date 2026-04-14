import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import logo from '/STDN.png';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { account, isConnected, userRoles, connectWallet, disconnectWallet, loading: walletLoading } = useWeb3();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleConnectWallet = async () => {
        await connectWallet();
    };

    const handleDisconnectWallet = () => {
        disconnectWallet();
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', requiresAuth: true },
        { path: '/scan', label: 'Scan Product', requiresAuth: false },
        { path: '/create-product', label: 'Create Product', roles: ['ADMIN', 'MANUFACTURER'] },
        { path: '/manage-users', label: 'Manage Users', roles: ['ADMIN'] },
    ];

    const canAccessLink = (link) => {
        if (!link.requiresAuth && !link.roles) return true;
        if (!isAuthenticated && !isConnected) return false;
        if (!link.roles) return true;

        // Check roles from both auth sources
        const authRoles = user?.roles || [user?.role] || [];
        const allRoles = [...new Set([...authRoles, ...userRoles])];
        return link.roles.some(role => allRoles.includes(role));
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <Link to="/" className="navbar-brand">
                    <img
                        src={logo}
                        alt="TrustCure Logo"
                        style={{
                            height: '40px',
                            width: 'auto',
                            filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))'
                        }}
                    />
                    <span className="navbar-brand-text">TrustCure</span>
                </Link>

                <div className="navbar-nav">
                    {navLinks.map((link) => {
                        if (!canAccessLink(link)) return null;

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    {/* Wallet Connection Button */}
                    {isConnected ? (
                        <div className="wallet-connected" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            padding: '6px 12px',
                            background: 'var(--glass-bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--accent-emerald)'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--accent-emerald)',
                                animation: 'pulse 2s infinite'
                            }}></span>
                            <span style={{
                                fontFamily: 'monospace',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-primary)'
                            }}>
                                {formatAddress(account)}
                            </span>
                            <button
                                onClick={handleDisconnectWallet}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    fontSize: '14px'
                                }}
                                title="Disconnect Wallet"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleConnectWallet}
                            disabled={walletLoading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderColor: 'var(--accent-purple)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            🦊 {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}

                    {/* Divider */}
                    {(isAuthenticated || isConnected) && (
                        <div style={{
                            width: '1px',
                            height: '24px',
                            background: 'var(--border-subtle)'
                        }}></div>
                    )}

                    {/* User Auth Section */}
                    {isAuthenticated ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                            <div className="user-info-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span className="user-name" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {user?.name || 'User'}
                                </span>
                                <span className="user-role" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                    {user?.role || 'CONSUMER'}
                                </span>
                            </div>

                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleLogout}
                                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                            <Link to="/login">
                                <button className="btn btn-secondary btn-sm">
                                    Login
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="btn btn-primary btn-sm">
                                    Sign Up
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
