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
        <div className="max-w-lg mx-auto pt-6 pb-16 px-4">
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
    );
}

export default ScanProduct;
