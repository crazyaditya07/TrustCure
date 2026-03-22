import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

// Contract ABIs and addresses will be loaded from deployed contracts
let contractsConfig = null;

const SESSION_KEY = 'tracex_web3_session';
const LOGOUT_FLAG_KEY = 'tracex_logout_flag';

export function Web3Provider({ children }) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userRoles, setUserRoles] = useState(['CONSUMER']);
    const [contracts, setContracts] = useState({ supplyChainNFT: null, accessManager: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialized = useRef(false);

    // Load contract configuration
    const loadContracts = useCallback(async (signerInstance) => {
        try {
            // Try to load deployed contracts configuration
            if (!contractsConfig) {
                const module = await import('../contracts/deployedContracts.json');
                contractsConfig = module.default || module;
            }

            const supplyChainNFT = new ethers.Contract(
                contractsConfig.contracts.SupplyChainNFT.address,
                contractsConfig.contracts.SupplyChainNFT.abi,
                signerInstance
            );

            const accessManager = new ethers.Contract(
                contractsConfig.contracts.AccessManager.address,
                contractsConfig.contracts.AccessManager.abi,
                signerInstance
            );

            setContracts({ supplyChainNFT, accessManager });
            console.log('✅ Contracts loaded successfully');
        } catch (err) {
            console.warn('Could not load contracts:', err.message);
        }
    }, []);

    // Get user roles from contract with timeout and error handling
    const fetchUserRoles = useCallback(async (address, supplyChainNFT) => {
        try {
            if (!supplyChainNFT) {
                console.log('⚠️ No supplyChainNFT contract available, defaulting to CONSUMER');
                return ['CONSUMER'];
            }

            console.log('🔍 Fetching user roles for:', address);

            // Add timeout to contract call
            const rolesPromise = supplyChainNFT.getUserRoles(address);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Roles fetch timeout')), 10000)
            );

            const rolesString = await Promise.race([rolesPromise, timeoutPromise]);
            console.log('✅ User roles fetched:', rolesString);

            // Parse comma-separated roles
            const roles = rolesString.split(',').map(r => r.trim());
            return roles.length > 0 ? roles : ['CONSUMER'];
        } catch (err) {
            console.error('❌ Could not fetch user roles:', err.message);
            return ['CONSUMER'];
        }
    }, []);

    // Save session to localStorage
    const saveSession = useCallback((accountAddress, roles) => {
        const session = {
            account: accountAddress,
            roles: roles,
            timestamp: Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }, []);

    // Connect wallet
    const connectWallet = useCallback(async (saveSessionOnConnect = true) => {
        if (!window.ethereum) {
            setError('MetaMask is not installed. Please install it to continue.');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            // Clear logout flag when user explicitly connects
            localStorage.removeItem(LOGOUT_FLAG_KEY);

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const signerInstance = await browserProvider.getSigner();
            const network = await browserProvider.getNetwork();

            console.log('🔍 Wallet connection - Network chainId:', Number(network.chainId));
            console.log('🔍 Wallet connection - Account:', accounts[0]);

            setProvider(browserProvider);
            setSigner(signerInstance);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            setIsConnected(true);

            // Load contracts
            await loadContracts(signerInstance);

            // Save session only if requested (for explicit user connections)
            if (saveSessionOnConnect) {
                // fetchUserRoles needs contracts to be set, so we need to use a callback approach
                // The roles will be fetched by the useEffect when contracts change
            }

            console.log('✅ Wallet connected:', accounts[0]);
            return true;
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadContracts]);

    // Disconnect wallet and clear session
    const disconnectWallet = useCallback(() => {
        console.log('🔄 Disconnecting wallet...');

        // Clear localStorage session
        localStorage.removeItem(SESSION_KEY);

        // Set logout flag to prevent auto-reconnect on page reload
        localStorage.setItem(LOGOUT_FLAG_KEY, 'true');

        // Clear all state
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setChainId(null);
        setIsConnected(false);
        setUserRoles(['CONSUMER']);
        setContracts({ supplyChainNFT: null, accessManager: null });
        setError(null);

        console.log('✅ Wallet disconnected and session cleared');

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
            window.location.replace('/');
        }, 100);
    }, []);

    // Switch network to Localhost
    const switchToLocalhost = useCallback(async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7a69' }], // 31337 in hex
            });
        } catch (switchError) {
            // If the chain is not added, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x7a69',
                            chainName: 'Hardhat Localhost',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['http://127.0.0.1:8545'],
                            blockExplorerUrls: []
                        }],
                    });
                } catch (addError) {
                    console.error('Failed to add Localhost network:', addError);
                }
            }
        }
    }, []);

    // Listen for account and chain changes
    const handleAccountsChanged = useCallback(async (accounts) => {
        if (accounts.length === 0) {
            // User disconnected via MetaMask - clear everything
            localStorage.removeItem(SESSION_KEY);
            localStorage.setItem(LOGOUT_FLAG_KEY, 'true');

            // Clear all state
            setProvider(null);
            setSigner(null);
            setAccount(null);
            setChainId(null);
            setIsConnected(false);
            setUserRoles(['CONSUMER']);
            setContracts({ supplyChainNFT: null, accessManager: null });

            console.log('🔄 Wallet disconnected via MetaMask');

            // Force page reload to ensure clean state
            setTimeout(() => {
                window.location.replace('/');
            }, 100);
        } else if (accounts[0] !== account) {
            // Account switched in MetaMask - update state
            setAccount(accounts[0]);
            if (contracts.supplyChainNFT) {
                const roles = await fetchUserRoles(accounts[0], contracts.supplyChainNFT);
                setUserRoles(roles);
                saveSession(accounts[0], roles);
            }
        }
    }, [account, fetchUserRoles, saveSession, contracts.supplyChainNFT]);

    const handleChainChanged = useCallback((chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        // Only reload if switching away from localhost (development)
        if (newChainId !== 31337) {
            window.location.reload();
        }
    }, []);

    useEffect(() => {
        if (!window.ethereum || initialized.current) {
            setLoading(false);
            return;
        }

        // Check if user explicitly logged out
        const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);
        if (logoutFlag === 'true') {
            // User logged out - don't auto-connect, clear state and return
            localStorage.removeItem(LOGOUT_FLAG_KEY);
            initialized.current = true;
            setLoading(false);
            return;
        }

        // Set up event listeners for account/chain changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Check if wallet is already connected and authorized silently
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    console.log('📱 Found already authorized wallet, auto-connecting silently...');
                    connectWallet(false); // Connect without forcing a session save
                } else {
                    console.log('📱 Web3 initialized - waiting for user to explicitly connect wallet');
                }
            })
            .catch(console.error)
            .finally(() => {
                initialized.current = true;
                setLoading(false);
            });

        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [handleAccountsChanged, handleChainChanged]);

    // Refetch roles when contracts change and save session
    useEffect(() => {
        if (account && contracts.supplyChainNFT) {
            fetchUserRoles(account, contracts.supplyChainNFT).then(roles => {
                setUserRoles(roles);
                saveSession(account, roles);
            });
        }
    }, [account, contracts.supplyChainNFT, fetchUserRoles, saveSession]);

    // Expose helper to check if user has a specific role
    const hasRole = useCallback((role) => {
        return userRoles.includes(role);
    }, [userRoles]);

    // Expose helper to get primary role (first role)
    const getPrimaryRole = useCallback(() => {
        return userRoles.length > 0 ? userRoles[0] : 'CONSUMER';
    }, [userRoles]);

    const value = {
        provider,
        signer,
        account,
        chainId,
        isConnected,
        userRoles,
        userRole: getPrimaryRole(), // For backward compatibility
        hasRole,
        getPrimaryRole,
        contracts,
        loading,
        error,
        connectWallet,
        disconnectWallet,
        switchToLocalhost,
        isLocalhostNetwork: chainId === 31337,
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
}

export default Web3Context;
