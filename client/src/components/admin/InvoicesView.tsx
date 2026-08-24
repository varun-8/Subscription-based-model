import React, { useState } from 'react';
import {
    MdReceipt, MdSearch, MdEdit, MdDelete, MdFilterList,
    MdCheckCircle, MdCancel, MdFileDownload,
    MdDateRange, MdConfirmationNumber, MdCategory, MdShoppingBag, MdAccessTime
} from 'react-icons/md';
import './InvoicesView.css';

interface InvoicesViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    onDownloadPDF: (invoice: any) => void;
    onUpdateStatus?: (id: string, status: string) => void;
    onDeleteInvoice?: (id: string) => void;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({
    data, filter, setFilter, onDownloadPDF, onUpdateStatus, onDeleteInvoice
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const handleEditClick = (item: any) => {
        setEditingId(item._id);
        setEditStatus(item.status);
    };

    const handleSave = (id: string) => {
        if (onUpdateStatus) onUpdateStatus(id, editStatus);
        setEditingId(null);
    };

    const filteredData = data.filter(item => {
        // Category/Type Filter
        if (categoryFilter !== 'All') {
            if (categoryFilter === 'Credit') {
                if (item.paymentMethod !== 'Credit Transaction') return false;
            } else {
                const cat = item.category || 'Subscription'; // Legacy support
                if (cat !== categoryFilter) return false;
            }
        }

        if (!filter) return true;
        const searchStr = `${item.invoiceNumber || ''} ${item.userId?.name || ''} ${item.customerName || ''} ${item.userId?.subscriberNo || ''}`.toLowerCase();
        return searchStr.includes(filter.toLowerCase());
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


    const getSubscriptionStatus = (invoice: any) => {
        const sub = invoice.subscriptionId;
        if (!sub) return invoice.category || 'N/A';
        if (sub.status === 'Terminated') return 'Terminated';
        if (sub.status === 'Paused') return 'Paused';
        if (sub.status === 'Pending') return 'Not Active';
        const endDate = new Date(sub.endDate);
        if (endDate < new Date()) return 'Renew Needed';
        return 'Active';
    };

    return (
        <div className="invoices-view">
            <div className="view-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Invoices
                    </h1>
                </div>


                <div className="view-actions" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <MdSearch size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by ID, name, or subscriber number..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                height: '42px',
                                width: '100%',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                paddingLeft: '40px',
                                paddingRight: '12px',
                                backgroundColor: '#f8fafc',
                                color: '#1e293b',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontWeight: 500
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }}></div>

                    <div style={{ position: 'relative' }}>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                minWidth: '180px',
                                height: '42px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '0 32px 0 12px',
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                fontSize: '0.9rem',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: 500,
                                appearance: 'none'
                            }}
                        >
                            <option value="All">All Categories</option>
                            <option value="Subscription">Subscription</option>
                            <option value="Advertisement">Advertisement</option>
                            <option value="Credit">Credit Transactions</option>
                        </select>
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                            <MdFilterList />
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container shadow-premium" style={{ width: '100%', border: 'none', background: 'white', borderRadius: '20px', overflow: 'hidden' }}>
                {filteredData.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ marginBottom: '1rem', background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <MdReceipt size={32} color="#cbd5e1" />
                        </div>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>No invoices found</h3>
                        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '24px' }}>Invoice ID</th>
                                <th>Customer (Sub#)</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Payment Status</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, i) => {
                                const subStatus = getSubscriptionStatus(item);
                                const isEditing = editingId === item._id;
                                const isSelected = selectedId === item._id;

                                let typeText = subStatus;
                                let typeClass = '';
                                const isAd = item.category === 'Advertisement' || (item.items && item.items[0] && item.items[0].description && item.items[0].description.startsWith('Advertisement:'));
                                const isCredit = item.paymentMethod === 'Credit Transaction';

                                if (isAd) {
                                    typeText = 'Advertisement';
                                    typeClass = 'status-ad';
                                } else {
                                    typeText = subStatus === 'Active' ? 'Subscription' : subStatus;
                                    typeClass = subStatus === 'Active' ? 'status-active' :
                                        (subStatus === 'Renew Needed' || subStatus === 'Not Active' || subStatus === 'Paused') ? 'status-warning' :
                                            'status-terminated';
                                }

                                const isPaid = item.status === 'Paid';
                                const paymentStatusColor = isPaid ? '#10b981' : item.status === 'Overdue' ? '#ef4444' : '#f59e0b';
                                const paymentStatusBg = isPaid ? '#ecfdf5' : item.status === 'Overdue' ? '#fef2f2' : '#fffbeb';

                                return (
                                    <React.Fragment key={i}>
                                        <tr
                                            onClick={() => setSelectedId(isSelected ? null : item._id)}
                                            style={{
                                                cursor: 'pointer',
                                                background: isSelected ? '#f8fafc' : 'white',
                                                transition: 'all 0.1s',
                                                borderLeft: isCredit ? '4px solid #f59e0b' : '4px solid transparent'
                                            }}
                                            className="row-clickable"
                                        >
                                            <td style={{ paddingLeft: '24px', fontWeight: 600, color: '#6366f1' }}>
                                                #{item.invoiceNumber || item._id.substring(0, 8)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {item.userId?.name || item.customerName || 'N/A'}
                                                    </span>
                                                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                                                        {item.userId?.subscriberNo ? `Sub ID: ${item.userId.subscriberNo}` : 'Retail Customer'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{(Number(item.amount) || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#475569', fontWeight: 500 }}>
                                                {new Date(item.dateIssued).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className={`status-pill ${typeClass}`}>
                                                        <span className="status-dot"></span>
                                                        {typeText}
                                                    </span>
                                                    {isCredit && (
                                                        <span style={{
                                                            fontSize: '0.65rem', color: '#b45309', background: '#fffbeb',
                                                            padding: '2px 6px', borderRadius: '4px', border: '1px solid #fef3c7',
                                                            width: 'fit-content', fontWeight: 600
                                                        }}>
                                                            CREDIT
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <select
                                                        value={editStatus}
                                                        onChange={e => setEditStatus(e.target.value)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="custom-select"
                                                        style={{
                                                            padding: '4px 8px', fontSize: '0.8rem', borderRadius: '6px',
                                                            width: 'auto', minWidth: '100px'
                                                        }}
                                                    >
                                                        <option value="Unpaid">Unpaid</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Overdue">Overdue</option>
                                                    </select>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{
                                                            color: paymentStatusColor, background: paymentStatusBg,
                                                            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem',
                                                            fontWeight: 700, display: 'inline-flex', alignItems: 'center',
                                                            gap: '6px', width: 'fit-content'
                                                        }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: paymentStatusColor }}></div>
                                                            {item.status}
                                                        </span>
                                                        {item.paymentMethod && (
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '6px', fontWeight: 500 }}>
                                                                via {item.paymentMethod}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#e2e8f0' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                        <path d="M6 9l6 6 6-6"></path>
                                                    </svg>
                                                </div>
                                            </td>
                                        </tr>
                                        {isSelected && (
                                            <tr>
                                                <td colSpan={7} style={{ padding: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                                                        {/* Horizontal Layout Container */}
                                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'stretch' }}>

                                                            {/* Card 1: Payment Details */}
                                                            <div style={{
                                                                flex: 1, minWidth: '280px', background: 'white', borderRadius: '16px',
                                                                padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0'
                                                            }}>
                                                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <MdReceipt /> Payment Details
                                                                </h3>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Reference (UTR)</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <MdConfirmationNumber size={16} color="#94a3b8" /> {item.referenceNo || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }}></div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Receipt No</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{item.tempReceiptNo || 'N/A'}</span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }}></div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Payment Date</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <MdDateRange size={16} color="#94a3b8" />
                                                                            {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-GB') : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Card 2: Invoice Info */}
                                                            <div style={{
                                                                flex: 1, minWidth: '280px', background: 'white', borderRadius: '16px',
                                                                padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0'
                                                            }}>
                                                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <MdAccessTime /> Invoice Info
                                                                </h3>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Created On</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }}></div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Items</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <MdShoppingBag size={16} color="#94a3b8" /> {item.items?.length || 0} items
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }}></div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Category</span>
                                                                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <MdCategory size={16} color="#94a3b8" /> {item.category || 'Subscription'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Card 3: Actions */}
                                                            <div style={{
                                                                flex: 0.8, minWidth: '220px',
                                                                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px'
                                                            }}>
                                                                {isEditing ? (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleSave(item._id); }}
                                                                            style={{
                                                                                width: '100%', padding: '14px', background: '#10b981', color: 'white',
                                                                                border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                                                                            }}
                                                                        >
                                                                            <MdCheckCircle size={20} /> Save Changes
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                                                            style={{
                                                                                width: '100%', padding: '14px', background: 'white', color: '#64748b',
                                                                                border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                                            }}
                                                                        >
                                                                            <MdCancel size={20} /> Cancel
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); onDownloadPDF(item); }}
                                                                            style={{
                                                                                width: '100%', padding: '14px', background: 'white', color: '#334155',
                                                                                border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                        >
                                                                            <MdFileDownload size={20} color="#6366f1" /> Download PDF
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                                            style={{
                                                                                width: '100%', padding: '14px', background: 'white', color: '#334155',
                                                                                border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                        >
                                                                            <MdEdit size={18} color="#0ea5e9" /> Update Status
                                                                        </button>
                                                                        {onDeleteInvoice && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onDeleteInvoice(item._id); }}
                                                                                style={{
                                                                                    width: '100%', padding: '14px', background: '#fef2f2', color: '#ef4444',
                                                                                    border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                    transition: 'all 0.2s'
                                                                                }}
                                                                            >
                                                                                <MdDelete size={18} /> Delete Invoice
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-select {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1.5em 1.5em;
                    padding-right: 2.5rem;
                    -webkit-appearance: none;
                    appearance: none;
                }
            `}</style>
        </div>
    );
};

export default InvoicesView;
