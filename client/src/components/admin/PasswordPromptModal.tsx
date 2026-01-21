import React, { useState } from 'react';
import axios from 'axios';

interface PasswordPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (password: string) => void;
    title?: string;
    message?: string;
    endpoint?: string;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = 'Admin Verification',
    message,
    endpoint = '/api/admin/verify-admin-password'
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setVerifying(true);
        try {
            await axios.post(endpoint, { password }, { withCredentials: true });
            onSuccess(password);
            onClose();
            setPassword('');
        } catch (err) {
            setError('Incorrect password');
            setPassword('');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1e293b' }}>
                    {title}
                </h2>
                {message && (
                    <p style={{ marginTop: 0, marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                        {message}
                    </p>
                )}
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Enter password"
                        autoFocus
                        disabled={verifying}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            color: '#1e293b'
                        }}
                    />
                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            {error}
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={verifying}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                background: 'white',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontWeight: 500,
                                opacity: verifying ? 0.7 : 1
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={verifying}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                opacity: verifying ? 0.7 : 1,
                                minWidth: '90px'
                            }}
                        >
                            {verifying ? '...' : 'Verify'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordPromptModal;
