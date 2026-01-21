import React, { useState } from 'react';
import axios from 'axios';
import { MdSecurity, MdLock, MdVpnKey } from 'react-icons/md';

interface SecuritySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    handleError?: (err: any) => void;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose, showNotification, handleError }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'action'>('login');
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleTabChange = (tab: 'login' | 'action') => {
        setActiveTab(tab);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            showNotification('New passwords do not match', 'warning');
            return;
        }

        if (formData.newPassword.length < 6) {
            showNotification('New password must be at least 6 characters long', 'warning');
            return;
        }

        const endpoint = activeTab === 'login'
            ? '/api/admin/change-login-password'
            : '/api/admin/change-action-password';

        const payload = {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
        };

        setLoading(true);
        try {
            await axios.post(endpoint, payload, { withCredentials: true });
            showNotification(`${activeTab === 'login' ? 'Login' : 'Action'} password updated successfully`, 'success');
            resetForm();
            onClose();
        } catch (err: any) {
            if (handleError) {
                handleError(err);
            } else {
                const msg = err.response?.data?.message || 'Failed to update password';
                showNotification(msg, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div className="modal-content" style={{
                background: 'white', borderRadius: '16px', padding: '0',
                maxWidth: '500px', width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MdSecurity size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Security Settings</h2>
                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.875rem' }}>Manage your admin access credentials</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => handleTabChange('login')}
                        style={{
                            flex: 1, padding: '1rem', border: 'none', background: activeTab === 'login' ? 'white' : '#f8fafc',
                            color: activeTab === 'login' ? '#0f172a' : '#64748b',
                            fontWeight: 600, cursor: 'pointer',
                            borderBottom: activeTab === 'login' ? '2px solid #0f172a' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <MdVpnKey /> Login Password
                    </button>
                    <button
                        onClick={() => handleTabChange('action')}
                        style={{
                            flex: 1, padding: '1rem', border: 'none', background: activeTab === 'action' ? 'white' : '#f8fafc',
                            color: activeTab === 'action' ? '#0f172a' : '#64748b',
                            fontWeight: 600, cursor: 'pointer',
                            borderBottom: activeTab === 'action' ? '2px solid #0f172a' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <MdLock /> Action Password
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>
                                Current {activeTab === 'login' ? 'Login' : 'Action'} Password
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                value={formData.currentPassword}
                                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                required
                                placeholder="Enter current password"
                            />
                            {activeTab === 'action' && (
                                <small style={{ display: 'block', marginTop: '0.5rem', color: '#64748b' }}>
                                    This is the password used for deleting customers and editing dates.
                                </small>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                value={formData.newPassword}
                                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                style={{
                                    padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '8px',
                                    background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px',
                                    background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettingsModal;
