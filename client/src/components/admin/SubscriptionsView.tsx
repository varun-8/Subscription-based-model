import React from 'react';
import * as XLSX from 'xlsx';
import { MdAutorenew, MdCheckCircle, MdWarning, MdPerson, MdPayment, MdArrowForward, MdDescription, MdFileUpload, MdSearch } from 'react-icons/md';
import './SubscriptionsView.css';

interface SubscriptionsViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    subStatusFilter: string;
    subPlanFilter: string;
    subPaymentFilter?: string;
    memberTypes: any[];
    onFilterChange: (status: string, plan: string, payment: string) => void;
    onAddSubscription?: () => void;
    onOpenSubDetails: (subscription: any) => void;
    onRenewClick: (subscription: any) => void;
    onImport?: () => void;
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
    onImport,
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
            'Customer ID': item.userId?.subscriberNo || '-',
            'Customer Name': item.userId?.name || 'N/A',
            'Mobile': item.userId?.mobile || '-',
            'WhatsApp': item.userId?.whatsapp || '-',
            'Plan': item.memberTypeId?.name || '-',
            'Start Date': new Date(item.startDate).toLocaleDateString('en-GB'),
            'End Date': new Date(item.endDate).toLocaleDateString('en-GB'),
            'Payment Method': item.paymentMethod || '-',
            'Receipt No': item.tempReceiptNo || '-',
            'Status': item.status,
            'Customer Type': item.userId?.customerType || '-',
            'Dispatch Info': item.userId?.dispatchType || 'Post',
            'Street': item.userId?.address?.street || '-',
            'Taluk': item.userId?.address?.taluk || '-',
            'District': item.userId?.address?.district || '-',
            'State': item.userId?.address?.state || '-',
            'Pincode': item.userId?.address?.pincode || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
        XLSX.writeFile(wb, `Subscriptions_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="subscriptions-wrapper">
            {/* Header Section */}
            <div className="subscriptions-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1 className="header-title">Subscriptions</h1>
                        <p className="header-subtitle">Manage subscriber accounts, renewals, and payments</p>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="controls-bar">
                    {/* Search */}
                    <div className="search-box">
                        <MdSearch className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or plan..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Plan Filter */}
                    <select
                        value={subPlanFilter}
                        onChange={(e) => onFilterChange(subStatusFilter, e.target.value, subPaymentFilter || '')}
                        className="filter-select"
                    >
                        <option value="">📋 All Plans</option>
                        {memberTypes.map(type => (
                            <option key={type._id} value={type._id}>{type.name}</option>
                        ))}
                    </select>

                    <div className="divider"></div>

                    {/* Export and Import Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onImport}
                            style={{
                                height: '40px', padding: '0 16px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px',
                                color: '#64748b', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            <MdFileUpload size={20} />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="btn-secondary"
                            title="Export data to Excel"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                            </svg>
                            <span>Export</span>
                        </button>
                    </div>

                    {/* Add New Button */}
                    {onAddSubscription && (
                        <button
                            onClick={onAddSubscription}
                            className="btn-primary"
                            title="Create new subscription"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>New Subscription</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {[
                    { 
                        label: 'Total Customers', 
                        value: stats.all, 
                        filterVal: '', 
                        color: '#3b82f6', 
                        bg: '#eff6ff', 
                        icon: <MdPerson />,
                        trend: 'all customers'
                    },
                    { 
                        label: 'Active', 
                        value: stats.active, 
                        filterVal: 'Active', 
                        color: '#10b981', 
                        bg: '#ecfdf5', 
                        icon: <MdCheckCircle />,
                        trend: 'currently active'
                    },
                    { 
                        label: 'Renewal Needed', 
                        value: stats.renewal, 
                        filterVal: 'Expired', 
                        color: '#ef4444', 
                        bg: '#fef2f2', 
                        icon: <MdWarning />,
                        trend: 'need attention'
                    },
                    { 
                        label: 'Payment Pending', 
                        value: stats.credit, 
                        filterVal: '', 
                        paymentFilter: 'Credit Transaction', 
                        color: '#f59e0b', 
                        bg: '#fffbeb', 
                        icon: <MdPayment />,
                        trend: 'awaiting payment'
                    }
                ].map((stat, i) => {
                    const isActive = subStatusFilter === stat.filterVal && ((!stat.paymentFilter && !subPaymentFilter) || (stat.paymentFilter && subPaymentFilter === stat.paymentFilter));
                    const isRenewalSection = stat.label === 'Renewal Needed';
                    
                    return (
                        <div
                            key={i}
                            className={`stat-card ${isActive ? 'active' : ''} ${isRenewalSection ? 'stat-card-renewal' : ''}`}
                            onClick={() => onFilterChange(stat.filterVal, subPlanFilter, stat.paymentFilter || '')}
                            style={{ borderColor: isActive ? stat.color : undefined }}
                        >
                            <div className="stat-header">
                                <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                                    {React.cloneElement(stat.icon as any, { size: 24 })}
                                </div>
                                {isActive && <div className="stat-indicator" style={{ boxShadow: `0 0 0 4px ${stat.bg}`, background: stat.color }}></div>}
                            </div>
                            <div className="stat-body">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-trend">{stat.trend}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Table Section */}
            <div className="table-wrapper">
                {filteredData.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <MdDescription size={40} />
                        </div>
                        <p className="empty-title">No subscriptions found</p>
                        <p className="empty-subtitle">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="subscriptions-table">
                            <thead>
                                <tr>
                                    <th className="col-id">Subscription ID</th>
                                    <th className="col-customer">Customer</th>
                                    <th className="col-plan">Plan</th>
                                    <th className="col-dates">Duration</th>
                                    <th className="col-status">Status</th>
                                    <th className="col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, i) => {
                                    const isExpired = new Date(item.endDate) < new Date();
                                    const daysRemaining = Math.ceil((new Date(item.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr
                                            key={i}
                                            className="subscription-row"
                                            onClick={() => onOpenSubDetails(item)}
                                        >
                                            <td className="col-id">
                                                <div className="id-badge">
                                                    #{item.subscriptionId ? item.subscriptionId : (item._id ? item._id.substring(0, 6).toUpperCase() : 'N/A')}
                                                </div>
                                            </td>
                                            <td className="col-customer">
                                                <div className="customer-info">
                                                    <div className="customer-name">{item.userId?.name || 'Unknown'}</div>
                                                    <div className="customer-mobile">{item.userId?.mobile || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="col-plan">
                                                <span className="plan-badge">
                                                    {item.memberTypeId?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="col-dates">
                                                <div className="date-info">
                                                    <div className="date-item">
                                                        <span className="date-label">End Date</span>
                                                        <span className="date-value">{new Date(item.endDate).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                    {daysRemaining < 30 && daysRemaining >= 0 && (
                                                        <div className="days-remaining">
                                                            ⏱️ {daysRemaining} days left
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="col-status">
                                                <div className="status-wrapper">
                                                    <span className={`status-badge status-${item.status === 'Terminated' ? 'terminated' :
                                                        item.status === 'Paused' ? 'paused' :
                                                            isExpired ? 'expired' : 'active'}`}>
                                                        {item.status === 'Terminated' ? '⊘ Terminated' :
                                                            isExpired ? '⚠️ Renewal Needed' :
                                                                item.status === 'Paused' ? '⏸️ Paused' : '✓ Active'}
                                                    </span>
                                                    {item.paymentMethod === 'Credit Transaction' && (
                                                        <span className="payment-badge">Unpaid</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="col-actions">
                                                <div className="actions-wrapper">
                                                    {isExpired && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRenewClick(item); }}
                                                            className="btn-renew"
                                                            title="Renew subscription"
                                                        >
                                                            <MdAutorenew size={14} />
                                                            <span>Renew</span>
                                                        </button>
                                                    )}
                                                    <div className="action-indicator">
                                                        <MdArrowForward size={18} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionsView;
