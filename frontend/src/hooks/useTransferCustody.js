import { useState, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

/**
 * useTransferCustody hook
 * Handles the on-chain transferCustody execution and synchronizes with the backend.
 */
export const useTransferCustody = () => {
    const { contracts, account } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txHash, setTxHash] = useState(null);

    const executeTransfer = useCallback(async (transferId, tokenId, recipient, locationHash = ethers.ZeroHash) => {
        if (!contracts.supplyChainNFT) {
            setError('Smart contract not initialized');
            return null;
        }

        setLoading(true);
        setError(null);
        setTxHash(null);

        try {
            console.log(`🚀 Executing on-chain transfer for token ${tokenId} to ${recipient}...`);
            
            // 1. Verify on-chain ownership before submitting transaction
            const onChainOwner = await contracts.supplyChainNFT.ownerOf(tokenId);
            if (onChainOwner.toLowerCase() !== account.toLowerCase()) {
                throw new Error("Unauthorized: You are not the on-chain owner of this product");
            }

            // 2. Execute on-chain transaction
            const tx = await contracts.supplyChainNFT.transferCustody(
                tokenId,
                recipient,
                locationHash
            );

            console.log('⏳ Transaction submitted:', tx.hash);
            setTxHash(tx.hash);

            // 3. Notify backend that transaction is processing
            await axios.patch(`${API_URL}/transfers/${transferId}/submit`, {
                txHash: tx.hash
            });

            // 4. Wait for transaction to be mined (optional, event listener will catch it anyway)
            // const receipt = await tx.wait();
            // console.log('✅ Transaction mined:', receipt.hash);

            return tx.hash;
        } catch (err) {
            console.error('❌ Transfer execution failed:', err);
            const errorMessage = err.reason || err.message || 'Transfer failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [contracts.supplyChainNFT]);

    return {
        executeTransfer,
        loading,
        error,
        txHash
    };
};
