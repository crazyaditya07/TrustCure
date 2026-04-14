/**
 * consumerUtils.js — Frontend UI presentation helpers
 *
 * IMPORTANT: These are display-layer helpers ONLY.
 * Real data enforcement/filtering lives on the backend (?view=consumer endpoint).
 * These utilities make the already-safe backend data look good in the UI.
 */

/**
 * Truncate an Ethereum wallet address for display.
 * "0x1234567890abcdef1234" → "0x1234...cdef"
 */
export const maskWallet = (addr) => {
    if (!addr || typeof addr !== 'string') return 'Unknown';
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

/**
 * Truncate a transaction hash for display.
 * Full hash is preserved separately for use in href links.
 * "0xabcdef1234567890..." → "0xabcd...7890"
 */
export const maskTxHash = (hash) => {
    if (!hash || typeof hash !== 'string') return null;
    if (hash.length < 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

/**
 * Truncate a contract address for display.
 */
export const maskContract = (addr) => maskWallet(addr);

/**
 * Format a timestamp for consumer display — date only, no exact time.
 * Accepts: Date object, ISO string, Unix timestamp (seconds or ms), or undefined.
 */
export const formatConsumerDate = (ts) => {
    if (!ts) return 'Date unavailable';
    let date;
    if (ts instanceof Date) {
        date = ts;
    } else if (typeof ts === 'number') {
        // Distinguish UNIX seconds (< 1e10) vs milliseconds
        date = new Date(ts < 1e10 ? ts * 1000 : ts);
    } else {
        date = new Date(ts);
    }
    if (isNaN(date.getTime())) return 'Date unavailable';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Build the Etherscan URL for a transaction hash.
 * Defaults to Sepolia testnet.
 */
export const etherscanTxUrl = (txHash, network = 'sepolia') => {
    if (!txHash) return null;
    const bases = {
        mainnet: 'https://etherscan.io',
        sepolia: 'https://sepolia.etherscan.io',
        localhost: null,
    };
    const base = bases[network] || bases.sepolia;
    if (!base) return null;
    return `${base}/tx/${txHash}`;
};

/**
 * Build the Etherscan URL for a contract address.
 */
export const etherscanContractUrl = (address, network = 'sepolia') => {
    if (!address) return null;
    const bases = {
        mainnet: 'https://etherscan.io',
        sepolia: 'https://sepolia.etherscan.io',
        localhost: null,
    };
    const base = bases[network] || bases.sepolia;
    if (!base) return null;
    return `${base}/address/${address}`;
};

/**
 * Map a raw stage string to a color scheme for timeline nodes.
 */
export const stageColorScheme = (rawStage) => {
    const map = {
        Manufactured:   { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', icon: '#818cf8', label: 'indigo' },
        InDistribution: { bg: 'rgba(6, 182, 212, 0.15)',  border: 'rgba(6, 182, 212, 0.4)',  icon: '#22d3ee', label: 'cyan' },
        InRetail:       { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', icon: '#34d399', label: 'emerald' },
        Sold:           { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', icon: '#a78bfa', label: 'purple' },
        Created:        { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', icon: '#fbbf24', label: 'amber' },
    };
    return map[rawStage] || { bg: 'rgba(100,100,100,0.15)', border: 'rgba(100,100,100,0.4)', icon: '#9ca3af', label: 'gray' };
};
