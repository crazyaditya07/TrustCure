import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
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
        <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '1.5rem' }}>
            <div className="card" style={{ padding: '3rem 2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                        background: 'linear-gradient(135deg, var(--text-metallic-light), var(--accent-cyan-neon))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                        Join TraceX Supply Chain Network
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
                                color: 'var(--accent-cyan-neon)',
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
    );
}

export default Register;
