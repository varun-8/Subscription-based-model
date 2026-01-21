import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
    MdCampaign, MdPerson, MdPayment, MdWarning,
    MdAdd, MdFileDownload, MdSearch, MdFilterList, MdEdit,
    MdDelete, MdDescription, MdReceipt
} from 'react-icons/md';

interface AdsProps {
    data: any[];
    onAdd: () => void;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onInvoice: (item: any) => void; // Generates ad-based PDF
    onDownloadRealInvoice: (invoice: any) => void; // Downloads actual system invoice
    onClientClick: (item: any) => void; // New prop for history
    onQuickUpdatePayment: (id: string, method: string) => void;
    adTypes: any[];
    onAddCustomer: () => void;
    allCustomers: any[]; // New prop to show clients list
}

const AdvertisementsView: React.FC<AdsProps> = ({ data, onAdd, onEdit, onDelete, onInvoice, onClientClick, onQuickUpdatePayment, adTypes, onAddCustomer, allCustomers }) => {
    const [viewMode, setViewMode] = useState<'ads' | 'clients'>('ads');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [selectedAdFilter, setSelectedAdFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Modal State for Account Transfer
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
    const [transferType, setTransferType] = useState('');

    const filteredData = data.filter(item => {
        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesName = item.clientName?.toLowerCase().includes(q);
            const matchesAd = item.adName?.toLowerCase().includes(q);
            const matchesType = item.types?.some((t: string) => t.toLowerCase().includes(q));

            if (!matchesName && !matchesAd && !matchesType) return false;
        }

        if (selectedAdFilter && selectedAdFilter !== 'All') {
            const matchesAdFilter = item.types?.some((t: string) => t === selectedAdFilter);
            if (!matchesAdFilter) return false;
        }

        // Month Filter
        if (monthFilter !== 'All') {
            const date = item.startDate ? new Date(item.startDate) : null;
            if (!date) return false;

            const monthName = months[date.getMonth()];
            if (monthName !== monthFilter) return false;
        }

        if (paymentFilter === 'All') return true;
        if (paymentFilter === 'Credit Transaction') {
            return item.paymentMethod === 'Credit Transaction';
        }
        if (paymentFilter === 'Account Transfer') {
            return item.paymentMethod && item.paymentMethod.startsWith('Account Transfer');
        }
        return item.paymentMethod === paymentFilter;
    }).sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    const handleExportExcel = () => {
        const exportData = filteredData.map(item => ({
            'Client Name': item.clientName,
            'Ref No': item.referenceNo || '-',
            'Ad Name': item.adName,
            'Page Size': item.pageSize || '-',
            'Qty': item.qty || 1,
            'Types': (item.types || []).join(', '),
            'Price': item.price,
            'Start Date': item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : '-',
            'End Date': item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : '-',
            'Payment Method': item.paymentMethod || 'Unpaid',
            'Status': item.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Advertisements");
        XLSX.writeFile(wb, `Advertisements_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const stats = {
        all: data.length,
        credit: data.filter(item => item.paymentMethod === 'Credit Transaction').length,
        customers: allCustomers.filter(c => c.customerType === 'Advertisement').length
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        {viewMode === 'ads' ? 'Advertisement Hub' : 'Advertisement Clients'}
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                        {viewMode === 'ads' ? 'Manage ad campaigns, client billings, and payments' : 'Directory of all advertisement customers'}
                    </p>
                </div>

                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: 'white',
                    padding: '8px', borderRadius: '18px', border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {viewMode === 'clients' && (
                            <button
                                onClick={() => setViewMode('ads')}
                                style={{
                                    height: '40px', padding: '0 16px', background: '#f1f5f9', border: 'none', borderRadius: '12px',
                                    color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ← Back
                            </button>
                        )}
                        {/* Search */}
                        <div className="search-wrapper" style={{ margin: 0, width: '220px' }}>
                            <div className="input-icon" style={{ left: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdSearch size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder={viewMode === 'ads' ? "Search..." : "Search clients..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    height: '40px', paddingLeft: '40px', paddingRight: '12px', width: '100%',
                                    background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '0.9rem',
                                    color: '#334155', fontWeight: 500, outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {viewMode === 'ads' && (
                        <>
                            <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }}></div>

                            {/* Filter Group: Payment & Category */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={paymentFilter}
                                        onChange={(e) => setPaymentFilter(e.target.value)}
                                        style={{
                                            height: '40px', padding: '0 32px 0 12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px',
                                            fontSize: '0.85rem', color: '#475569', fontWeight: 600, cursor: 'pointer', outline: 'none',
                                            appearance: 'none', minWidth: '140px'
                                        }}
                                    >
                                        <option value="All">All Payments</option>
                                        <option value="Cash">Cash</option>
                                        <option value="GPay">GPay</option>
                                        <option value="Account Transfer">Bank Trans.</option>
                                        <option value="Credit Transaction">Credit</option>
                                    </select>
                                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                                        <MdFilterList size={16} />
                                    </div>
                                </div>

                                {paymentFilter !== 'Credit Transaction' && (
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedAdFilter}
                                            onChange={(e) => setSelectedAdFilter(e.target.value)}
                                            style={{
                                                height: '40px', padding: '0 32px 0 12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px',
                                                fontSize: '0.85rem', color: '#475569', fontWeight: 600, cursor: 'pointer', outline: 'none',
                                                appearance: 'none', minWidth: '130px'
                                            }}
                                        >
                                            <option value="All">All Types</option>
                                            {adTypes.map((type) => (
                                                <option key={type._id} value={type.name}>{type.name}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                                            <MdFilterList size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {paymentFilter !== 'Credit Transaction' && (
                                <>
                                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }}></div>

                                    {/* Filter Group: Date */}
                                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={monthFilter}
                                                onChange={(e) => setMonthFilter(e.target.value)}
                                                style={{
                                                    height: '32px', padding: '0 28px 0 10px', background: 'white', border: 'none', borderRadius: '8px',
                                                    fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer', outline: 'none',
                                                    appearance: 'none', minWidth: '120px'
                                                }}
                                            >
                                                <option value="All">All Months</option>
                                                {months.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                                                <MdFilterList size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(paymentFilter !== 'All' || selectedAdFilter !== 'All' || monthFilter !== 'All' || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setPaymentFilter('All');
                                        setSelectedAdFilter('All');
                                        setMonthFilter('All');
                                        setSearchQuery('');
                                    }}
                                    style={{
                                        height: '32px', padding: '0 12px', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px',
                                        color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Reset
                                </button>
                            )}
                        </>
                    )}

                    {/* Actions */}
                    <button
                        onClick={handleExportExcel}
                        style={{
                            height: '40px', padding: '0 16px', background: 'transparent', border: '1px solid transparent', borderRadius: '10px',
                            color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        <MdFileDownload size={20} /> Export Excel
                    </button>

                    <button
                        onClick={onAddCustomer}
                        style={{
                            height: '40px', padding: '0 20px', background: '#3b82f6', border: 'none', borderRadius: '12px',
                            color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)', transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <MdPerson size={20} /> New Customer
                    </button>

                    <button
                        onClick={onAdd}
                        style={{
                            height: '40px', padding: '0 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        <MdAdd size={20} /> New Ad
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Clients', value: stats.customers, icon: <MdPerson />, color: '#3b82f6', bg: '#eff6ff', action: () => setViewMode('clients'), isActive: viewMode === 'clients' },
                    { label: 'Total Ads', value: stats.all, icon: <MdCampaign />, color: '#6366f1', bg: '#eef2ff', action: () => setViewMode('ads'), isActive: viewMode === 'ads' },
                    { label: 'Payment Pending', value: stats.credit, icon: <MdPayment />, color: '#f59e0b', bg: '#fffbeb', action: () => { setViewMode('ads'); setPaymentFilter('Credit Transaction'); }, isActive: paymentFilter === 'Credit Transaction' && viewMode === 'ads' }
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={stat.action}
                        style={{
                            background: 'white', padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                            border: `1px solid ${stat.isActive ? stat.color : '#e2e8f0'}`,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{
                                padding: '10px', borderRadius: '12px', background: stat.bg, color: stat.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {React.cloneElement(stat.icon as any, { size: 24 })}
                            </div>
                            {stat.isActive && (
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%', background: stat.color,
                                    boxShadow: `0 0 0 4px ${stat.bg}`
                                }}></div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="table-container shadow-premium" style={{ width: '100%', border: 'none', background: 'white', borderRadius: '20px' }}>
                {viewMode === 'ads' ? (
                    filteredData.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ marginBottom: '1rem', background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <MdCampaign size={32} color="#cbd5e1" />
                            </div>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>No advertisements found</h3>
                            <p style={{ margin: '0.5rem 0 0' }}>Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>Ad Name</th>
                                    <th>Size</th>
                                    <th>Qty</th>
                                    <th>Types</th>
                                    <th>Price</th>
                                    <th>Payment</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, i) => {
                                    const isSelected = selectedId === item._id;
                                    return (
                                        <React.Fragment key={i}>
                                            <tr
                                                onClick={() => setSelectedId(isSelected ? null : item._id)}
                                                style={{
                                                    cursor: 'pointer', background: isSelected ? '#f8fafc' : 'white',
                                                    transition: 'all 0.1s'
                                                }}
                                                className="row-clickable"
                                            >
                                                <td style={{ fontWeight: 600, color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); onClientClick(item); }}>
                                                    {item.clientName}
                                                </td>
                                                <td style={{ color: '#475569' }}>{item.adName || '-'}</td>
                                                <td>{item.pageSize || '-'}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        {item.qty || 1}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.types && item.types.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            {item.types.map((t: string, idx: number) => (
                                                                <span key={idx} style={{
                                                                    background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                                                                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
                                                                }}>
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ fontWeight: 600, color: '#0f172a' }}>₹{item.price}</td>
                                                <td>
                                                    {item.paymentMethod ? (
                                                        <span className={`status-pill ${item.paymentMethod === 'Credit Transaction' ? 'status-warning' : 'status-active'}`}>
                                                            <span className="status-dot"></span>
                                                            {item.paymentMethod}
                                                        </span>
                                                    ) : '-'}
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
                                                    <td colSpan={8} style={{ padding: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                        <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                                                                {/* Actions Card */}
                                                                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Management</h3>

                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); onInvoice(item); }}
                                                                            style={{
                                                                                width: '100%', padding: '12px', background: 'white', color: '#334155',
                                                                                border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                        >
                                                                            <MdDescription style={{ color: '#0ea5e9' }} /> Generate Invoice
                                                                        </button>

                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                                                style={{
                                                                                    padding: '12px', background: 'white', color: '#334155',
                                                                                    border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                                            >
                                                                                <MdEdit /> Edit Result
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
                                                                                style={{
                                                                                    padding: '12px', background: '#fef2f2', color: '#ef4444',
                                                                                    border: '1px solid #fee2e2', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                                                }}
                                                                            >
                                                                                <MdDelete /> Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Details Card */}
                                                                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ad Details</h3>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Date Range</div>
                                                                            <div style={{ fontWeight: 600, color: '#334155' }}>
                                                                                {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} — {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Reference</div>
                                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{item.referenceNo || 'N/A'}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Dimensions</div>
                                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{item.pageSize || '-'}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Total Price</div>
                                                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{item.price}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Payment Status (Only if Credit) */}
                                                                {item.paymentMethod === 'Credit Transaction' && (
                                                                    <div style={{
                                                                        background: '#fffbeb', padding: '20px', borderRadius: '16px',
                                                                        border: '1px solid #fcd34d', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                                    }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#b45309', fontWeight: 600 }}>
                                                                            <MdWarning size={20} /> Payment Pending
                                                                        </div>

                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                            <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                                                                Select a method to settle this payment:
                                                                            </div>
                                                                            <select
                                                                                value=""
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    if (!val) return;
                                                                                    if (val === 'Account Transfer') {
                                                                                        setTransferTargetId(item._id);
                                                                                        setTransferType('');
                                                                                        setShowTransferModal(true);
                                                                                    } else {
                                                                                        if (window.confirm(`Mark this advertisement as paid via ${val}?`)) {
                                                                                            onQuickUpdatePayment(item._id, val);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="custom-select"
                                                                                style={{ width: '100%', background: 'white' }}
                                                                            >
                                                                                <option value="">Select Method...</option>
                                                                                <option value="Cash">Cash</option>
                                                                                <option value="GPay">GPay</option>
                                                                                <option value="Account Transfer">Account Transfer</option>
                                                                                <option value="Money Order">Money Order</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                )}

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
                    )
                ) : (
                    /* Client List View */
                    <div style={{ padding: '0' }}>
                        {allCustomers.filter(c => c.customerType === 'Advertisement').length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ marginBottom: '1rem', background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <MdPerson size={32} color="#cbd5e1" />
                                </div>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>No advertisement clients found</h3>
                                <p style={{ margin: '0.5rem 0 0' }}>Add a new advertisement client to get started</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Contact</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th style={{ width: '180px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allCustomers
                                        .filter(c => c.customerType === 'Advertisement')
                                        .filter(c => {
                                            if (!searchQuery) return true;
                                            const q = searchQuery.toLowerCase();
                                            return c.name.toLowerCase().includes(q) || c.mobile?.includes(q);
                                        })
                                        .sort((a, b) => {
                                            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                                            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                                            return dateB - dateA;
                                        })
                                        .map((client, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600, color: '#1e293b' }}>{client.name}</td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>{client.mobile || '-'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{client.whatsapp || '-'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem' }}>{client.address?.taluk || client.address?.district || '-'}</div>
                                                </td>
                                                <td>
                                                    <span className="status-pill status-active">
                                                        <span className="status-dot"></span>
                                                        Active
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => onClientClick({ userId: client })}
                                                        style={{
                                                            padding: '6px 12px', background: '#eff6ff', color: '#2563eb',
                                                            border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                    >
                                                        <MdDescription /> History
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Account Transfer Dialog */}
            {showTransferModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '2rem',
                        width: '100%', maxWidth: '400px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#3b82f6', fontSize: '1.5rem'
                            }}>
                                <MdReceipt />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Transfer Details</h3>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Specify the transfer method</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                                Transfer Type (e.g. DD, NEFT, UPI)
                            </label>
                            <select
                                autoFocus
                                value={transferType}
                                onChange={(e) => setTransferType(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', fontSize: '1rem',
                                    background: '#f8fafc', color: '#334155',
                                    outline: 'none', transition: 'border-color 0.2s',
                                    cursor: 'pointer'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && transferType) {
                                        if (transferTargetId) {
                                            onQuickUpdatePayment(transferTargetId, `Account Transfer - ${transferType}`);
                                            setShowTransferModal(false);
                                        }
                                    }
                                }}
                            >
                                <option value="">Select Mode</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="DD">DD</option>
                                <option value="NEFT">NEFT</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                style={{
                                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                                    fontWeight: 600, color: '#64748b', background: 'transparent',
                                    border: 'none', cursor: 'pointer', fontSize: '0.95rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (transferTargetId && transferType) {
                                        onQuickUpdatePayment(transferTargetId, `Account Transfer - ${transferType}`);
                                        setShowTransferModal(false);
                                    }
                                }}
                                disabled={!transferType}
                                style={{
                                    padding: '0.75rem 1.5rem', borderRadius: '12px',
                                    fontWeight: 600, color: 'white',
                                    background: transferType ? '#3b82f6' : '#94a3b8',
                                    border: 'none', cursor: transferType ? 'pointer' : 'not-allowed',
                                    fontSize: '0.95rem',
                                    boxShadow: transferType ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none'
                                }}
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvertisementsView;
