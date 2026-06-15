import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Check, ArrowRightLeft } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ProductJourney from '../components/ProductJourney';
import LocationMap from '../components/Map/LocationMap';
import QRCode from 'qrcode';
import TransferModal from '../components/TransferModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductDetails() {
    const { productId } = useParams();
    const { account, userRoles: walletRoles, isConnected } = useWeb3();
    const { user, isAuthenticated } = useAuth();
    const { subscribeToProduct } = useNotifications();

    const userRoles = isConnected ? walletRoles : (user?.roles || ['CONSUMER']);
    const userAddress = account || user?.email || '';

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [activeTab, setActiveTab] = useState('timeline');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.hint || errData.error || 'Product not found');
            }

            const data = await response.json();
            setProduct(data);

            if (isAuthenticated && user?._id) {
                fetch(`${API_URL}/api/consumer/scans`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user._id,
                        productId: productId,
                        productName: data.name
                    })
                }).catch(err => console.error('Failed to record scan history:', err));
            }
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

    const handleDownloadQR = () => {
        if (!qrCodeUrl) return;
        const a = document.createElement('a');
        a.href = qrCodeUrl;
        a.download = `QR_${productId}.png`;
        a.click();
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

    const mapStageToIndex = (stage) => {
        const s = stage?.toLowerCase() || '';
        if (s.includes('manufactured')) return 0;
        if (s.includes('distribution')) return 1;
        if (s.includes('retail')) return 2;
        if (s.includes('sold')) return 3;
        return 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-white mb-2">Product Not Found</h3>
                <p className="text-gray-400 max-w-md mb-6">{error}</p>
                <Link to="/scan" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl transition-all">
                    Try Scanning Again
                </Link>
            </div>
        );
    }

    const verification = getVerificationStatus();

    return (
        <>
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                product={product}
                onTransferInitiated={fetchProduct}
            />

            <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
                {/* Low-poly background mesh */}
                <svg
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
                    viewBox="0 0 1440 900"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <radialGradient id="polyBase-inner" cx="50%" cy="50%" r="55%">
                            <stop offset="0%" stopColor="#242424"/>
                            <stop offset="100%" stopColor="#0E0E0F"/>
                        </radialGradient>
                        <radialGradient id="edgeDarken-inner" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#18181A" stopOpacity="0"/>
                            <stop offset="100%" stopColor="#0A0A0C" stopOpacity="0.75"/>
                        </radialGradient>
                    </defs>
                    <rect width="1440" height="900" fill="url(#polyBase-inner)"/>
                    <polygon points="0,0 200,0 100,150" fill="#141416" stroke="#1E1E1E" strokeWidth="0.6"/>
                    <polygon points="200,0 420,0 310,130" fill="#161618" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="420,0 660,0 540,140" fill="#121214" stroke="#1C1C1C" strokeWidth="0.6"/>
                    <polygon points="660,0 900,0 780,150" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="900,0 1120,0 1010,130" fill="#141416" stroke="#1E1E1E" strokeWidth="0.6"/>
                    <polygon points="1120,0 1340,0 1230,140" fill="#161618" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="1340,0 1440,0 1440,160" fill="#121214" stroke="#1C1C1C" strokeWidth="0.6"/>
                    <polygon points="0,0 100,150 0,260" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="100,150 200,0 340,180" fill="#202020" stroke="#282828" strokeWidth="0.6"/>
                    <polygon points="200,0 420,0 340,180" fill="#1C1C1C" stroke="#242424" strokeWidth="0.6"/>
                    <polygon points="420,0 540,140 480,280" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="540,140 660,0 800,160" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="660,0 900,0 800,160" fill="#1A1A1A" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="900,0 1010,130 960,270" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="1010,130 1120,0 1260,170" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1120,0 1340,0 1260,170" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="1340,0 1440,160 1440,380" fill="#1C1C1C" stroke="#242424" strokeWidth="0.6"/>
                    <polygon points="0,260 100,150 220,310" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="100,150 340,180 280,340" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="340,180 480,280 400,420" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="480,280 800,160 720,360" fill="#282828" stroke="#323232" strokeWidth="0.6"/>
                    <polygon points="800,160 960,270 880,420" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="960,270 1260,170 1180,350" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1260,170 1440,380 1440,560" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="0,420 220,310 180,520" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <polygon points="220,310 400,420 340,560" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="400,420 720,360 660,520" fill="#262626" stroke="#303030" strokeWidth="0.6"/>
                    <polygon points="720,360 880,420 820,560" fill="#282828" stroke="#323232" strokeWidth="0.6"/>
                    <polygon points="880,420 1180,350 1120,520" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="1180,350 1440,560 1440,720" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="0,520 180,520 120,680" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="180,520 340,560 280,700" fill="#1E1E1E" stroke="#282828" strokeWidth="0.6"/>
                    <polygon points="340,560 660,520 600,700" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="660,520 820,560 760,700" fill="#262626" stroke="#303030" strokeWidth="0.6"/>
                    <polygon points="820,560 1120,520 1060,690" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1120,520 1440,720 1440,900" fill="#1E1E1E" stroke="#282828" strokeWidth="0.6"/>
                    <polygon points="0,680 120,680 60,900" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="120,680 280,700 200,900" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <polygon points="280,700 600,700 520,900" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="600,700 760,700 700,900" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="760,700 1060,690 1000,900" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="1060,690 1440,900 1440,900" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <rect width="1440" height="900" fill="url(#edgeDarken-inner)"/>
                </svg>

                <div style={{ position: 'relative', zIndex: 1, padding: '20px 24px', maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Section 1 — Top header row */}
                    <div style={{ marginBottom: '14px' }}>
                        <Link to="/dashboard" style={{ fontSize: '11px', color: '#5A8A7A', textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 600, color: '#EDEADE', marginBottom: '2px' }}>
                                {product?.name || 'Unknown Product'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4A4A40', fontFamily: 'monospace' }}>
                                {productId}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => setIsTransferModalOpen(true)}
                                style={{ background: '#3A6A5A', color: '#D4EDE4', fontSize: '12px', fontWeight: 500, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                Transfer ownership
                            </button>
                            <div style={{ background: '#2A2218', color: '#C08840', border: '1px solid #3E3020', fontSize: '12px', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                {product?.currentStage || 'Unknown'}
                            </div>
                            <button 
                                onClick={handleDownloadQR}
                                style={{ background: '#1E1E20', color: '#7A7A6A', border: '1px solid #2E2E2A', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Section 2 — Verified banner */}
                    {verification?.verified && (
                        <div style={{ background: '#1A2820', border: '1px solid #28402E', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2A4A2A', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
                                <Check style={{ color: '#5A9A70', margin: 'auto' }} size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#5A9A70' }}>Verified product</div>
                                <div style={{ fontSize: '11px', color: '#3A6A3A' }}>This product has {verification.stages} verified checkpoints on the blockchain</div>
                            </div>
                            <div style={{ background: '#2A4A2A', color: '#5A9A70', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', border: '1px solid #3A6A3A', marginLeft: 'auto' }}>
                                On-chain verified
                            </div>
                        </div>
                    )}

                    {/* Section 3 — Two column grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', marginBottom: '12px' }}>
                        {/* Left card - Product information */}
                        <div style={{ background: 'rgba(30,30,32,0.92)', border: '1px solid #2E2E2A', borderRadius: '10px', padding: '16px', backdropFilter: 'blur(4px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#222225', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#5A8A7A', borderRadius: '2px' }} />
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#EDEADE' }}>Product information</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Product ID</div>
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#EDEADE', fontFamily: 'monospace' }}>{productId}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Token ID</div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE' }}>{product?.tokenId || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Current Stage</div>
                                    <div style={{ display: 'inline-block', background: '#2A2218', color: '#C08840', border: '1px solid #3E3020', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                                        {product?.currentStage || 'Unknown'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Checkpoints</div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE' }}>{product?.checkpoints?.length || 0}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Manufacturer name</div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE' }}>{product?.manufacturerName || product?.manufacturer?.name || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#4A4A40', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Minted date</div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE' }}>{formatDate(product?.manufacturingDate)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right card - QR code */}
                        <div style={{ background: 'rgba(30,30,32,0.92)', border: '1px solid #2E2E2A', borderRadius: '10px', padding: '16px', backdropFilter: 'blur(4px)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#EDEADE', marginBottom: '16px' }}>QR code</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code" style={{ width: '120px', height: '120px', borderRadius: '8px' }} />
                                ) : (
                                    <div style={{ width: '120px', height: '120px', borderRadius: '8px', background: '#1E1E20' }} />
                                )}
                                <div style={{ fontSize: '10px', color: '#4A4A40' }}>Scan to verify authenticity</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4 — Tab switcher */}
                    <div style={{ display: 'flex', background: '#1E1E20', border: '1px solid #252525', borderRadius: '8px', padding: '3px', width: 'fit-content', marginBottom: '12px' }}>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            style={{ 
                                background: activeTab === 'timeline' ? '#252525' : 'transparent',
                                color: activeTab === 'timeline' ? '#EDEADE' : '#5A5A50',
                                borderRadius: '6px', padding: '6px 16px', fontSize: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            style={{ 
                                background: activeTab === 'map' ? '#252525' : 'transparent',
                                color: activeTab === 'map' ? '#EDEADE' : '#5A5A50',
                                borderRadius: '6px', padding: '6px 16px', fontSize: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Map view
                        </button>
                    </div>

                    {/* Content Section */}
                    {activeTab === 'timeline' && (
                        <ProductJourney 
                            currentStage={mapStageToIndex(product?.currentStage)} 
                            checkpoints={product?.checkpoints || []}
                            isLoading={loading}
                        />
                    )}

                    {activeTab === 'map' && (
                        <div style={{ background: 'rgba(30,30,32,0.92)', border: '1px solid #2E2E2A', borderRadius: '10px', padding: '16px', backdropFilter: 'blur(4px)' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 500, color: '#EDEADE', marginBottom: '16px' }}>Location Map</h3>
                            <LocationMap checkpoints={product?.checkpoints || []} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ProductDetails;
