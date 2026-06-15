import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { account } = useWeb3();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        company: '',
        city: '',
        country: '',
        role: 'CONSUMER',
        walletAddress: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Automatically pre-fill wallet address if MetaMask is connected
    useEffect(() => {
        if (account) {
            setFormData(prev => ({
                ...prev,
                walletAddress: account
            }));
        }
    }, [account]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }

        if (!formData.walletAddress.trim() || formData.walletAddress.length !== 42 || !formData.walletAddress.startsWith('0x')) {
            setError('Valid EVM-compatible Wallet Address is required (Starts with 0x)');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            company: formData.company || undefined,
            role: formData.role,
            roles: [formData.role],
            walletAddress: formData.walletAddress,
            location: {
                city: formData.city,
                country: formData.country
            }
        };

        const result = await register(userData);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
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
            <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div className="card" style={{ padding: '3rem 2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                        color: '#EDEADE'
                    }}>
                        Create Account
                    </h1>
                    <p style={{ color: '#7A7A6A', fontSize: '1.125rem' }}>
                        Join TrustCure Supply Chain Network
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-4)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--border-radius-lg)',
                        color: '#ef4444',
                        marginBottom: 'var(--spacing-6)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">
                            Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Email Address <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="walletAddress">
                            Ethereum Wallet Address <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            id="walletAddress"
                            name="walletAddress"
                            className="form-input"
                            value={formData.walletAddress}
                            onChange={handleChange}
                            placeholder="0x123...abc"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Password <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">
                            Confirm Password <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="role">
                            Role <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <select
                            id="role"
                            name="role"
                            className="form-input"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="CONSUMER">Consumer</option>
                            <option value="MANUFACTURER">Manufacturer</option>
                            <option value="DISTRIBUTOR">Distributor</option>
                            <option value="RETAILER">Retailer</option>
                        </select>
                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                            marginTop: 'var(--spacing-2)'
                        }}>
                            Select your role in the supply chain
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="company">
                            Company/Organization
                        </label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            className="form-input"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Your company name (optional)"
                        />
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                        <div>
                            <label className="form-label" htmlFor="city">
                                City
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                className="form-input"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="City"
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="country">
                                Country
                            </label>
                            <input
                                type="text"
                                id="country"
                                name="country"
                                className="form-input"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="Country"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', marginTop: 'var(--spacing-4)' }}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: 'var(--spacing-6)',
                    paddingTop: 'var(--spacing-6)',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            style={{
                                color: '#5A8A7A',
                                fontWeight: 600,
                                textDecoration: 'none'
                            }}
                        >
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
        </div>
    );
}

export default Register;
