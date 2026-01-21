import React from 'react';
import * as XLSX from 'xlsx';
import { MdSearch, MdAdd, MdFileDownload, MdPerson, MdGroups, MdPhone, MdLocationOn } from 'react-icons/md';

interface CustomersViewProps {
    data: any[];
    filter: string;
    setFilter: (val: string) => void;
    customerFilterType: string;
    setCustomerFilterType: (val: string) => void;
    onAddCustomer: () => void;
    onOpenDetails: (customer: any) => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({
    data, filter, setFilter,
    customerFilterType, setCustomerFilterType,
    onAddCustomer, onOpenDetails
}) => {

    const filteredData = data.filter(item => {
        // 'Other' filter shows Admins
        if (customerFilterType === 'Other') {
            return item.role === 'admin';
        }

        // All other filters show only Customers
        if (item.role === 'admin') return false;

        if (customerFilterType === 'Renew Needed') {
            if (item.status !== 'Renew Needed') return false;
        } else if (['Subscription', 'Advertisement', 'Kovil', 'Nagarathaar Sangam'].includes(customerFilterType)) {
            if (item.customerType !== customerFilterType) return false;
        }

        if (!filter) return true;
        const str = JSON.stringify(item).toLowerCase();
        return str.includes(filter.toLowerCase());
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleExportExcel = () => {
        const exportData = filteredData.map(item => ({
            'Subscription ID': item.subscriberNo || '-',
            'Name': item.name,
            'Street': item.address?.street || '-',
            'Address Line 2': item.address?.addressLine2 || '-',
            'Taluk': item.address?.taluk || '-',
            'District': item.address?.district || '-',
            'State': item.address?.state || '-',
            'Country': item.address?.country || 'India',
            'Pincode': item.address?.pincode || '-',
            'Mobile': item.mobile || '-',
            'Whatsapp': item.whatsapp || '-',
            'Customer Type': item.customerType || '-',
            'Next Billing': item.nextBillingDate ? new Date(item.nextBillingDate).toLocaleDateString('en-GB') : '-',
            'Status': item.status || 'New'
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
        <div style={{ padding: '2rem', minHeight: '100vh', background: '#f8fafc' }}>
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
                        Manage and track your entire customer base in one place
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        <MdFileDownload size={20} />
                        Export Excel
                    </button>

                    <button
                        onClick={onAddCustomer}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                        }}
                    >
                        <MdAdd size={20} />
                        Add New Customer
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
                            borderRadius: '10px',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.2s',
                            background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Filter:</span>
                    <select
                        value={customerFilterType}
                        onChange={(e) => setCustomerFilterType(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            fontSize: '0.95rem',
                            background: 'white',
                            color: '#1e293b',
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '200px'
                        }}
                    >
                        <option value="All">All Categories</option>
                        <option value="Subscription">Subscription Based</option>
                        <option value="Advertisement">Advertisement Based</option>
                        <option value="Kovil">Kovil / Temples</option>
                        <option value="Nagarathaar Sangam">Nagarathaar Sangam</option>
                        <option value="Renew Needed">Renewals Pending</option>
                        <option value="Other">Administrative</option>
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontSize: '0.85rem',
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontWeight: 600
                    }}>
                        {filteredData.length} Results
                    </span>
                </div>
            </div>

            {/* Data Table Section */}
            <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                overflow: 'hidden'
            }}>
                {filteredData.length === 0 ? (
                    <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
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
                        <p style={{ margin: 0, color: '#64748b' }}>We couldn't find any customers matching your current filters.</p>
                        <button
                            onClick={() => { setFilter(''); setCustomerFilterType('All'); }}
                            style={{
                                marginTop: '1.5rem',
                                background: 'none',
                                border: 'none',
                                color: '#6366f1',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', width: '100px' }}>ID</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Customer</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Contact & Location</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Subscription</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', width: '150px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => onOpenDetails(item)}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            borderBottom: i === filteredData.length - 1 ? 'none' : '1px solid #f1f5f9'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8fafc';
                                            e.currentTarget.style.transform = 'scale(1.001)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 700,
                                                color: '#6366f1',
                                                background: '#eef2ff',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '6px'
                                            }}>
                                                {item.subscriberNo || 'NEW'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '12px',
                                                    background: getAvatarColor(item.name),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{item.name}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <MdPerson size={14} /> {item.customerType || 'Customer'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.9rem' }}>
                                                    <MdPhone size={16} color="#6366f1" /> {item.mobile || '--'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                                                    <MdLocationOn size={16} color="#94a3b8" />
                                                    <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.address?.street}, {item.address?.taluk}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
                                                {item.nextBillingDate ? new Date(item.nextBillingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No active plan'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                                Next Renewal Date
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.025em',
                                                textTransform: 'uppercase',
                                                background: item.status === 'Active' ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' :
                                                    item.status === 'Renew Needed' ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' :
                                                        item.status === 'New' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                                color: item.status === 'Active' ? '#065f46' :
                                                    item.status === 'Renew Needed' ? '#9a3412' :
                                                        item.status === 'New' ? '#1e40af' : '#991b1b',
                                                border: `1px solid ${item.status === 'Active' ? '#a7f3d0' :
                                                    item.status === 'Renew Needed' ? '#fed7aa' :
                                                        item.status === 'New' ? '#bfdbfe' : '#fecaca'}`,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: 'currentColor'
                                                }}></div>
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
