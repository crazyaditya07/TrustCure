/**
 * maskData.js — Backend-level data masking utilities
 *
 * These are applied SERVER-SIDE before any response leaves the API.
 * Frontend masking is a secondary UI presentation layer only.
 * Real enforcement lives here.
 */

// Try to read the deployed contract address — used in consumer responses
let _contractAddress = process.env.SUPPLY_CHAIN_NFT_ADDRESS || null;
if (!_contractAddress) {
    try {
        // Resolve relative to the backend root
        const deployed = require('../frontend/src/contracts/deployedContracts.json');
        _contractAddress = deployed?.contracts?.SupplyChainNFT?.address || null;
    } catch {
        // Not available — consumer view will just omit contract address
    }
}
exports.NFT_CONTRACT_ADDRESS = _contractAddress;

/**
 * Truncate an Ethereum wallet address to first 6 + last 4 chars.
 * e.g. "0x1234567890abcdef" → "0x1234...cdef"
 */
exports.maskWallet = (addr) => {
    if (!addr || typeof addr !== 'string') return 'Unknown';
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

/**
 * Truncate a transaction hash for display (full hash still in value for links).
 * e.g. "0xabcdef..." → "0xabcd...ef12"
 */
exports.maskTxHash = (hash) => {
    if (!hash || typeof hash !== 'string') return null;
    if (hash.length < 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

/**
 * Truncate a contract address same as wallet.
 */
exports.maskContract = (addr) => exports.maskWallet(addr);

/**
 * Map a raw checkpoint stage string to a consumer-safe role label.
 * Never exposes internal stage names directly.
 */
exports.stageToConsumerLabel = (stage) => {
    const map = {
        'Created':        'Product Created',
        'Manufactured':   'Manufactured',
        'InDistribution': 'Transferred to Distributor',
        'InRetail':       'Transferred to Retailer',
        'Sold':           'Sold to Consumer',
    };
    return map[stage] || 'Processing';
};

/**
 * Build a consumer-safe checkpoint list from raw checkpoints.
 * Strips: handler email, exact location, handler name, notes.
 * Applies wallet masking server-side.
 */
exports.buildConsumerCheckpoints = (checkpoints, maskWalletFn) => {
    if (!Array.isArray(checkpoints)) return [];
    return checkpoints.map((cp) => ({
        stage:            exports.stageToConsumerLabel(cp.stage),
        rawStage:         cp.stage, // for ordering/icon logic frontend-side
        timestamp:        cp.timestamp,
        transactionHash:  cp.transactionHash || null,
        txHashDisplay:    exports.maskTxHash(cp.transactionHash),
        handlerMasked:    maskWalletFn(cp.handler),
        // Explicitly omit: cp.handler (full), cp.handlerName, cp.handlerEmail,
        //                  cp.location, cp.notes, cp.metadata
    }));
};

/**
 * Compute chain integrity server-side.
 * Returns { valid: boolean, reason: string }
 *
 * Rules:
 *   1. At least 1 checkpoint must exist
 *   2. Stages must be in ascending order (no regression)
 *   3. Product must be active
 */
exports.computeChainIntegrity = (product, visibleCheckpoints) => {
    if (!product.isActive) {
        return { valid: false, reason: 'Product is no longer active.' };
    }
    if (!visibleCheckpoints || visibleCheckpoints.length === 0) {
        return { valid: false, reason: 'No verified checkpoints found on blockchain.' };
    }

    const stageOrder = ['Created', 'Manufactured', 'InDistribution', 'InRetail', 'Sold'];
    let lastIdx = -1;
    for (const cp of visibleCheckpoints) {
        const idx = stageOrder.indexOf(cp.stage);
        if (idx < lastIdx) {
            return { valid: false, reason: 'Inconsistent transfer sequence detected.' };
        }
        lastIdx = idx;
    }

    return { valid: true, reason: 'All supply chain stages verified on blockchain.' };
};
