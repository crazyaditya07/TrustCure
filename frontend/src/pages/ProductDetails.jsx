import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ProductJourney from '../components/ProductJourney';
import LocationMap from '../components/Map/LocationMap';
import QRCode from 'qrcode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductDetails() {
    const { productId } = useParams();
    const { account, userRoles: walletRoles, isConnected } = useWeb3();
    const { user, isAuthenticated } = useAuth();
    const { subscribeToProduct } = useNotifications();

    // Combine roles from wallet and auth context
    const userRoles = isConnected ? walletRoles : (user?.roles || ['CONSUMER']);
    const userAddress = account || user?.email || '';

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [activeTab, setActiveTab] = useState('timeline');

    useEffect(() => {
        fetchProduct();
        if (productId) {
            subscribeToProduct(productId);
        }
    }, [productId]);

    useEffect(() => {
        if (product) {
            generateQRCode();
        }
    }, [product]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                userRoles: userRoles.join(','),
                userAddress: userAddress
            });

            const response = await fetch(
                `${API_URL}/api/products/${productId}?${params}`
            );

            if (!response.ok) {
                throw new Error('Product not found');
            }

            const data = await response.json();
            setProduct(data);
        } catch (err) {
            console.error('Failed to fetch product:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async () => {
        try {
            const url = `${window.location.origin}/product/${productId}`;
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#1a1a2e',
                    light: '#ffffff'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Failed to generate QR code:', err);
        }
    };

    const getVerificationStatus = () => {
        if (!product) return null;

        const hasHistory = product.checkpoints && product.checkpoints.length > 0;
        const isComplete = product.currentStage === 'Sold';

        return {
            verified: hasHistory,
            complete: isComplete,
            stages: product.checkpoints?.length || 0
        };
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    /**
     * Map string stage from API to integer ID for visualization
     * Manufactured -> 0
     * InDistribution -> 1
     * InRetail -> 2
     * Sold -> 3
     */
    const mapStageToIndex = (stage) => {
        const s = stage?.toLowerCase() || '';
        if (s.includes('manufactured')) return 0;
        if (s.includes('distribution')) return 1;
        if (s.includes('retail')) return 2;
        if (s.includes('sold')) return 3;
        return 0; // Fallback
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3 className="empty-state-title">Product Not Found</h3>
                <p className="empty-state-description">{error}</p>
                <Link to="/scan" className="btn btn-primary">
                    Try Scanning Again
                </Link>
            </div>
        );
    }

    const verification = getVerificationStatus();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header">
                <Link
                    to="/dashboard"
                    style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        display: 'inline-block'
                    }}
                >
                    ← Back to Dashboard
                </Link>
                <h1 className="page-title">{product?.name || productId}</h1>
                <p className="page-subtitle">Product ID: {productId}</p>
            </div>

            {/* Verification Banner */}
            <div
                className="card"
                style={{
                    marginBottom: 'var(--spacing-6)',
                    background: verification?.verified
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
                    borderColor: verification?.verified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: verification?.verified ? 'var(--accent-emerald)' : 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                    }}>
                        {verification?.verified ? '✓' : '✕'}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, marginBottom: '4px' }}>
                            {verification?.verified ? 'Verified Product' : 'Unverified Product'}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            {verification?.verified
                                ? `This product has ${verification.stages} verified checkpoints on the blockchain`
                                : 'This product could not be verified on the blockchain'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Info Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: 'var(--spacing-6)',
                marginBottom: 'var(--spacing-6)'
            }}>
                {/* Main Info */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Product Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px', fontSize: 'var(--font-size-sm)' }}>
                                Product ID
                            </p>
                            <p style={{ margin: 0, fontFamily: 'monospace' }}>{productId}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px', fontSize: 'var(--font-size-sm)' }}>
                                Token ID
                            </p>
                            <p style={{ margin: 0 }}>{product?.tokenId || 'N/A'}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px', fontSize: 'var(--font-size-sm)' }}>
                                Current Stage
                            </p>
                            <span className={`stage-badge ${product?.currentStage?.toLowerCase().replace('in', 'in-')}`}>
                                {product?.currentStage}
                            </span>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px', fontSize: 'var(--font-size-sm)' }}>
                                Total Checkpoints
                            </p>
                            <p style={{ margin: 0 }}>{product?.checkpoints?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>QR Code</h3>
                    {qrCodeUrl ? (
                        <div>
                            <img
                                src={qrCodeUrl}
                                alt="Product QR Code"
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '8px',
                                    margin: '0 auto'
                                }}
                            />
                            <p style={{
                                color: 'var(--text-tertiary)',
                                fontSize: 'var(--font-size-sm)',
                                marginTop: '8px'
                            }}>
                                Scan to verify
                            </p>
                        </div>
                    ) : (
                        <div className="skeleton" style={{ width: '150px', height: '150px', margin: '0 auto' }} />
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: 'var(--spacing-6)',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px'
            }}>
                <button
                    className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    📋 Timeline
                </button>
                <button
                    className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('map')}
                >
                    🗺️ Map
                </button>
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'timeline' && (
                    <div className="py-2">
                        <ProductJourney 
                            currentStage={mapStageToIndex(product?.currentStage)} 
                            checkpoints={product?.checkpoints || []}
                            isLoading={loading}
                        />
                    </div>
                )}

                {activeTab === 'map' && (
                    <div>
                        <h3 style={{ marginBottom: 'var(--spacing-6)' }}>Location Map</h3>
                        <LocationMap checkpoints={product?.checkpoints || []} />
                    </div>
                )}
            </div>

            {/* Access Notice */}
            {!isConnected && !isAuthenticated && (
                <div
                    className="card"
                    style={{
                        marginTop: 'var(--spacing-6)',
                        textAlign: 'center',
                        background: 'var(--glass-bg)'
                    }}
                >
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        🔐 Log in or connect your wallet to see the full product history based on your role.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ProductDetails;
