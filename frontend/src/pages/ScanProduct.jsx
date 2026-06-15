import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner/Scanner';
import { Info } from 'lucide-react';

function ScanProduct() {
    const navigate = useNavigate();
    const [manualInput, setManualInput] = useState('');
    const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'

    const handleScan = (result) => {
        // Extract product ID from QR code
        // QR codes may contain full URLs like http://localhost:5173/product/PROD001
        let productId = result;

        try {
            const url = new URL(result);
            const pathParts = url.pathname.split('/');
            const productIndex = pathParts.findIndex(p => p === 'product');
            if (productIndex !== -1 && pathParts[productIndex + 1]) {
                productId = pathParts[productIndex + 1];
            }
        } catch {
            // Result is not a URL, use as-is
        }

        navigate(`/product/${productId}`);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualInput.trim()) {
            navigate(`/product/${manualInput.trim()}`);
        }
    };

    return (
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
            <div className="max-w-lg mx-auto pt-6 pb-16 px-4" style={{ position: 'relative', zIndex: 1 }}>
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Verify Product</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Scan a product QR code or enter the product ID to instantly verify its blockchain authenticity.
                </p>
            </div>

            {/* Mode Toggle Pill */}
            <div className="flex items-center gap-1 p-1 rounded-[10px] mb-6" style={{ background: '#1E1E20', border: '1px solid #252525' }}>
                <button
                    onClick={() => setScanMode('camera')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] text-sm font-[600] transition-all duration-200 ${
                        scanMode === 'camera'
                            ? ''
                            : ''
                    }`}
                    style={scanMode === 'camera' ? { background: '#252525', color: '#EDEADE', border: '1px solid #252525' } : { color: '#5A5A50' }}
                >
                    <span>📷</span> Camera Scan
                </button>
                <button
                    onClick={() => setScanMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] text-sm font-[600] transition-all duration-200 ${
                        scanMode === 'manual'
                            ? ''
                            : ''
                    }`}
                    style={scanMode === 'manual' ? { background: '#252525', color: '#EDEADE', border: '1px solid #252525' } : { color: '#5A5A50' }}
                >
                    <span>⌨️</span> Manual Entry
                </button>
            </div>

            {/* Scanner / Manual Form */}
            <div className="p-6 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
                {scanMode === 'camera' ? (
                    <div className="relative">
                        {/* Instruction above scanner */}
                        <p className="text-center text-xs text-gray-500 mb-4">Point your camera at the product QR code to begin scanning.</p>
                        {/* Subtle scan-line glow overlay */}
                        <div className="relative rounded-[8px] overflow-hidden">
                            {/* Frame brackets */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 z-10" style={{ borderColor: '#5A8A7A', opacity: 0.8, borderWidth: '2px' }} />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 z-10" style={{ borderColor: '#5A8A7A', opacity: 0.8, borderWidth: '2px' }} />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 z-10" style={{ borderColor: '#5A8A7A', opacity: 0.8, borderWidth: '2px' }} />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 z-10" style={{ borderColor: '#5A8A7A', opacity: 0.8, borderWidth: '2px' }} />
                            
                            <QRScanner
                                onScan={handleScan}
                                onError={(err) => console.error('Scanner error:', err)}
                            />
                            <div
                                className="absolute inset-x-0 h-0.5"
                                style={{ background: 'rgba(90,138,122,0.5)', animation: 'scanLine 2s ease-in-out infinite', top: '50%' }}
                            />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleManualSubmit}>
                        <p className="text-xs text-gray-500 mb-4">Enter the product ID printed on the label or packaging.</p>
                        <div className="form-group !mb-4">
                            <label className="form-label">Product ID</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter product ID (e.g., PROD001)"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full btn btn-primary py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={!manualInput.trim()}
                        >
                            Verify Product
                        </button>
                    </form>
                )}
            </div>

            {/* How to Verify */}
            <div className="p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-white">How to Verify</h3>
                </div>
                <ol className="space-y-2 text-xs text-gray-500">
                    <li><strong className="text-gray-400">QR Code:</strong> Scan the QR code on the product packaging</li>
                    <li><strong className="text-gray-400">Manual:</strong> Enter the product ID printed on the label</li>
                    <li><strong className="text-gray-400">Verify:</strong> View the complete supply chain history</li>
                    <li><strong className="text-gray-400">Check:</strong> Ensure all checkpoints are verified on blockchain</li>
                </ol>

                <div className="mt-5 pt-4 border-t border-white/6">
                    <p className="text-xs font-semibold text-white mb-3">✅ Signs of Authentic Product</p>
                    <ul className="space-y-1.5 text-xs text-gray-500">
                        <li>✓ Green verification badge on each supply chain step</li>
                        <li>✓ Complete checkpoint history (Manufacturing → Distribution → Retail)</li>
                        <li>✓ Verified transaction hashes on Etherscan</li>
                        <li>✓ Consistent dates and locations in timeline</li>
                    </ul>
                </div>
            </div>
        </div>
        </div>
    );
}

export default ScanProduct;
