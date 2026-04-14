import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'trustcure_auth_session';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const validateSession = async () => {
            const session = localStorage.getItem(SESSION_KEY);
            if (session) {
                try {
                    const userData = JSON.parse(session);

                    // If no token, maybe it's old legacy session. Let's force re-login.
                    if (!userData.token) {
                        throw new Error('No token found');
                    }

                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const response = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${userData.token}`
                        }
                    });

                    if (response.ok) {
                        const validUser = await response.json();
                        validUser.token = userData.token; // preserve token

                        setUser(validUser);
                        setIsAuthenticated(true);
                        localStorage.setItem(SESSION_KEY, JSON.stringify(validUser));
                    } else {
                        throw new Error('Invalid token');
                    }
                } catch (err) {
                    console.error('Session validation failed:', err);
                    localStorage.removeItem(SESSION_KEY);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };

        validateSession();
    }, []);

    const login = async (email, password) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const userData = await response.json();

            // Save to state and localStorage
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));

            console.log('✅ Login successful:', userData);
            return { success: true, user: userData };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const newUser = await response.json();

            // Auto-login after registration
            setUser(newUser);
            setIsAuthenticated(true);
            localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

            console.log('✅ Registration successful:', newUser);
            return { success: true, user: newUser };
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        console.log('🔄 Logging out...');
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setIsAuthenticated(false);
        console.log('✅ Logged out successfully');
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
