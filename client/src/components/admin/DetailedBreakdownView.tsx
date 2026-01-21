import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { MdPieChart, MdBarChart, MdFileDownload } from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface DetailedBreakdownViewProps {
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onBack: () => void;
}

const DetailedBreakdownView: React.FC<DetailedBreakdownViewProps> = ({ showNotification, onBack }) => {
    const [breakdownData, setBreakdownData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState<{ type: 'plan' | 'customer' | 'status', id: string, name: string } | null>(null);
    const [detailedData, setDetailedData] = useState<any[]>([]);
    const [detailedLoading, setDetailedLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailedFilterStatus, setDetailedFilterStatus] = useState('All');

    useEffect(() => {
        fetchBreakdownStats();
    }, []);

    const fetchBreakdownStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/admin/analytics?range=30d`, { withCredentials: true });
            setBreakdownData(response.data);
        } catch (error) {
            showNotification('Failed to load breakdown data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailedData = async (category: { type: 'plan' | 'customer' | 'status', id: string, name: string }, statusFilter: string) => {
        try {
            setDetailedLoading(true);
            setDetailedData([]);

            let url = '/api/admin/reports/subscribers-by-plan?';

            // Add Status Filter
            // If the category itself IS a status (e.g. Inactive), we enforce it, unless user explicitly filters differently
            let effectiveStatus = statusFilter;
            if (category.type === 'status') {
                effectiveStatus = category.id; // e.g. 'Inactive'
            }

            if (effectiveStatus !== 'All') {
                url += `status=${effectiveStatus}&`;
            }

            if (category.type === 'customer') {
                url += `customerType=${encodeURIComponent(category.name)}`;
            } else if (category.type === 'plan') {
                url += `planId=${category.id}`;
            }
            // if type is 'status', we don't need extra filters, primarily relying on status param

            const res = await axios.get(url, { withCredentials: true });

            // If checking for 'Other' customers (anomalies), filter client side if needed or backend handles it?
            // User requested "filter called other to list the other customers".
            // If they select "Other" in dropdown, we might handle it here?
            // We'll trust the backend return for now.

            setDetailedData(res.data);
        } catch (err) {
            showNotification('Failed to fetch details', 'error');
        } finally {
            setDetailedLoading(false);
        }
    };

    const handleCategoryClick = (category: { type: 'plan' | 'customer' | 'status', id: string, name: string }) => {
        setSelectedCategory(category);

        // Determine default status filter based on category type
        let defaultStatus = 'All';
        if (category.type === 'plan') {
            defaultStatus = 'Active'; // Plans usually imply active subs
        } else if (category.type === 'status') {
            defaultStatus = category.id; // 'Inactive' or 'Active'
        }

        setDetailedFilterStatus(defaultStatus);
        fetchDetailedData(category, defaultStatus);
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setDetailedFilterStatus(newStatus);
        if (selectedCategory) {
            // If we are in 'Inactive' category but user switches filter to 'Active', standard logic applies
            fetchDetailedData(selectedCategory, newStatus);
        }
    };

    const filteredDetailedData = detailedData.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (item.name?.toLowerCase().includes(search)) ||
            (item.mobile?.includes(search)) ||
            (item.subscriberNo?.toLowerCase().includes(search)) ||
            (typeof item.address === 'string' && item.address.toLowerCase().includes(search)) ||
            (item.address?.district?.toLowerCase().includes(search))
        );
    });

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text("Subscriber Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Category: ${selectedCategory?.name} - ${detailedFilterStatus}`, 14, 34);

        // Table
        const tableColumn = ["Name", "Mobile", "Plan", "Status", "End Date"];
        const tableRows = filteredDetailedData.map(item => [
            item.name,
            item.mobile,
            item.planName || '-',
            item.status,
            new Date(item.endDate).toLocaleDateString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [66, 100, 210] } // indigo-600ish
        });

        doc.save(`Subscribers_${selectedCategory?.name}_${detailedFilterStatus}.pdf`);
        showNotification('PDF downloaded successfully', 'success');
    };

    // Chart Data Preparation
    const customerTypeData = {
        labels: breakdownData.customerTypeBreakdown?.map((c: any) => c.name) || [],
        datasets: [{
            data: breakdownData.customerTypeBreakdown?.map((c: any) => c.count) || [],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'],
            borderWidth: 0,
        }]
    };

    const planData = {
        labels: breakdownData.planBreakdown?.map((p: any) => p.name) || [],
        datasets: [{
            label: 'Subscribers',
            data: breakdownData.planBreakdown?.map((p: any) => p.count) || [],
            backgroundColor: '#6366f1',
            borderRadius: 6,
        }]
    };


    const activeCount = breakdownData.activeSubscriptions || 0;
    const totalCount = breakdownData.totalSubscribers || 0;
    const inactiveCount = Math.max(0, totalCount - activeCount);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading breakdown...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            padding: '2rem',
            background: '#f8fafc',
            minHeight: '100vh',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#1e293b'
                    }}>
                        Detailed Breakdown
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                        Deep dive into customer segments and plan distribution
                    </p>
                </div>
            </div>

            {/* Visual Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <MdPieChart size={24} color="#6366f1" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Customer Distribution</h3>
                    </div>
                    <div style={{ height: '200px' }}>
                        <Doughnut data={customerTypeData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <MdBarChart size={24} color="#6366f1" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Plan Popularity</h3>
                    </div>
                    <div style={{ height: '200px' }}>
                        <Bar data={planData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Status Overview */}
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Status Overview</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <div
                            onClick={() => handleCategoryClick({ type: 'status', id: 'Active', name: 'Active Customers' })}
                            style={{
                                padding: '1rem',
                                background: selectedCategory?.id === 'Active' ? '#dcfce7' : '#f0fdf4',
                                border: selectedCategory?.id === 'Active' ? '2px solid #16a34a' : '1px solid #bbf7d0',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                minWidth: '140px',
                                flex: '1 1 auto'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>{activeCount}</div>
                            <div style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: 600 }}>Active</div>
                        </div>

                        <div
                            onClick={() => handleCategoryClick({ type: 'status', id: 'Renew Needed', name: 'Renewal Needed' })}
                            style={{
                                padding: '1rem',
                                background: selectedCategory?.id === 'Renew Needed' ? '#ffedd5' : '#fff7ed',
                                border: selectedCategory?.id === 'Renew Needed' ? '2px solid #f97316' : '1px solid #fed7aa',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                minWidth: '140px',
                                flex: '1 1 auto'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ea580c', marginBottom: '0.25rem' }}>{breakdownData.renewalNeededCount || 0}</div>
                            <div style={{ fontSize: '0.875rem', color: '#c2410c', fontWeight: 600 }}>Renewal Needed</div>
                        </div>

                        <div
                            onClick={() => handleCategoryClick({ type: 'status', id: 'ExpiringSoon', name: 'Expiring Soon (30d)' })}
                            style={{
                                padding: '1rem',
                                background: selectedCategory?.id === 'ExpiringSoon' ? '#fff7ed' : '#fffbeb',
                                border: selectedCategory?.id === 'ExpiringSoon' ? '2px solid #ea580c' : '1px solid #fcd34d',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                minWidth: '140px',
                                flex: '1 1 auto'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginBottom: '0.25rem' }}>{breakdownData.expiringCount || 0}</div>
                            <div style={{ fontSize: '0.875rem', color: '#b45309', fontWeight: 600 }}>Expiring Soon (30d)</div>
                        </div>

                        <div
                            onClick={() => handleCategoryClick({ type: 'status', id: 'Inactive', name: 'Inactive / Expired' })}
                            style={{
                                padding: '1rem',
                                background: selectedCategory?.id === 'Inactive' ? '#fee2e2' : '#fef2f2',
                                border: selectedCategory?.id === 'Inactive' ? '2px solid #dc2626' : '1px solid #fecaca',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                minWidth: '140px',
                                flex: '1 1 auto'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.25rem' }}>{inactiveCount}</div>
                            <div style={{ fontSize: '0.875rem', color: '#b91c1c', fontWeight: 600 }}>Inactive / Expired</div>
                        </div>
                    </div>
                </div>

                {/* Customer Types */}
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>By Customer Type</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {breakdownData.customerTypeBreakdown?.map((type: any) => (
                            <div
                                key={type.name}
                                onClick={() => handleCategoryClick({ type: 'customer', id: type.name, name: type.name })}
                                style={{
                                    padding: '1rem',
                                    background: selectedCategory?.name === type.name ? '#eff6ff' : '#f8fafc',
                                    border: selectedCategory?.name === type.name ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    minWidth: '140px',
                                    transition: 'all 0.2s',
                                    flex: '1 1 auto',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{type.count}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{type.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plans */}
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>By Active Plan</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {breakdownData.planBreakdown?.map((plan: any) => (
                            <div
                                key={plan.id}
                                onClick={() => handleCategoryClick({ type: 'plan', id: plan.id, name: plan.name })}
                                style={{
                                    padding: '1rem',
                                    background: selectedCategory?.id === plan.id ? '#eff6ff' : '#f8fafc',
                                    border: selectedCategory?.id === plan.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    minWidth: '140px',
                                    transition: 'all 0.2s',
                                    flex: '1 1 auto',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{plan.count}</div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{plan.name}</div>
                            </div>
                        ))}
                        {!breakdownData.planBreakdown?.length && (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No active plans found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Data View */}
            {selectedCategory && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ padding: '0.25rem 0.75rem', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', fontSize: '0.875rem' }}>{selectedCategory.name}</span>
                            Records
                            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500, marginLeft: '0.5rem' }}>
                                ({filteredDetailedData.length})
                            </span>
                        </h3>

                        {/* Filter & Search */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <select
                                value={detailedFilterStatus}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                style={{
                                    height: '40px',
                                    padding: '0 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: 'white',
                                    fontSize: '0.9rem',
                                    color: '#1e293b',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="ExpiringSoon">Expiring Soon</option>
                                <option value="Other">Other</option>
                            </select>

                            <button
                                onClick={handleDownloadPDF}
                                style={{
                                    height: '40px',
                                    padding: '0 1.25rem',
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                                <MdFileDownload size={18} />
                                Export PDF
                            </button>

                            <div className="search-wrapper" style={{ margin: 0, width: '300px', position: 'relative' }}>
                                <div className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search name, mobile, address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        paddingLeft: '2.5rem',
                                        paddingRight: '1rem',
                                        height: '40px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {detailedLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <div style={{
                                width: '24px', height: '24px',
                                border: '2px solid #cbd5e1', borderTopColor: '#3b82f6',
                                borderRadius: '50%', margin: '0 auto 1rem',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            Loading records...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Mobile</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Sub No</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Address (District)</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDetailedData.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{item.mobile}</td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{item.subscriberNo || '-'}</td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                                {typeof item.address === 'object' ? item.address?.district : (item.address || '').slice(0, 30)}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: item.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                    color: item.status === 'Active' ? '#166534' : '#475569'
                                                }}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDetailedData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                                No records found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DetailedBreakdownView;
