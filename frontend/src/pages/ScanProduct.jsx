import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner/Scanner';

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
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/8 rounded-xl mb-6">
                <button
                    onClick={() => setScanMode('camera')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        scanMode === 'camera'
                            ? 'bg-indigo-500/25 border border-indigo-500/30 text-indigo-300'
                            : 'text-gray-500 hover:text-gray-400'
                    }`}
                >
                    <span>📷</span> Camera Scan
                </button>
                <button
                    onClick={() => setScanMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        scanMode === 'manual'
                            ? 'bg-indigo-500/25 border border-indigo-500/30 text-indigo-300'
                            : 'text-gray-500 hover:text-gray-400'
                    }`}
                >
                    <span>⌨️</span> Manual Entry
                </button>
            </div>

            {/* Scanner / Manual Form */}
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 backdrop-blur-sm mb-6">
                {scanMode === 'camera' ? (
                    <div className="relative">
                        {/* Instruction above scanner */}
                        <p className="text-center text-xs text-gray-500 mb-4">Point your camera at the product QR code to begin scanning.</p>
                        {/* Subtle scan-line glow overlay */}
                        <div className="relative rounded-xl overflow-hidden">
                            <QRScanner
                                onScan={handleScan}
                                onError={(err) => console.error('Scanner error:', err)}
                            />
                            <div
                                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent"
                                style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }}
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
                            🔍 Verify Product
                        </button>
                    </form>
                )}
            </div>

            {/* How to Verify */}
            <div className="bg-white/[0.03] border border-white/6 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">ℹ️ How to Verify</h3>
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
