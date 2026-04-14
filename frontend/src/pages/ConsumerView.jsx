import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    ShieldX,
    AlertTriangle,
    ExternalLink,
    Package,
    Hash,
    Calendar,
    BadgeCheck,
    ChevronDown,
    ChevronUp,
    Loader2,
} from 'lucide-react';
import ConsumerTimeline from '../components/ConsumerTimeline';
import {
    maskContract,
    maskTxHash,
    formatConsumerDate,
    etherscanContractUrl,
} from '../lib/consumerUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Network from env — used for Etherscan links
const NETWORK = import.meta.env.VITE_NETWORK || 'sepolia';

// ──────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────

/**
 * ChainIntegrityBanner
 * Shows the top-level authenticity verdict based on backend-computed chainIntegrity.
 */
const ChainIntegrityBanner = ({ chainIntegrity, product }) => {
    if (!chainIntegrity) return null;
    const { valid, reason } = chainIntegrity;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-5 border flex items-center gap-5"
            style={{
                background: valid
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
                borderColor: valid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            }}
        >
            {/* Big icon */}
            <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}
            >
                {valid
                    ? <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    : <ShieldX className="w-7 h-7 text-red-400" />
                }
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-bold" style={{ color: valid ? '#34d399' : '#f87171' }}>
                        {valid ? 'Authentic Product 🛡️' : 'Verification Failed'}
                    </h2>
                    {valid && (
                        <span
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                            style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}
                        >
                            Chain Integrity: Valid ✓
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-400">{reason}</p>
            </div>

            {/* Animated pulse for valid products */}
            {valid && (
                <div className="flex-shrink-0 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                    Live
                </div>
            )}
        </motion.div>
    );
};

/**
 * InfoRow — simple label+value row for product details card.
 */
const InfoRow = ({ label, value, mono = false, children }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase font-black text-gray-600 tracking-widest">{label}</span>
        {children || (
            <span className={`text-sm text-white font-medium ${mono ? 'font-mono' : ''}`}>
                {value || <span className="text-gray-600 italic">Not provided</span>}
            </span>
        )}
    </div>
);

/**
 * BlockchainProofSection
 * Collapsible section showing on-chain proof: token ID, contract, tx hashes.
 */
const BlockchainProofSection = ({ product, network }) => {
    const [open, setOpen] = useState(false);
    const contractUrl = etherscanContractUrl(product.contractAddressFull, network);

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'rgba(15,15,25,0.8)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
            {/* Header / toggle */}
            <button
                id="blockchain-proof-toggle"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 text-base">⛓️</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Blockchain Proof</span>
                    <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                    >
                        On-Chain
                    </span>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />
                }
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="proof-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-6 pb-5 space-y-4 border-t"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            {/* Token ID */}
                            <div className="pt-4">
                                <InfoRow label="NFT Token ID" value={`#${product.tokenId}`} mono />
                            </div>

                            {/* Contract Address */}
                            {product.contractAddress && (
                                <InfoRow label="Smart Contract">
                                    {contractUrl ? (
                                        <a
                                            href={contractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-sm font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            {product.contractAddress}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-sm font-mono text-gray-400">
                                            {product.contractAddress}
                                        </span>
                                    )}
                                </InfoRow>
                            )}

                            {/* Transaction hashes from checkpoints */}
                            {product.checkpoints && product.checkpoints.length > 0 && (
                                <div>
                                    <span className="text-[10px] uppercase font-black text-gray-600 tracking-widest block mb-2">
                                        Checkpoint Transactions
                                    </span>
                                    <div className="space-y-2">
                                        {product.checkpoints
                                            .filter(cp => cp.transactionHash)
                                            .map((cp, i) => {
                                                const txUrl = network !== 'localhost'
                                                    ? `https://${network === 'mainnet' ? '' : `${network}.`}etherscan.io/tx/${cp.transactionHash}`
                                                    : null;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                                                        style={{ background: 'rgba(255,255,255,0.03)' }}
                                                    >
                                                        <span className="text-xs text-gray-500 min-w-0 truncate">
                                                            {cp.stage}
                                                        </span>
                                                        {txUrl ? (
                                                            <a
                                                                href={txUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                                                            >
                                                                {/* Truncated display, full hash in href */}
                                                                {cp.txHashDisplay || maskTxHash(cp.transactionHash)}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs font-mono text-gray-600 flex-shrink-0">
                                                                {cp.txHashDisplay || maskTxHash(cp.transactionHash)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ──────────────────────────────────────────────────
// Main ConsumerView Page
// ──────────────────────────────────────────────────
function ConsumerView() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // null | 'not_found' | 'server_error'

    useEffect(() => {
        let cancelled = false;
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                // Always call with ?view=consumer — enforces backend whitelist
                const response = await fetch(
                    `${API_URL}/api/products/${encodeURIComponent(productId)}?view=consumer`
                );
                if (cancelled) return;
                if (response.status === 404) {
                    setError('not_found');
                    return;
                }
                if (!response.ok) {
                    setError('server_error');
                    return;
                }
                const data = await response.json();
                setProduct(data);
            } catch {
                if (!cancelled) setError('server_error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchProduct();
        return () => { cancelled = true; };
    }, [productId]);

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <p className="text-gray-500 text-sm">Fetching product from blockchain...</p>
            </div>
        );
    }

    // ── Error: Product not found ──
    if (error === 'not_found') {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        <ShieldX className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">❌ Product Not Found</h1>
                    <p className="text-gray-400 mb-2">
                        No product matching <span className="font-mono text-gray-300">{productId}</span> was found on the blockchain.
                    </p>
                    <p className="text-gray-600 text-sm mb-8">
                        This may indicate a counterfeit product or an invalid ID. Do not consume this product without verification from a trusted source.
                    </p>
                    <Link to="/scan" className="btn btn-primary">
                        Try Another Scan
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ── Error: Server error ──
    if (error === 'server_error') {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}
                    >
                        <AlertTriangle className="w-10 h-10 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">⚠️ Verification Unavailable</h1>
                    <p className="text-gray-400 mb-8">
                        Unable to reach the verification service. Please try again in a moment.
                    </p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Incomplete chain state (product found, but chainIntegrity.valid === false) ──
    const isIncomplete = product?.chainIntegrity && !product.chainIntegrity.valid;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

            {/* ── Page Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                    <Link
                        to="/scan"
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        ← Back to Scanner
                    </Link>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {product.name}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Product Verification Report
                </p>
            </motion.div>

            {/* ── Chain Integrity Banner ── */}
            {isIncomplete ? (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 border flex items-start gap-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))',
                        borderColor: 'rgba(251,191,36,0.3)',
                    }}
                >
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 font-semibold text-sm mb-0.5">⚠️ Incomplete Supply Chain</p>
                        <p className="text-gray-400 text-sm">{product.chainIntegrity.reason}</p>
                    </div>
                </motion.div>
            ) : (
                <ChainIntegrityBanner chainIntegrity={product.chainIntegrity} product={product} />
            )}

            {/* ── Product Details Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-white text-sm">Product Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoRow label="Product Name" value={product.name} />
                    <InfoRow label="Batch ID" value={product.batchNumber} mono />

                    <InfoRow
                        label="Manufacturing Date"
                        value={formatConsumerDate(product.manufacturingDate)}
                    />
                    <InfoRow
                        label="Expiry Date"
                        value={formatConsumerDate(product.expiryDate)}
                    />

                    <InfoRow label="Current Stage" value={product.currentStage} />

                    {/* Manufacturer — name + verified badge, nothing else */}
                    <InfoRow label="Manufacturer">
                        {product.manufacturerName ? (
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="text-sm font-medium text-white">
                                    {product.manufacturerName}
                                </span>
                                <span
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                    style={{
                                        background: 'rgba(16,185,129,0.1)',
                                        borderColor: 'rgba(16,185,129,0.3)',
                                        color: '#34d399',
                                    }}
                                >
                                    <BadgeCheck className="w-3 h-3" />
                                    Verified Manufacturer
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500 italic">Unknown</span>
                        )}
                    </InfoRow>
                </div>
            </motion.div>

            {/* ── Supply Chain Timeline ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
            >
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-sm">📋</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm">Supply Chain Journey</h3>
                    <span
                        className="ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                    >
                        Blockchain Verified
                    </span>
                </div>

                <ConsumerTimeline
                    checkpoints={product.checkpoints || []}
                    network={NETWORK}
                    manufacturerName={product.manufacturerName || ''}
                />
            </motion.div>

            {/* ── Blockchain Proof (collapsible) ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <BlockchainProofSection product={product} network={NETWORK} />
            </motion.div>

            {/* ── Footer note ── */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-xs text-gray-600 pb-4"
            >
                This report is generated from immutable blockchain records via TrustCure.
                <br />
                Data shown is consumer-grade only. Sensitive supply chain information is protected.
            </motion.p>
        </div>
    );
}

export default ConsumerView;
