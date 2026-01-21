import React from 'react';
import * as XLSX from 'xlsx';
import { MdAutorenew, MdCheckCircle, MdWarning, MdPerson, MdPayment, MdArrowForward, MdDescription } from 'react-icons/md';

interface SubscriptionsViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    subStatusFilter: string;
    subPlanFilter: string; // New
    subPaymentFilter?: string;
    memberTypes: any[]; // New
    onFilterChange: (status: string, plan: string, payment: string) => void;
    onAddSubscription?: () => void;
    onOpenSubDetails: (subscription: any) => void;
    onRenewClick: (subscription: any) => void;
    globalStats?: {
        allSubscriptions: number;
        activeSubscriptions: number;
        renewalNeededSubscriptions: number;
        totalSubscribers?: number;
    };
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
    data, filter, setFilter,
    subStatusFilter, subPlanFilter, subPaymentFilter, memberTypes, onFilterChange,
    onAddSubscription,
    onOpenSubDetails,
    onRenewClick,
    globalStats
}) => {




    const filteredData = data.filter(item => {
        if (!filter) return true;
        const str = JSON.stringify(item).toLowerCase();
        return str.includes(filter.toLowerCase());
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Count unique customers for subscription stats
    const uniqueCustomers = new Set(data.map(item => item.userId?._id?.toString()).filter(id => id));
    const activeSubscriptions = data.filter(item => {
        const isExpired = new Date(item.endDate) < new Date();
        return item.status === 'Active' && !isExpired;
    });
    const uniqueActiveCustomers = new Set(activeSubscriptions.map(item => item.userId?._id?.toString()).filter(id => id));

    const stats = {
        all: globalStats?.totalSubscribers ?? uniqueCustomers.size,
        active: globalStats?.activeSubscriptions ?? uniqueActiveCustomers.size,
        renewal: globalStats?.renewalNeededSubscriptions ?? 0,
        credit: data.filter(item => item.paymentMethod === 'Credit Transaction').length
    };



    const handleExportExcel = () => {
        const exportData = filteredData.map(item => ({
            'Sub ID': item.subscriptionId || item._id,
            'Ref No': item.referenceNo || '-',
            'Customer Name': item.userId?.name || 'N/A',
            'Mobile': item.userId?.mobile || '-',
            'Plan': item.memberTypeId?.name || '-',
            'Start Date': new Date(item.startDate).toLocaleDateString('en-GB'),
            'End Date': new Date(item.endDate).toLocaleDateString('en-GB'),
            'Status': item.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
        XLSX.writeFile(wb, `Subscriptions_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div style={{ padding: '2rem' }}>

            {/* Header & Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Subscriptions
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                        Manage subscriber accounts, renewals, and payments
                    </p>
                </div>

                <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center', background: 'white',
                    padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    {/* Search */}
                    <div className="search-wrapper" style={{ margin: 0, width: '240px' }}>
                        <div className="input-icon" style={{ left: '12px', color: '#94a3b8' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                height: '40px', paddingLeft: '40px', paddingRight: '12px', width: '100%',
                                background: '#f8fafc', border: 'none', borderRadius: '12px', fontSize: '0.9rem',
                                color: '#334155', fontWeight: 500, outline: 'none'
                            }}
                        />
                    </div>

                    {/* Plan Filter */}
                    <select
                        value={subPlanFilter}
                        onChange={(e) => onFilterChange(subStatusFilter, e.target.value, subPaymentFilter || '')}
                        style={{
                            height: '40px', padding: '0 32px 0 16px', background: '#f8fafc', border: 'none', borderRadius: '12px',
                            fontSize: '0.9rem', color: '#334155', fontWeight: 500, cursor: 'pointer', outline: 'none',
                            appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e")`,
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px'
                        }}
                    >
                        <option value="">All Plans</option>
                        {memberTypes.map(type => (
                            <option key={type._id} value={type._id}>{type.name}</option>
                        ))}
                    </select>

                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }}></div>

                    {/* Export */}
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                        </svg>
                        Export
                    </button>

                    {/* Add New */}
                    {onAddSubscription && (
                        <button
                            onClick={onAddSubscription}
                            style={{
                                height: '40px', padding: '0 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px',
                                fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            New
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Customers', value: stats.all, filterVal: '', color: '#3b82f6', bg: '#eff6ff', icon: <MdPerson /> },
                    { label: 'Active', value: stats.active, filterVal: 'Active', color: '#10b981', bg: '#ecfdf5', icon: <MdCheckCircle /> },
                    { label: 'Renewal Needed', value: stats.renewal, filterVal: 'Expired', color: '#ef4444', bg: '#fef2f2', icon: <MdWarning /> },
                    { label: 'Payment Pending', value: stats.credit, filterVal: '', paymentFilter: 'Credit Transaction', color: '#f59e0b', bg: '#fffbeb', icon: <MdPayment /> }
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => onFilterChange(stat.filterVal, subPlanFilter, stat.paymentFilter || '')}
                        style={{
                            background: 'white', padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                            border: `1px solid ${subStatusFilter === stat.filterVal && ((!stat.paymentFilter && !subPaymentFilter) || (stat.paymentFilter && subPaymentFilter === stat.paymentFilter)) ? stat.color : '#e2e8f0'}`,
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
                            {subStatusFilter === stat.filterVal && ((!stat.paymentFilter && !subPaymentFilter) || (stat.paymentFilter && subPaymentFilter === stat.paymentFilter)) && (
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
                {filteredData.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ marginBottom: '1rem', background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <MdDescription size={32} color="#cbd5e1" />
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No subscriptions found</p>
                        <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0' }}>Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Plan</th>
                                <th>Dates</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, i) => {
                                const isExpired = new Date(item.endDate) < new Date();

                                const daysRemaining = Math.ceil((new Date(item.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                return (
                                    <React.Fragment key={i}>
                                        <tr
                                            onClick={() => onOpenSubDetails(item)}
                                            style={{
                                                cursor: 'pointer', background: 'white',
                                                transition: 'all 0.1s'
                                            }}
                                            className="row-clickable"
                                        >
                                            <td style={{ fontWeight: 600, color: '#3b82f6', fontSize: '0.9rem' }}>
                                                #{item.subscriptionId ? item.subscriptionId : (item._id ? item._id.substring(0, 6).toUpperCase() : 'N/A')}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.userId?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{item.userId?.mobile || '-'}</div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    background: '#f1f5f9', color: '#475569', padding: '4px 10px',
                                                    borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600
                                                }}>
                                                    {item.memberTypeId?.name || '-'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.9rem', color: '#334155' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Ends</span>
                                                    <span style={{ fontWeight: 500 }}>{new Date(item.endDate).toLocaleDateString('en-GB')}</span>
                                                </div>
                                                {daysRemaining < 30 && daysRemaining >= 0 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
                                                        {daysRemaining} days left
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{
                                                        padding: '6px 14px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                                                        background: item.status === 'Terminated' ? '#f1f5f9' :
                                                            item.status === 'Paused' ? '#fffbeb' :
                                                                isExpired ? '#fef2f2' : '#ecfdf5',
                                                        color: item.status === 'Terminated' ? '#64748b' :
                                                            item.status === 'Paused' ? '#b45309' :
                                                                isExpired ? '#ef4444' : '#10b981',
                                                        border: `1px solid ${item.status === 'Terminated' ? '#e2e8f0' :
                                                            item.status === 'Paused' ? '#fcd34d' :
                                                                isExpired ? '#fecaca' : '#a7f3d0'}`
                                                    }}>
                                                        {item.status === 'Terminated' ? 'Terminated' : isExpired ? 'Renewal Needed' : item.status}
                                                    </span>
                                                    {item.paymentMethod === 'Credit Transaction' && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Unpaid</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    {isExpired && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRenewClick(item); }}
                                                            style={{
                                                                padding: '6px 14px', border: 'none', borderRadius: '8px',
                                                                background: '#0f172a', color: 'white', fontWeight: 600,
                                                                cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                                                            }}
                                                        >
                                                            <MdAutorenew size={14} /> Renew
                                                        </button>
                                                    )}
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                                        color: '#94a3b8'
                                                    }}>
                                                        <MdArrowForward size={18} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SubscriptionsView;
