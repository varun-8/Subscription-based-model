import React from 'react';
import * as XLSX from 'xlsx';
import { MdSearch, MdAdd, MdFileDownload, MdGroups, MdFileUpload } from 'react-icons/md';

interface CustomersViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    customerFilterType: string;
    setCustomerFilterType: (val: string) => void;
    onAddCustomer: () => void;
    onOpenDetails: (customer: any) => void;
    onImport?: () => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({
    data, filter, setFilter,
    customerFilterType, setCustomerFilterType,
    onAddCustomer, onOpenDetails, onImport
}) => {
    const getAddressPreview = (item: any) => {
        const addressParts = [
            item.address?.street,
            item.address?.addressLine2,
            item.address?.taluk
        ].filter(Boolean);

        return addressParts.length > 0 ? addressParts.join(', ') : '--';
    };

    const filteredData = data.filter(item => {
        // 'Other' filter shows Admins
        if (customerFilterType === 'Other') {
            return item.role === 'admin';
        }

        // All other filters show only Customers
        if (item.role === 'admin') return false;

        if (customerFilterType === 'Renew Needed') {
            if (item.status !== 'Renew Needed') return false;
        } else if (customerFilterType === 'No Subscription') {
            if (item.nextBillingDate || (item.status && item.status !== 'New')) return false;
        } else if (['Subscription', 'Advertisement', 'Kovil', 'Nagarathaar Sangam'].includes(customerFilterType)) {
            if (item.customerType !== customerFilterType) return false;
        }

        if (!filter) return true;
        const str = JSON.stringify(item).toLowerCase();
        return str.includes(filter.toLowerCase());
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleExportExcel = () => {
        const exportData = filteredData.map(item => ({
            'Customer ID': item.subscriberNo || '-',
            'Name': item.name,
            'Mobile': item.mobile || '-',
            'WhatsApp': item.whatsapp || '-',
            'Customer Type': item.customerType || '-',
            'Dispatch Preference': item.dispatchType || 'Post',
            'Street': item.address?.street || '-',
            'Landmark': item.address?.addressLine2 || '-',
            'Taluk': item.address?.taluk || '-',
            'District': item.address?.district || '-',
            'State': item.address?.state || '-',
            'Country': item.address?.country || 'India',
            'Pincode': item.address?.pincode || '-',
            'Next Billing Date': item.nextBillingDate ? new Date(item.nextBillingDate).toLocaleDateString('en-GB') : '-',
            'Status': item.status || 'New',
            'Database ID': item._id
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customers");
        XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getAvatarColor = (name: string) => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', minHeight: '100vh', background: '#f8fafc', width: '100%', overflowX: 'hidden' }}>
            {/* Header Section */}
            <div style={{
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
            }}>
                <div>
                    <h1 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '2.25rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        letterSpacing: '-0.025em'
                    }}>
                        Customer Directory
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                        Manage and track your entire customer base
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {onImport && (
                        <button
                            onClick={onImport}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'white',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <MdFileUpload size={20} />
                            Import
                        </button>
                    )}
                    <button
                        onClick={handleExportExcel}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <MdFileDownload size={20} />
                        Export Excel
                    </button>

                    <button
                        onClick={onAddCustomer}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <MdAdd size={20} />
                        Add New Customer
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <MdSearch style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                    }} size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, taluk..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    />
                </div>

                <select
                    value={customerFilterType}
                    onChange={(e) => setCustomerFilterType(e.target.value)}
                    style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        background: 'white',
                        color: '#1e293b'
                    }}
                >
                    <option value="All">All Categories</option>
                    <option value="Subscription">Subscription Based</option>
                    <option value="Advertisement">Advertisement Based</option>
                    <option value="Kovil">Kovil / Temples</option>
                    <option value="Nagarathaar Sangam">Nagarathaar Sangam</option>
                    <option value="No Subscription">No Subscription</option>
                    <option value="Renew Needed">Renewals Pending</option>
                    <option value="Other">Administrative</option>
                </select>

                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {filteredData.length} Results
                </span>
            </div>

            {/* Data Table Section */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
            }}>
                {filteredData.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#f1f5f9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#94a3b8'
                        }}>
                            <MdGroups size={40} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1e293b' }}>No customers found</h3>
                        <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '10px', // Space for scrollbar
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'thin'
                    }}>
                        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ width: '8%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>ID</th>
                                <th style={{ width: '22%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Customer</th>
                                <th style={{ width: '16%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Contact</th>
                                <th style={{ width: '22%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Address</th>
                                <th style={{ width: '14%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Next Billing</th>
                                <th style={{ width: '18%', padding: '1rem 0.85rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569', position: 'sticky', right: 0, background: '#f8fafc', zIndex: 2, boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, i) => (
                                <tr
                                    key={i}
                                    onClick={() => onOpenDetails(item)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #e2e8f0',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <td style={{ padding: '0.85rem', whiteSpace: 'nowrap' }}>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            color: '#6366f1'
                                        }}>
                                            {item.subscriberNo || 'NEW'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: getAvatarColor(item.name),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.9rem'
                                            }}>
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                                            <div>{item.mobile || '--'}</div>
                                            <div>{item.whatsapp || '--'}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem', fontSize: '0.83rem', color: '#64748b', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                                        {getAddressPreview(item)}
                                    </td>
                                    <td style={{ padding: '0.85rem', fontSize: '0.86rem', color: '#1e293b', whiteSpace: 'nowrap' }}>
                                        {item.nextBillingDate ? new Date(item.nextBillingDate).toLocaleDateString('en-GB') : 'No plan'}
                                    </td>
                                    <td style={{ padding: '1rem 0.85rem', position: 'sticky', right: 0, background: 'white', zIndex: 1, boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            whiteSpace: 'normal',
                                            backgroundColor: item.status === 'Active' ? '#ecfdf5' : item.status === 'Renew Needed' ? '#fffbeb' : '#eff6ff',
                                            color: item.status === 'Active' ? '#065f46' : item.status === 'Renew Needed' ? '#92400e' : '#1e40af'
                                        }}>
                                            {item.status || 'New'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersView;
