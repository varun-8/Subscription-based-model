import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAdminCreation, setShowAdminCreation] = useState(false);
    const [adminActionPassword, setAdminActionPassword] = useState('');
    const [activeModal, setActiveModal] = useState<'support' | 'privacy' | 'terms' | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [dbStatus, setDbStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Connecting');

    const checkAdminStatus = async () => {
        try {
            const res = await axios.get('/api/auth/admin-status');
            const hasAdmin = Boolean(res.data?.hasAdmin);
            setShowAdminCreation(!hasAdmin);
            return hasAdmin;
        } catch (err) {
            setShowAdminCreation(false);
            return false;
        }
    };

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await axios.get('/api/health');
                if (res.data.database === 'Connected') {
                    setDbStatus('Connected');
                } else {
                    setDbStatus('Connecting');
                }
            } catch (err) {
                setDbStatus('Disconnected');
            }
        };

        checkHealth();
        checkAdminStatus();
        const healthInterval = setInterval(checkHealth, 5000);
        return () => clearInterval(healthInterval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (showAdminCreation) {
                const res = await axios.post('/api/auth/create-admin', {
                    username: username.trim(),
                    password,
                    providedActionPassword: adminActionPassword
                }, { withCredentials: true });
                if (res.status === 200) {
                    await checkAdminStatus();
                    setError('');
                    setUsername('');
                    setPassword('');
                    setAdminActionPassword('');
                    alert('Admin account created successfully! You can now login.');
                }
            } else {
                const res = await axios.post('/api/auth/login', { username: username.trim(), password }, { withCredentials: true });
                if (res.status === 200) {
                    const role = res.data.role;
                    if (role === 'admin') {
                        if (window.electronAPI && window.electronAPI.performBackup) {
                            window.electronAPI.performBackup();
                        }
                        navigate('/admin');
                    } else {
                        navigate('/customer');
                    }
                }
            }
        } catch (err: any) {
            if (err.response) {
                setError(err.response.data?.message || 'Invalid credentials');
            } else {
                setError('Connection failed. Server offline?');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const hasAdmin = await checkAdminStatus();
            if (!hasAdmin) {
                setError('No admin account exists yet. Create one first, then return to login.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="exe-login-container">
            {/* Main Application Window */}
            <div className="exe-login-window">

                {/* Header Section */}
                <div className="exe-login-header">
                    <div className="exe-app-branding">
                        <img src="/invoice-logo.png" alt="App Logo" className="exe-app-logo" />
                        <div className="exe-app-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h1 className="exe-app-title" style={{ margin: 0 }}>Magazine ERP</h1>
                                <div
                                    title={dbStatus === 'Connected' ? 'Database Connected' : 'Database Offline'}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: dbStatus === 'Connected' ? '#f0fdf4' : '#fef2f2',
                                        border: `1px solid ${dbStatus === 'Connected' ? '#bbf7d0' : '#fecaca'}`,
                                        padding: '3px 8px', borderRadius: '12px',
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color: dbStatus === 'Connected' ? '#16a34a' : '#dc2626',
                                        letterSpacing: '0.02em',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <span style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: dbStatus === 'Connected' ? '#22c55e' : '#ef4444',
                                        boxShadow: `0 0 6px ${dbStatus === 'Connected' ? '#22c55e' : '#ef4444'}`
                                    }}></span>
                                    {dbStatus === 'Connected' ? 'Connected' : 'Not Connected'}
                                </div>
                            </div>
                            <span className="exe-app-version">Enterprise Edition v2.4</span>
                        </div>
                    </div>
                </div>

                {/* Login Body */}
                <div className="exe-login-body">
                    <h2 className="exe-section-title">
                        {showAdminCreation ? 'System Initialization' : 'User Authentication'}
                    </h2>

                    {error && (
                        <div className="exe-error-message">
                            <span className="exe-error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {dbStatus !== 'Connected' && !error && !loading && (
                        <div className="exe-error-message" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                            <span className="exe-error-icon">🕒</span>
                            {dbStatus === 'Disconnected' ? 'Server is offline. Reconnecting...' : 'Waiting for Database connection...'}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="exe-form">
                        {showAdminCreation && (
                            <div className="exe-info-box">
                                <strong>Setup Required:</strong> Create the root administrator account.
                            </div>
                        )}

                        <div className="exe-input-group">
                            <label>Username / ID</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                required
                                className="exe-input"
                                placeholder={showAdminCreation ? "New Admin Username" : ""}
                            />
                        </div>

                        <div className="exe-input-group">
                            <label>Password</label>
                            <div className="exe-password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="exe-input"
                                    placeholder={showAdminCreation ? "New Admin Password" : ""}
                                />
                                <button
                                    type="button"
                                    className="exe-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {showAdminCreation && (
                            <div className="exe-input-group">
                                <label>Action Token (Security)</label>
                                <input
                                    type="password"
                                    value={adminActionPassword}
                                    onChange={(e) => setAdminActionPassword(e.target.value)}
                                    required
                                    className="exe-input"
                                />
                            </div>
                        )}

                        <div className="exe-actions">
                            <button type="submit" className="exe-btn-primary" disabled={loading}>
                                {loading ? 'Verifying...' : (showAdminCreation ? 'Initialize System' : 'Log In')}
                            </button>
                            {showAdminCreation && (
                                <button
                                    type="button"
                                    className="exe-btn-secondary"
                                    onClick={handleGoToLogin}
                                    disabled={loading}
                                >
                                    Go To Login
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer / Status Bar */}
                <div className="exe-status-bar">
                    <div className="exe-status-left">
                        <span className={`exe-status-indicator ${loading ? 'status-busy' :
                            dbStatus === 'Connected' ? 'status-ready' : 'status-offline'
                            }`}></span>
                        {loading ? 'Processing...' :
                            dbStatus === 'Connected' ? 'System Ready' :
                                dbStatus === 'Connecting' ? 'Connecting to Database...' : 'Server Offline'}
                    </div>
                    <div className="exe-status-right">
                        <button onClick={() => setActiveModal('support')}>Support</button>
                        <span className="exe-divider">|</span>
                        <button onClick={() => setActiveModal('privacy')}>Privacy</button>
                    </div>
                </div>
            </div>

            {/* Simple Modal for Info */}
            {activeModal && (
                <div className="exe-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="exe-modal-window" onClick={(e) => e.stopPropagation()}>
                        <div className="exe-modal-header">
                            <h3>
                                {activeModal === 'support' && 'Technical Support'}
                                {activeModal === 'privacy' && 'Privacy Policy'}
                            </h3>
                            <button onClick={() => setActiveModal(null)}>✖</button>
                        </div>
                        <div className="exe-modal-content">
                            {activeModal === 'support' && (
                                <div className="exe-support-info">
                                    <p>For technical assistance, please contact the IT department.</p>
                                    <ul>
                                        <li><strong>Email:</strong> helpdesk@magrp.internal</li>
                                        <li><strong>Ext:</strong> 4040</li>
                                    </ul>
                                </div>
                            )}
                            {activeModal === 'privacy' && (
                                <p>This system assumes implicit consent for data monitoring for security and auditing purposes. All actions are logged.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
