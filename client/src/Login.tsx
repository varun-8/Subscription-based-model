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
    const navigate = useNavigate();

    useEffect(() => {
        // Check if admin table is empty
        const checkAdminStatus = async () => {
            try {
                const res = await axios.get('/api/auth/admin-status');
                setShowAdminCreation(!res.data.hasAdmin);
            } catch (err) {
                // If error, assume admin exists to prevent showing admin creation form
                setShowAdminCreation(false);
            }
        };
        checkAdminStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true);
        try {
            if (showAdminCreation) {
                // Create admin account
                const res = await axios.post('/api/auth/create-admin', {
                    username: username.trim(),
                    password,
                    providedActionPassword: adminActionPassword
                }, { withCredentials: true });
                if (res.status === 200) {
                    setError('');
                    setShowAdminCreation(false);
                    setUsername('');
                    setPassword('');
                    setAdminActionPassword('');
                    // Show success message
                    alert('Admin account created successfully! You can now login.');
                }
            } else {
                // Regular login
                const res = await axios.post('/api/auth/login', { username: username.trim(), password }, { withCredentials: true });
                if (res.status === 200) {
                    const role = res.data.role;
                    if (role === 'admin') {
                        // Trigger automatic backup on admin login if in Electron
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
                setError('Request failed. Please check server.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="google-auth-layout">
            <div className="google-login-card">
                <div className="google-logo-section">
                    <img
                        src="/invoice-logo.png"
                        alt="Logo"
                        style={{ height: '120px', marginBottom: '16px', objectFit: 'contain' }}
                    />
                    <h1 className="google-title">Sign in</h1>
                    <p className="google-subtitle">Use your Aachi Account</p>
                </div>

                {error && (
                    <div style={{ color: '#d93025', fontSize: '14px', marginBottom: '20px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    {showAdminCreation && (
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
                            <p style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px', fontWeight: '500' }}>
                                🔐 Admin Setup Required
                            </p>
                            <p style={{ margin: '0', color: '#856404', fontSize: '13px' }}>
                                No admin account found. Please create the first admin account.
                            </p>
                        </div>
                    )}

                    <div className="google-input-group">
                        <input
                            type="text"
                            className="google-input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={showAdminCreation ? "Choose Admin Username" : "Username"}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="google-input-group">
                        <input
                            type="password"
                            className="google-input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={showAdminCreation ? "Choose Admin Password" : "Password"}
                            required
                        />
                    </div>

                    {showAdminCreation && (
                        <div className="google-input-group">
                            <input
                                type="password"
                                className="google-input-field"
                                value={adminActionPassword}
                                onChange={(e) => setAdminActionPassword(e.target.value)}
                                placeholder="Admin Action Password"
                                required
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                        <button
                            type="submit"
                            className="google-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (showAdminCreation ? 'Creating Admin...' : 'Signing in...') : (showAdminCreation ? 'Create Admin' : 'Sign in')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer Links - Optional aesthetic touch */}
            <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '20px', fontSize: '12px', color: '#1f1f1f' }}>
                <span>English (United Kingdom)</span>
                <span>Help</span>
                <span>Privacy</span>
                <span>Terms</span>
            </div>
        </div>
    );
};

export default Login;
