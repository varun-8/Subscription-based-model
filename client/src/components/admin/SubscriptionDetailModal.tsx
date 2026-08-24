import React from 'react';
import {
    MdCheckCircle,
    MdWarning,
    MdPayment,
    MdAutorenew,
    MdHistory,
    MdEditNote
} from 'react-icons/md';

interface SubscriptionDetailModalProps {
    subscription: any;
    onClose: () => void;
    onRenewClick?: (subscription: any) => void;
    onDownloadPDF?: (subscription: any) => void;
    onOpenProfile?: (customer: any) => void;
    onEditSubscriptionDate?: (subscription: any, type: 'startDate' | 'endDate') => void;
    onEditSubscription?: (subscription: any) => void;
}

const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
    subscription, onClose, onRenewClick, onDownloadPDF, onOpenProfile, onEditSubscription
}) => {
    if (!subscription) return null;

    const isExpired = new Date(subscription.endDate) < new Date();
    const daysRemaining = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const statusInfo = isExpired ?
        { label: 'Expired', color: '#ef4444', icon: <MdWarning />, bg: '#fff1f2' } :
        { label: 'Active', color: '#10b981', icon: <MdCheckCircle />, bg: '#f0fdf4' };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 20%, rgba(15,23,42,0.32), rgba(2,6,23,0.7))',
            backdropFilter: 'blur(9px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 30px 60px -20px rgba(2, 6, 23, 0.55)',
                width: '100%',
                maxWidth: '760px',
                maxHeight: '90vh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                <button
                    onClick={onClose}
                    className="premium-close-btn premium-close-btn--dark"
                    style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 100, fontSize: '22px', fontWeight: 'bold' }}
                >
                    &times;
                </button>

                <div style={{
                    padding: '26px 56px 24px 30px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderBottom: '1px solid #1f2937'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <h2 style={{ margin: 0, fontSize: '1.42rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                                    {subscription.userId?.name}
                                </h2>
                                <span style={{
                                    fontSize: '0.72rem', fontWeight: 700, color: '#dbeafe',
                                    background: 'rgba(99,102,241,0.25)', padding: '4px 10px', borderRadius: '999px',
                                    fontFamily: 'monospace', border: '1px solid rgba(129,140,248,0.5)'
                                }}>
                                    {subscription.userId?.subscriberNo || subscription.subscriptionId || subscription._id.substring(0, 6).toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, background: 'rgba(15,23,42,0.45)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.25)', color: '#e2e8f0' }}>
                                    {subscription.memberTypeId?.name}
                                </span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#cbd5e1' }}>
                                    {subscription.memberTypeId?.durationInMonths} Months
                                </span>
                                {onOpenProfile && (
                                    <button
                                        onClick={() => onOpenProfile(subscription.userId)}
                                        style={{
                                            background: 'transparent', border: 'none', color: '#93c5fd',
                                            fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                                            padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px'
                                        }}
                                    >
                                        View Profile
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{
                            padding: '8px 14px', borderRadius: '999px',
                            background: statusInfo.bg, color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}40`,
                            display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800,
                            fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.03em'
                        }}>
                            {statusInfo.icon} {statusInfo.label}
                        </div>
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: '24px 30px 28px' }}>
                    <div style={{
                        marginBottom: '16px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                    }}>
                        <div style={{
                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Activation</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                                {new Date(subscription.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                        <div style={{
                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px'
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Expiry</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                                {new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '12px 14px',
                        background: daysRemaining < 0 ? '#fff1f2' : '#f0fdf4',
                        border: `1px solid ${daysRemaining < 0 ? '#fecdd3' : '#bbf7d0'}`,
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        color: daysRemaining < 0 ? '#be123c' : '#166534',
                        fontWeight: 700,
                        marginBottom: '16px'
                    }}>
                        {daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`}
                    </div>

                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: subscription.paymentMethod === 'Credit Transaction' ? '#fffbeb' : '#f8fafc',
                        border: `1px solid ${subscription.paymentMethod === 'Credit Transaction' ? '#fde68a' : '#e2e8f0'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px',
                        marginBottom: '22px'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MdPayment size={14} /> Payment Method
                            </div>
                            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                                {subscription.paymentMethod || 'Not Specified'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Reference</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{subscription.referenceNo || subscription.tempReceiptNo || 'N/A'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {onRenewClick && (
                            <button
                                onClick={() => onRenewClick(subscription)}
                                style={{
                                    flex: '1 1 220px', padding: '12px', background: '#0f172a', color: 'white',
                                    border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <MdAutorenew size={18} /> Renew Subscription
                            </button>
                        )}
                        {onEditSubscription && (
                            <button
                                onClick={() => onEditSubscription(subscription)}
                                style={{
                                    flex: '1 1 140px', padding: '12px', background: 'white', color: '#334155',
                                    border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <MdEditNote size={18} /> Edit
                            </button>
                        )}
                        {onDownloadPDF && (
                            <button
                                onClick={() => onDownloadPDF(subscription)}
                                style={{
                                    flex: '1 1 170px', padding: '12px', background: 'white', color: '#334155',
                                    border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <MdHistory size={18} /> Get Invoice
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay { animation: fadeIn 0.18s ease-out; }
                .modal-content { animation: scaleIn 0.22s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: translateY(8px) scale(0.985); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default SubscriptionDetailModal;
