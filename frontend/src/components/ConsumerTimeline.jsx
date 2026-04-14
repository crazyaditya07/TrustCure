import React from 'react';
import { motion } from 'framer-motion';
import { Factory, Truck, Store, ShoppingBag, Package, CheckCircle2, ExternalLink } from 'lucide-react';
import { formatConsumerDate, etherscanTxUrl, stageColorScheme } from '../lib/consumerUtils';

/**
 * ConsumerTimeline
 *
 * Renders a consumer-safe, vertically-stacked supply chain timeline.
 *
 * Data contract (from backend ?view=consumer):
 *   checkpoints: Array<{
 *     stage: string,            // Consumer-safe label ("Manufactured", "Transferred to Distributor", etc.)
 *     rawStage: string,         // Internal stage key for icon/color lookup
 *     timestamp: string|Date,
 *     transactionHash: string|null,  // Full hash — used in href only
 *     txHashDisplay: string|null,    // Truncated: "0xabc...789" — for display
 *     handlerMasked: string,         // Present but NOT rendered — wallets must not appear in consumer UI
 *   }>
 *
 * NO wallet addresses or identity data is rendered here.
 * Static role labels are used for distributor, retailer, and sold steps.
 * Only the manufacturer name (whitelisted by backend) is shown.
 */

const STAGE_ICONS = {
    Manufactured:   Factory,
    InDistribution: Truck,
    InRetail:       Store,
    Sold:           ShoppingBag,
    Created:        Package,
};

const actorLabel = (cp, fallbackManufacturerName) => {
    const { rawStage, actorName } = cp;
    switch (rawStage) {
        case 'Manufactured':
            const mName = actorName || fallbackManufacturerName;
            return mName
                ? `by ${mName}`
                : 'Verified Manufacturer';
        case 'InDistribution':
            return actorName ? `Handled by ${actorName}` : 'Handled by Verified Distributor';
        case 'InRetail':
            return actorName ? `Handled by ${actorName}` : 'Handled by Verified Retailer';
        case 'Sold':
            return 'Final Sale Completed';
        default:
            return '';
    }
};

const ConsumerTimeline = ({ checkpoints = [], network = 'sepolia', manufacturerName = '' }) => {
    if (!checkpoints || checkpoints.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No verified supply chain checkpoints found.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical connector line */}
            <div
                className="absolute left-6 top-6 bottom-6 w-0.5"
                style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(139,92,246,0.1))' }}
            />

            <div className="space-y-6">
                {checkpoints.map((cp, index) => {
                    const colors = stageColorScheme(cp.rawStage);
                    const Icon = STAGE_ICONS[cp.rawStage] || Package;
                    const txUrl = etherscanTxUrl(cp.transactionHash, network);
                    const isLast = index === checkpoints.length - 1;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.12, ease: 'easeOut' }}
                            className="relative flex items-start gap-5"
                        >
                            {/* Node Icon */}
                            <div className="relative z-10 flex-shrink-0">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.12 + 0.1, type: 'spring', stiffness: 250 }}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center border"
                                    style={{ background: colors.bg, borderColor: colors.border }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: colors.icon }} />
                                </motion.div>

                                {/* Verified badge */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.12 + 0.25 }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-black/50"
                                >
                                    <CheckCircle2 className="w-3 h-3 text-white fill-white" />
                                </motion.div>
                            </div>

                            {/* Content Card */}
                            <div
                                className="flex-1 rounded-xl p-4 border"
                                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                            >
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                        {/* Stage title — consumer-safe label from backend */}
                                        <h4 className="text-white font-semibold text-sm leading-tight mb-1">
                                            {cp.stage}
                                        </h4>
                                        {/* Actor subtitle — role-based, NO wallet address */}
                                        {actorLabel(cp, manufacturerName) && (
                                            <p className="text-xs" style={{ color: colors.icon }}>
                                                {actorLabel(cp, manufacturerName)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Verified badge */}
                                    <span
                                        className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                                        style={{
                                            background: 'rgba(16,185,129,0.1)',
                                            borderColor: 'rgba(16,185,129,0.3)',
                                            color: '#34d399',
                                        }}
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Verified
                                    </span>
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                                    {/* Timestamp — date only, no exact time */}
                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span className="text-gray-600">📅</span>
                                        {formatConsumerDate(cp.timestamp)}
                                    </span>

                                    {/* Transaction hash — truncated display, full in href */}
                                    {cp.transactionHash && (
                                        txUrl ? (
                                            <a
                                                href={txUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-mono transition-colors hover:text-indigo-300"
                                                style={{ color: '#6366f1' }}
                                            >
                                                <span>⛓️</span>
                                                {cp.txHashDisplay || '0x...'}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
                                                <span>⛓️</span>
                                                {cp.txHashDisplay || '0x...'}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Final "journey complete" indicator */}
            {checkpoints.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: checkpoints.length * 0.12 + 0.2 }}
                    className="flex items-center gap-3 mt-6 pl-1"
                >
                    <div className="w-12 flex-shrink-0 flex justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    </div>
                    <span className="text-xs text-gray-500">
                        {checkpoints.length === 1
                            ? '1 checkpoint recorded on blockchain'
                            : `${checkpoints.length} checkpoints recorded on blockchain`}
                    </span>
                </motion.div>
            )}
        </div>
    );
};

export default ConsumerTimeline;
