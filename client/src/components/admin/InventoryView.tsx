import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseEntryFormModal, CourierEntryFormModal } from './InventoryEntryModals';
import {
    MdShoppingBag,
    MdLocalShipping,
    MdInventory,
    MdTrendingUp,
    MdSearch,
    MdFilterList,
    MdFileDownload,
    MdAdd,
    MdBarChart,
    MdPayment
} from 'react-icons/md';

interface InventoryViewProps {
    confirm?: (title: string, message: string, action: () => void) => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type Tab = 'purchase' | 'courier';

const InventoryView: React.FC<InventoryViewProps> = ({ confirm, showNotification }) => {
    const [activeTab, setActiveTab] = useState<Tab>('purchase');
    const [searchTerm, setSearchTerm] = useState('');
    const [courierMonth, setCourierMonth] = useState('');
    const [courierYear, setCourierYear] = useState('');

    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [courierData, setCourierData] = useState<any[]>([]);

    const [showCreditTransactionsOnly, setShowCreditTransactionsOnly] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showCourierModal, setShowCourierModal] = useState(false);

    const [selectedPurchaseEntry, setSelectedPurchaseEntry] = useState<any>(null);
    const [selectedCourierEntry, setSelectedCourierEntry] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'purchase') {
            fetchPurchase();
        } else if (activeTab === 'courier') {
            fetchCourier();
        }
    }, [activeTab]);

    const handleError = (err: any, defaultMessage: string = 'An error occurred') => {
        const message = err?.response?.data?.message || err?.message || defaultMessage;
        showNotification(message, 'error');
    };

    const fetchPurchase = async () => {
        try {
            const res = await axios.get('/api/admin/purchase-entries', { withCredentials: true });
            setPurchaseData(res.data);
        } catch (err) {
            handleError(err, "Failed to fetch purchases");
        }
    };

    const fetchCourier = async () => {
        try {
            const res = await axios.get('/api/admin/courier-entries', { withCredentials: true });
            setCourierData(res.data);
        } catch (err) {
            handleError(err, "Failed to fetch courier entries");
        }
    };

    const handlePurchaseSubmit = async (formData: any) => {
        try {
            if (selectedPurchaseEntry) {
                await axios.put(`/api/admin/purchase-entries/${selectedPurchaseEntry._id}`, formData, { withCredentials: true });
                setShowPurchaseModal(false);
                fetchPurchase();
                showNotification('Purchase Entry Updated', 'success');
                return;
            }
            await axios.post('/api/admin/purchase-entries', formData, { withCredentials: true });
            setShowPurchaseModal(false);
            fetchPurchase();
            showNotification('Purchase Entry Added', 'success');
        } catch (err) {
            handleError(err, 'Failed to save purchase entry');
        }
    };

    const handleCourierSubmit = async (formData: any) => {
        try {
            if (selectedCourierEntry) {
                await axios.put(`/api/admin/courier-entries/${selectedCourierEntry._id}`, formData, { withCredentials: true });
                setShowCourierModal(false);
                fetchCourier();
                showNotification('Courier Entry Updated', 'success');
                return;
            }
            await axios.post('/api/admin/courier-entries', formData, { withCredentials: true });
            setShowCourierModal(false);
            fetchCourier();
            showNotification('Courier Entry Added', 'success');
        } catch (err) {
            handleError(err, 'Failed to save courier entry');
        }
    };

    const downloadCourierReport = async () => {
        const data = getFilteredData();
        if (data.length === 0) {
            showNotification("No records to download", 'warning');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Courier Report', 14, 22);

        doc.setFontSize(10);
        let filterText = `Generated: ${new Date().toLocaleDateString()}`;
        if (courierMonth) filterText += ` | Month: ${new Date(2000, parseInt(courierMonth) - 1, 1).toLocaleString('default', { month: 'long' })}`;
        if (courierYear) filterText += ` | Year: ${courierYear}`;

        doc.text(filterText, 14, 30);

        const tableColumn = ["Date", "Customer", "Sub No", "Edition", "Qty", "Amount"];
        const tableRows = data.map((item: any) => [
            item.date ? new Date(item.date).toLocaleDateString() : '-',
            item.customerName,
            item.subscriberNo || '-',
            item.edition,
            item.qty,
            item.amount
        ]);

        const totalAmount = data.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        const totalQty = data.reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            foot: [['Total', '', '', '', totalQty, `Rs. ${totalAmount}`]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            footStyles: { fillColor: [248, 250, 252], textColor: 0, fontStyle: 'bold' }
        });

        const pdfBuffer = doc.output('arraybuffer');
        const filename = `Courier_Report_${courierMonth || 'All'}_${courierYear || 'All'}.pdf`;

        if (window.electronAPI && window.electronAPI.saveReport) {
            const result = await window.electronAPI.saveReport(new Uint8Array(pdfBuffer), filename);
            if (result.success) {
                showNotification(`Courier report saved to ${result.path}`, 'success');
            } else {
                showNotification('Failed to save courier report', 'error');
            }
        } else {
            doc.save(filename);
            showNotification('Courier report downloaded', 'success');
        }
    };

    const getFilteredData = useCallback(() => {
        const lowerSearch = searchTerm.toLowerCase();
        if (activeTab === 'purchase') {
            return purchaseData.filter(item => {
                if (showCreditTransactionsOnly && item.modeOfPayment !== 'Credit Transaction') {
                    return false;
                }
                const search = lowerSearch.trim();
                if (!search) return true;

                const matchesBill = item.billNo?.toLowerCase().includes(search);
                const matchesSupplier = item.supplier?.toLowerCase().includes(search);
                const matchesCategory = item.purchaseCategory?.toLowerCase().includes(search);
                const matchesProduct = item.items?.some((p: any) => p.productName?.toLowerCase().includes(search));

                return matchesBill || matchesSupplier || matchesCategory || matchesProduct;
            });
        } else {
            return courierData.filter(item => {
                const matchesSearch = (item.customerName && item.customerName.toLowerCase().includes(lowerSearch)) ||
                    (item.subscriberNo && item.subscriberNo.toLowerCase().includes(lowerSearch)) ||
                    (item.edition && item.edition.toLowerCase().includes(lowerSearch));

                let matchesMonth = true;
                if (courierMonth) {
                    const d = new Date(item.date);
                    matchesMonth = (d.getMonth() + 1).toString() === courierMonth;
                }

                let matchesYear = true;
                if (courierYear) {
                    const d = new Date(item.date);
                    matchesYear = d.getFullYear().toString() === courierYear;
                }

                return matchesSearch && matchesMonth && matchesYear;
            });
        }
    }, [searchTerm, activeTab, purchaseData, showCreditTransactionsOnly, courierData, courierMonth, courierYear]);

    const filteredList = useMemo(() => getFilteredData(), [getFilteredData]);

    const stats = useMemo(() => {
        if (activeTab === 'purchase') {
            const totalItems = purchaseData.length;
            const totalExpenditure = purchaseData.reduce((sum: number, item: any) => sum + (Number(item.billAmount) || 0), 0);
            const creditEntries = purchaseData.filter((item: any) => item.modeOfPayment === 'Credit Transaction').length;
            return {
                title1: 'Total Purchases', val1: totalItems, icon1: <MdShoppingBag />, color1: '#6366f1',
                title2: 'Total Expenditure', val2: `₹${totalExpenditure.toLocaleString()}`, icon2: <MdTrendingUp />, color2: '#10b981',
                title3: 'Credit Entries', val3: creditEntries, icon3: <MdPayment />, color3: '#f59e0b'
            };
        } else {
            const totalShipments = courierData.length;
            const totalQty = courierData.reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
            const totalValue = courierData.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
            return {
                title1: 'Total Shipments', val1: totalShipments, icon1: <MdLocalShipping />, color1: '#6366f1',
                title2: 'Total Volume', val2: `${totalQty} units`, icon2: <MdBarChart />, color2: '#10b981',
                title3: 'Shipping Revenue', val3: `₹${totalValue.toLocaleString()}`, icon3: <MdTrendingUp />, color3: '#8b5cf6'
            };
        }
    }, [activeTab, purchaseData, courierData]);

    return (
        <div className="inventory-view" style={{
            width: '100%',
            padding: '24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            minHeight: '100vh',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div className="view-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        letterSpacing: '-0.02em'
                    }}>
                        <MdInventory style={{ color: '#4f46e5' }} /> Inventory Manager
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                        Manage purchases and monitor shipments across your network.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => activeTab === 'purchase' ? setShowPurchaseModal(true) : setShowCourierModal(true)}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <MdAdd size={20} /> {activeTab === 'purchase' ? 'Log Purchase' : 'New Shipment'}
                    </button>
                    {activeTab === 'courier' && (
                        <button
                            className="btn btn-success"
                            onClick={downloadCourierReport}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '12px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                color: '#10b981',
                                fontWeight: 600,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <MdFileDownload size={20} /> Export
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'purchase' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {[
                        { title: stats.title1, val: stats.val1, icon: stats.icon1, color: stats.color1 },
                        { title: stats.title2, val: stats.val2, icon: stats.icon2, color: stats.color2 },
                        { title: stats.title3, val: stats.val3, icon: stats.icon3, color: stats.color3 }
                    ].map((s, idx) => (
                        <div key={idx} className="stats-card-mini" style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)',
                            border: '1px solid rgba(255,255,255,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: `${s.color}15`,
                                color: s.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                {s.icon}
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.title}</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{s.val}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toolbar Section */}
            <div className="toolbar-premium" style={{
                background: 'white',
                padding: '16px',
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="premium-tabs" style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
                        <button
                            className={`tab-item-premium ${activeTab === 'purchase' ? 'active' : ''}`}
                            onClick={() => setActiveTab('purchase')}
                        >
                            <MdShoppingBag size={18} /> Purchase Catalog
                        </button>
                        <button
                            className={`tab-item-premium ${activeTab === 'courier' ? 'active' : ''}`}
                            onClick={() => setActiveTab('courier')}
                        >
                            <MdLocalShipping size={18} /> Courier Hub
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="search-field-premium" style={{ position: 'relative', width: '320px' }}>
                            <MdSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                            <input
                                type="text"
                                className="search-input-premium"
                                placeholder={activeTab === 'purchase' ? "Search entry, bill, or supplier..." : "Search customer, sub# or edition..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    padding: '0 16px 0 44px',
                                    background: '#f8fafc',
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    color: '#1e293b'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <MdFilterList style={{ color: '#64748b' }} size={20} />
                        {activeTab === 'purchase' ? (
                            <label className="checkbox-label-premium" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={showCreditTransactionsOnly}
                                    onChange={(e) => setShowCreditTransactionsOnly(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: '#4f46e5', borderRadius: '4px' }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Credit Transactions Only</span>
                            </label>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <select
                                    className="custom-select-premium"
                                    value={courierYear}
                                    onChange={(e) => setCourierYear(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: 500, color: '#1e293b' }}
                                >
                                    <option value="">All Years</option>
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <select
                                    className="custom-select-premium"
                                    value={courierMonth}
                                    onChange={(e) => setCourierMonth(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: 500, color: '#1e293b' }}
                                >
                                    <option value="">All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>
                                            {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                        Showing {filteredList.length} records
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="table-container shadow-premium" style={{ width: '100%', border: 'none', borderRadius: '20px', overflow: 'hidden' }}>
                {filteredList.length === 0 ? (
                    <div style={{ padding: '6rem', textAlign: 'center', color: '#94a3b8', background: 'white' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.2 }}>🔍</div>
                        <h3 style={{ margin: 0, color: '#475569' }}>No inventory records found</h3>
                        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>Try adjusting your search terms or filters</p>
                    </div>
                ) : (
                    <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                        {activeTab === 'purchase' ? (
                            <colgroup>
                                <col style={{ width: '10%' }} /> {/* Entry No */}
                                <col style={{ width: '12%' }} /> {/* Date */}
                                <col style={{ width: '15%' }} /> {/* Bill No */}
                                <col style={{ width: '20%' }} /> {/* Supplier */}
                                <col style={{ width: '15%' }} /> {/* Category */}
                                <col style={{ width: '13%' }} /> {/* Amount */}
                                <col style={{ width: '15%' }} /> {/* Entered By */}
                            </colgroup>
                        ) : (
                            <colgroup>
                                <col style={{ width: '12%' }} /> {/* Date */}
                                <col style={{ width: '20%' }} /> {/* Customer */}
                                <col style={{ width: '13%' }} /> {/* Mobile */}
                                <col style={{ width: '35%' }} /> {/* Address */}
                                <col style={{ width: '8%' }} />  {/* Qty */}
                                <col style={{ width: '12%' }} /> {/* Edition */}
                            </colgroup>
                        )}
                        <thead>
                            {activeTab === 'purchase' ? (
                                <tr>
                                    <th style={{ paddingLeft: '24px' }}>Entry No</th>
                                    <th>Date</th>
                                    <th>Bill No</th>
                                    <th>Supplier</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ paddingRight: '24px' }}>Entered By</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th style={{ paddingLeft: '24px' }}>Date</th>
                                    <th>Customer Details</th>
                                    <th>Mobile No</th>
                                    <th>Address</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ paddingRight: '24px' }}>Edition</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {activeTab === 'purchase' ? filteredList.map((item, i) => (
                                <tr
                                    key={i}
                                    onClick={() => { setSelectedPurchaseEntry(item); setShowPurchaseModal(true); }}
                                    className="row-clickable"
                                >
                                    <td style={{ paddingLeft: '24px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            background: '#f1f5f9',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            color: '#6366f1'
                                        }}>
                                            #{item.entryNo || '---'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500, color: '#475569' }}>
                                        {item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.billNo}>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.billNo}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, color: '#1e293b' }} title={item.supplier}>
                                            {item.supplier}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-pill status-active" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #e0f2fe' }}>
                                            {item.purchaseCategory}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                                        ₹{(Number(item.billAmount) || 0).toLocaleString()}
                                    </td>
                                    <td style={{ paddingRight: '24px', color: '#64748b', fontSize: '0.85rem' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.enteredBy}>
                                            {item.enteredBy}
                                        </div>
                                    </td>
                                </tr>
                            )) : filteredList.map((item, i) => (
                                <tr
                                    key={i}
                                    onClick={() => { setSelectedCourierEntry(item); setShowCourierModal(true); }}
                                    className="row-clickable"
                                >
                                    <td style={{ paddingLeft: '24px', fontWeight: 500, color: '#475569' }}>
                                        {item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.customerName}</span>
                                            {item.subscriberNo && (
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SUB ID: {item.subscriberNo}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: '#475569' }}>{item.mobile || '-'}</td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontSize: '0.85rem',
                                            color: '#64748b'
                                        }} title={item.address}>
                                            {item.address || '-'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            color: '#1e293b'
                                        }}>
                                            {item.qty}
                                        </span>
                                    </td>
                                    <td style={{ paddingRight: '24px' }}>
                                        <span className="status-pill" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ede9fe', fontWeight: 700 }}>
                                            {item.edition}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {showPurchaseModal && (
                <PurchaseEntryFormModal
                    onSubmit={handlePurchaseSubmit}
                    onClose={() => { setShowPurchaseModal(false); setSelectedPurchaseEntry(null); }}
                    initialData={selectedPurchaseEntry}
                    showNotification={showNotification}
                    onDelete={async (id) => {
                        try {
                            await axios.delete(`/api/admin/purchase-entries/${id}`, { withCredentials: true });
                            setShowPurchaseModal(false);
                            setSelectedPurchaseEntry(null);
                            fetchPurchase();
                            showNotification('Purchase Entry Deleted', 'success');
                        } catch (err) {
                            handleError(err, 'Failed to delete purchase entry');
                        }
                    }}
                    confirm={confirm}
                />
            )}
            {showCourierModal && (
                <CourierEntryFormModal
                    onSubmit={handleCourierSubmit}
                    onClose={() => { setShowCourierModal(false); setSelectedCourierEntry(null); }}
                    initialData={selectedCourierEntry}
                    showNotification={showNotification}
                    onDelete={async (id) => {
                        try {
                            await axios.delete(`/api/admin/courier-entries/${id}`, { withCredentials: true });
                            setShowCourierModal(false);
                            setSelectedCourierEntry(null);
                            fetchCourier();
                            showNotification('Courier Entry Deleted', 'success');
                        } catch (err) {
                            handleError(err, 'Failed to delete courier entry');
                        }
                    }}
                    confirm={confirm}
                />
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .stats-card-mini {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stats-card-mini:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1) !important;
                }
                .tab-item-premium {
                    padding: 10px 24px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .tab-item-premium.active {
                    background: white;
                    color: #4f46e5;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .search-input-premium:focus {
                    border-color: #6366f1 !important;
                    background: white !important;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
                }
                .row-clickable:hover {
                    background: #f8fafc !important;
                }
                .data-table th {
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 16px;
                }
                .data-table td {
                    padding: 16px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .status-pill {
                    padding: 4px 12px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .shadow-premium {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
                }
                .custom-select-premium:focus {
                    border-color: #6366f1 !important;
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default InventoryView;
