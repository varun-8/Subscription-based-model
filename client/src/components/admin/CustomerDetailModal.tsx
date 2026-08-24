import React from 'react';
import {
    MdCampaign,
    MdSubscriptions,
    MdLocationOn,
    MdPhone,
    MdCreditCard,
    MdEdit,
    MdDelete,
    MdWhatsapp
} from 'react-icons/md';

interface CustomerDetailModalProps {
    customer: any;
    history: any[];
    adHistory?: any[];
    hideSubscriptionInfo?: boolean;
    onClose: () => void;
    onEdit: (customer: any) => void;
    onDelete: (id: string) => void;
    onEditSubscriptionDate?: (subscription: any, type: 'startDate' | 'endDate') => void;
    onOpenSubDetails?: (subscription: any) => void;
    onDeleteSubscription?: (id: string) => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, history, adHistory, hideSubscriptionInfo, onClose, onEdit, onDelete, onEditSubscriptionDate, onOpenSubDetails, onDeleteSubscription }) => {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
            case 'Expired': return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
            case 'Renew Needed': return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
            case 'Advertisement': return { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
        }
    };

    const statusStyle = getStatusColor(customer.status || 'New');

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: '#f8fafc',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '90%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>

                <button
                    onClick={onClose}
                    className="premium-close-btn premium-close-btn--light"
                    style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100, fontSize: '24px', fontWeight: 'bold' }}
                >
                    &times;
                </button>

                {/* Scrollable Content Container */}
                <div style={{ overflowY: 'auto', flex: 1, borderRadius: '24px' }}>

                    {/* Hero / Profile Section */}
                    <div style={{
                        background: 'white',
                        padding: '40px 40px 32px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px'
                    }}>
                        {/* Top Row: Identity & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', paddingRight: '64px' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2.5rem', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                                }}>
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 style={{ margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                        {customer.name}
                                    </h1>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{
                                            background: '#f8fafc', color: '#64748b', padding: '3px 10px', borderRadius: '15px',
                                            fontSize: '0.8rem', fontWeight: 600, border: '1px solid #e2e8f0', fontFamily: 'monospace'
                                        }}>
                                            #{customer.subscriberNo || customer._id?.substring(0, 8)}
                                        </span>
                                        <span style={{
                                            background: customer.customerType === 'Advertisement' ? '#f5f3ff' : '#eff6ff',
                                            color: customer.customerType === 'Advertisement' ? '#7c3aed' : '#3b82f6',
                                            padding: '3px 10px', borderRadius: '15px',
                                            fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${customer.customerType === 'Advertisement' ? '#ddd6fe' : '#dbeafe'}`
                                        }}>
                                            {customer.customerType || 'Subscription'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => onEdit(customer)}
                                    className="action-btn-secondary"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 20px', background: 'white', color: '#475569',
                                        border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s', fontSize: '0.95rem'
                                    }}>
                                    <MdEdit /> Edit Profile
                                </button>
                                <button
                                    onClick={() => onDelete(customer._id)}
                                    className="action-btn-danger"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 20px', background: '#fef2f2', color: '#ef4444',
                                        border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s', fontSize: '0.95rem'
                                    }}>
                                    <MdDelete /> Delete
                                </button>
                            </div>
                        </div>

                        {/* Quick Info Grid - Contact & Address */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px',
                            background: '#f8fafc',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0'
                        }}>
                            {/* Contact */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1',
                                    border: '1px solid #e2e8f0', flexShrink: 0
                                }}>
                                    <MdPhone size={20} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Mobile & Contact</span>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                        {customer.mobile || 'No Mobile'}
                                    </div>
                                    {customer.whatsapp && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#25d366' }}>
                                            <MdWhatsapp /> {customer.whatsapp}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1',
                                    border: '1px solid #e2e8f0', flexShrink: 0
                                }}>
                                    <MdLocationOn size={20} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Address</span>
                                    <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
                                        {typeof customer.address === 'object' ? (
                                            <>
                                                {customer.address.street && <span>{customer.address.street},<br /></span>}
                                                {customer.address.addressLine2 && <span>{customer.address.addressLine2},<br /></span>}
                                                {customer.address.taluk && <span>{customer.address.taluk}, </span>}
                                                {customer.address.district && <span>{customer.address.district}</span>}
                                                {(customer.address.pincode || customer.address.state) && <br />}
                                                {customer.address.state && <span>{customer.address.state}</span>}
                                                {customer.address.pincode && <span> - {customer.address.pincode}</span>}
                                            </>
                                        ) : (
                                            customer.address || 'No address provided'
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Summary */}
                            {!hideSubscriptionInfo && (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px', background: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusStyle.color,
                                        border: `1px solid ${statusStyle.border}`, flexShrink: 0
                                    }}>
                                        <MdCreditCard size={20} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Current Status</span>
                                        <div style={{ marginBottom: '6px' }}>
                                            <span style={{
                                                background: statusStyle.bg, color: statusStyle.color,
                                                padding: '4px 10px', borderRadius: '6px',
                                                fontSize: '0.85rem', fontWeight: 700, border: `1px solid ${statusStyle.border}`
                                            }}>
                                                {customer.status || 'New'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {customer.planName ? `${customer.planName}` : 'No Active Plan'}
                                            {customer.nextBillingDate && (
                                                <span style={{ display: 'block', fontSize: '0.8rem', marginTop: '2px', color: '#94a3b8' }}>
                                                    Expires: {new Date(customer.nextBillingDate).toLocaleDateString('en-GB')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Body */}
                    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Subscription History */}
                        {!hideSubscriptionInfo && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MdSubscriptions style={{ color: '#6366f1' }} /> Subscription History
                                </h3>
                                {history.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1 dashed #cbd5e1', color: '#94a3b8' }}>
                                        No subscription history found for this customer.
                                    </div>
                                ) : (
                                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <tr>
                                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Plan / Reference</th>
                                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Start Date</th>
                                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>End Date</th>
                                                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</th>
                                                    {(onEditSubscriptionDate || onDeleteSubscription) && <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((sub, i) => {
                                                    const isExpired = new Date(sub.endDate) < new Date();
                                                    const rowStatus = isExpired && sub.status === 'Active' ? 'Expired' : sub.status;
                                                    const sColor = getStatusColor(rowStatus);

                                                    return (
                                                        <tr
                                                            key={i}
                                                            onClick={() => onOpenSubDetails && onOpenSubDetails(sub)}
                                                            style={{
                                                                borderBottom: i < history.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                cursor: onOpenSubDetails ? 'pointer' : 'default',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            className="sub-history-row"
                                                        >
                                                            <td style={{ padding: '16px 24px' }}>
                                                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{sub.memberTypeId?.name || 'Unknown Plan'}</div>
                                                                {(sub.referenceNo || sub.tempReceiptNo) && (
                                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                        {sub.referenceNo && <span>Ref: {sub.referenceNo}</span>}
                                                                        {sub.tempReceiptNo && <span>Rec: {sub.tempReceiptNo}</span>}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 500 }}>
                                                                {new Date(sub.startDate).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 500 }}>
                                                                {new Date(sub.endDate).toLocaleDateString('en-GB')}
                                                            </td>
                                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    background: sColor.bg, color: sColor.color, border: `1px solid ${sColor.border}`,
                                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700
                                                                }}>
                                                                    {rowStatus}
                                                                </span>
                                                            </td>
                                                            {(onEditSubscriptionDate || onDeleteSubscription) && (
                                                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                                                        {onEditSubscriptionDate && sub.status === 'Active' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); onEditSubscriptionDate(sub, 'startDate'); }}
                                                                                    className="action-icon-btn edit-btn"
                                                                                    title="Edit Start Date"
                                                                                >
                                                                                    <MdEdit size={14} /> Start
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); onEditSubscriptionDate(sub, 'endDate'); }}
                                                                                    className="action-icon-btn edit-btn"
                                                                                    title="Edit End Date"
                                                                                >
                                                                                    <MdEdit size={14} /> End
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {onDeleteSubscription && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onDeleteSubscription(sub._id); }}
                                                                                className="action-icon-btn delete-btn"
                                                                                title="Delete Subscription Record"
                                                                            >
                                                                                <MdDelete size={16} /> Delete
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Advertisement History */}
                        {adHistory && adHistory.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MdCampaign style={{ color: '#8b5cf6' }} /> Advertisement History
                                </h3>
                                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr>
                                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Ad Name</th>
                                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Start Date</th>
                                                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cost</th>
                                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adHistory.map((ad, i) => (
                                                <tr key={i} style={{ borderBottom: i < adHistory.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>{ad.adName || 'Ad #' + ad.adId}</td>
                                                    <td style={{ padding: '16px 24px', color: '#475569' }}>{new Date(ad.startDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>₹{ad.finalRate || 0}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{
                                                            background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700
                                                        }}>
                                                            {ad.status || 'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay { animation: fadeIn 0.2s ease-out; }
                .modal-content { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                
                .modal-close-btn:hover {
                    background: #f8fafc !important;
                    color: #ef4444 !important;
                    transform: scale(1.05);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                }
                .modal-close-btn:active {
                    transform: scale(0.95);
                }
                
                .action-btn-secondary:hover {
                    background: #f8fafc !important;
                    border-color: #94a3b8 !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                }
                .action-btn-danger:hover {
                    background: #fee2e2 !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2) !important;
                }
                
                .action-icon-btn {
                    height: 32px;
                    padding: 0 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                
                .edit-btn {
                    background: #eef2ff;
                    color: #6366f1;
                }
                .edit-btn:hover {
                    background: #6366f1;
                    color: white;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
                }
                
                .delete-btn {
                    background: #fef2f2;
                    color: #ef4444;
                }
                .delete-btn:hover {
                    background: #ef4444;
                    color: white;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
                }
            `}</style>
        </div>
    );
};

export default CustomerDetailModal;
