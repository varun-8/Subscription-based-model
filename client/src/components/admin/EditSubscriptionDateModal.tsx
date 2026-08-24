import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

interface EditSubscriptionDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscription: any;
    dateType?: 'startDate' | 'endDate';
    onSave: (subscriptionId: string, date: string, type: 'startDate' | 'endDate', password: string) => Promise<void>;
}

const EditSubscriptionDateModal: React.FC<EditSubscriptionDateModalProps> = ({
    isOpen,
    onClose,
    subscription,
    dateType = 'endDate',
    onSave
}) => {
    const [dateValue, setDateValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (subscription && isOpen) {
            const d = new Date(subscription[dateType]);
            const dateStr = d.toISOString().split('T')[0];
            setDateValue(dateStr);
            setPassword('');
            setError('');
        }
    }, [subscription, isOpen, dateType]);

    if (!isOpen || !subscription) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!dateValue) {
            setError('Date is required');
            return;
        }

        if (!password) {
            setError('Admin password is required');
            return;
        }

        setSaving(true);
        try {
            await onSave(subscription._id, dateValue, dateType, password);
            onClose();
            setPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update subscription date');
        } finally {
            setSaving(false);
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
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>
                        Edit {dateType === 'startDate' ? 'Start' : 'End'} Date
                    </h2>
                    <button
                        onClick={onClose}
                        className="premium-close-btn premium-close-btn--dark"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    {subscription.userId && (
                        <p style={{ marginTop: 0, marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                            Customer: <strong>{subscription.userId.name || 'N/A'}</strong><br />
                            Plan: <strong>{subscription.memberTypeId?.name || 'N/A'}</strong>
                        </p>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                color: '#334155',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                {dateType === 'startDate' ? 'Start' : 'End'} Date
                            </label>
                            <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => {
                                    setDateValue(e.target.value);
                                    setError('');
                                }}
                                required
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    color: '#1e293b',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                color: '#334155',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                Admin Action Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter admin action password"
                                required
                                autoFocus
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    color: '#1e293b'
                                }}
                            />
                        </div>

                        {error && (
                            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                                {error}
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: 'white',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    opacity: saving ? 0.7 : 1,
                                    minWidth: '90px'
                                }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditSubscriptionDateModal;
