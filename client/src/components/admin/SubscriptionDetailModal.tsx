import React from 'react';
import {
    MdCalendarToday,
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
    subscription, onClose, onRenewClick, onDownloadPDF, onOpenProfile, onEditSubscriptionDate, onEditSubscription
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
            backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none', borderRadius: '50%',
                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 100, color: '#94a3b8',
                        transition: 'all 0.2s ease',
                        fontSize: '24px', fontWeight: 'bold'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                    }}
                >
                    &times;
                </button>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {/* Header Section - Refined Size */}
                    <div style={{
                        padding: '32px 64px 32px 40px',
                        borderBottom: '1px solid #f1f5f9',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                        {subscription.userId?.name}
                                    </h2>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, color: '#6366f1',
                                        background: '#eef2ff', padding: '3px 10px', borderRadius: '6px',
                                        fontFamily: 'monospace', border: '1px solid #e0e7ff'
                                    }}>
                                        {subscription.userId?.subscriberNo || subscription.subscriptionId || subscription._id.substring(0, 6).toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#64748b' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                                        {subscription.memberTypeId?.name}
                                    </span>
                                    <span style={{ fontSize: '1rem', color: '#e2e8f0' }}>•</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                        {subscription.memberTypeId?.durationInMonths} Months
                                    </span>
                                    {onOpenProfile && (
                                        <>
                                            <span style={{ fontSize: '1rem', color: '#e2e8f0' }}>•</span>
                                            <button
                                                onClick={() => onOpenProfile(subscription.userId)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#6366f1',
                                                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                                                    padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
                                                    textDecoration: 'underline', textUnderlineOffset: '2px'
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={{
                                padding: '6px 14px', borderRadius: '20px',
                                background: statusInfo.bg, color: statusInfo.color,
                                border: `1px solid ${statusInfo.color}30`,
                                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800,
                                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em',
                                boxShadow: `0 2px 4px ${statusInfo.color}10`
                            }}>
                                {statusInfo.icon} {statusInfo.label}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '32px 40px' }}>
                        {/* Schedule Section */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: 0 }}>
                                    <MdCalendarToday size={14} /> Schedule & Validity
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {onEditSubscriptionDate && (
                                        <>
                                            <button
                                                onClick={() => onEditSubscriptionDate(subscription, 'startDate')}
                                                style={{ padding: '6px 10px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Edit Start
                                            </button>
                                            <button
                                                onClick={() => onEditSubscriptionDate(subscription, 'endDate')}
                                                style={{ padding: '6px 10px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Edit End
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
                                background: '#f8fafc', padding: '24px', borderRadius: '12px',
                                border: '1px solid #f1f5f9'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Activation</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                        {new Date(subscription.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Expiry</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                        {new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                                    <div style={{
                                        padding: '12px', background: 'white', borderRadius: '8px',
                                        fontSize: '0.9rem', textAlign: 'center',
                                        color: daysRemaining < 0 ? '#e11d48' : '#166534', fontWeight: 700,
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        {daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Status - More compact */}
                        <div style={{
                            padding: '20px 24px', borderRadius: '12px',
                            background: subscription.paymentMethod === 'Credit Transaction' ? '#fffbeb' : '#f8fafc',
                            border: `1px solid ${subscription.paymentMethod === 'Credit Transaction' ? '#fde68a' : '#f1f5f9'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MdPayment size={14} /> Payment Method
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                    {subscription.paymentMethod || 'Not Specified'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Reference No</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{subscription.referenceNo || subscription.tempReceiptNo || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Action Buttons - Refined Size */}
                        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                            {onRenewClick && (
                                <button
                                    onClick={() => onRenewClick(subscription)}
                                    style={{
                                        flex: 1.5, padding: '12px', background: '#0f172a', color: 'white',
                                        border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        fontSize: '0.9rem', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#0f172a'}
                                >
                                    <MdAutorenew size={18} /> Renew Subscription
                                </button>
                            )}
                            {onEditSubscription && (
                                <button
                                    onClick={() => onEditSubscription(subscription)}
                                    style={{
                                        padding: '12px', background: 'white', color: '#475569',
                                        border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <MdEditNote size={20} />
                                </button>
                            )}
                            {onDownloadPDF && (
                                <button
                                    onClick={() => onDownloadPDF(subscription)}
                                    style={{
                                        flex: 1, padding: '12px', background: 'white', color: '#475569',
                                        border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        transition: 'all 0.2s', fontSize: '0.9rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <MdHistory size={18} /> Get Invoice
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay { animation: fadeIn 0.2s ease-out; }
                .modal-content { animation: scaleIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default SubscriptionDetailModal;
