import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './ReportsView.css';



interface ReportsViewProps {
    memberTypes: any[];
    adTypes?: any[]; // New Prop
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ memberTypes, adTypes = [], showNotification }) => {
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [adTypeFilter, setAdTypeFilter] = useState(''); // New State
    const [districtFilter, setDistrictFilter] = useState('');
    const [dispatchFilter, setDispatchFilter] = useState('All'); // New
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const apiBase = '/api/admin/reports/subscribers-by-plan';

    const fetchReport = async () => {
        setLoading(true);
        try {
            let query = `${apiBase}?`;
            if (selectedPlanId) query += `planId=${selectedPlanId}&`;
            if (adTypeFilter) query += `adType=${encodeURIComponent(adTypeFilter)}&`; // New
            if (startDate) query += `startDate=${startDate}&`;
            if (endDate) query += `endDate=${endDate}&`;
            if (districtFilter) query += `district=${districtFilter}&`;
            if (['Advertisement', 'Kovil', 'Nagarathaar Sangam'].includes(statusFilter)) {
                query += `customerType=${encodeURIComponent(statusFilter)}&`;
            } else if (statusFilter !== 'All') {
                query += `status=${statusFilter}&`;
            }
            if (dispatchFilter !== 'All') query += `dispatchType=${dispatchFilter}&`; // New

            const res = await axios.get(query, { withCredentials: true });
            setReportData(res.data);
        } catch (err) {
            showNotification('Failed to fetch report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const downloadPDF = async () => {
        if (reportData.length === 0) return;

        try {
            const doc = new jsPDF();
            const planName = memberTypes.find(m => m._id === selectedPlanId)?.name || 'Report';

            // Config: 3 Columns x 6 Rows = 18 Records per page
            const rows = 6;
            const cols = 3;
            const colWidth = 63;
            const rowHeight = 45;
            const startX = 10;
            const startY = 10;
            const colGap = 3;
            const rowGap = 0;

            let currentPosition = 0; // Track current position across pages

            // Function to calculate if content fits in box
            const willContentFit = (row: any, maxWidth: number, boxHeight: number) => {
                let currentY = 4.5; // Start position

                // Subscription ID - fixed height
                currentY += 0;

                // Name
                currentY += 5.5;
                const name = (row.name || 'Unknown').toUpperCase();
                const splitName = doc.splitTextToSize(name, maxWidth);
                currentY += splitName.length * 4.5;

                // Address spacing
                currentY += 1.0;

                if (typeof row.address === 'object' && row.address) {
                    const street = row.address.street || '';
                    const addressLine2 = row.address.addressLine2 || '';
                    const taluk = row.address.taluk || '';
                    const district = row.address.district || '';
                    const pincode = row.address.pincode || '';

                    // Street
                    if (street) {
                        const splitStreet = doc.splitTextToSize(street, maxWidth);
                        currentY += splitStreet.length * 4.0;
                    }

                    // Address Line 2
                    if (addressLine2) {
                        const splitAddr2 = doc.splitTextToSize(addressLine2, maxWidth);
                        currentY += splitAddr2.length * 4.0;
                    }

                    // Taluk
                    if (taluk) {
                        const splitTaluk = doc.splitTextToSize(`${taluk},`, maxWidth);
                        currentY += splitTaluk.length * 4.0;
                    }

                    // District, Pincode, Mobile
                    if (district) {
                        const pinPart = pincode ? ` - ${pincode}` : '';
                        const mobPart = row.mobile ? `, Mob no: ${row.mobile}` : '';

                        doc.setFont("helvetica", "bold");
                        const distWidth = doc.getTextWidth(district);
                        doc.setFont("helvetica", "normal");
                        const pinWidth = doc.getTextWidth(pinPart);
                        const mobWidth = doc.getTextWidth(mobPart);

                        if (distWidth + pinWidth + mobWidth <= maxWidth) {
                            currentY += 4.0;
                        } else {
                            currentY += 4.0; // District + pincode line
                            if (row.mobile) {
                                currentY += 4.0; // Mobile line
                            }
                        }
                    } else if (row.mobile) {
                        currentY += 4.0;
                    }
                } else {
                    const addr = (row.address || '') + (row.mobile ? `, Mob no: ${row.mobile}` : '');
                    const splitAddr = doc.splitTextToSize(addr, maxWidth);
                    currentY += splitAddr.length * 4.0;
                }

                return currentY <= boxHeight;
            };

            reportData.forEach((row) => {
                const maxWidth = colWidth - 5;

                // Find next available position that can fit this record
                let positionFound = false;
                let attempts = 0;
                const maxAttempts = rows * cols * 4; // Prevent infinite loop (allow more attempts for multiple pages)

                while (!positionFound && attempts < maxAttempts) {
                    const colIndex = Math.floor(currentPosition / rows);

                    // Check if we need a new page
                    if (colIndex >= cols) {
                        doc.addPage();
                        currentPosition = 0;
                        // Reset attempts when starting a new page to give more chances
                        attempts = Math.min(attempts, maxAttempts - rows * cols);
                    }

                    // Check if content fits
                    if (willContentFit(row, maxWidth, rowHeight)) {
                        positionFound = true;
                    } else {
                        currentPosition++; // Skip this position
                        attempts++;
                    }
                }

                if (!positionFound) {
                    // If we can't find a suitable position, force it into the next available spot
                    const colIndex = Math.floor(currentPosition / rows);
                    if (colIndex >= cols) {
                        doc.addPage();
                        currentPosition = 0;
                    }
                }

                // Now render the record
                const colIndex = Math.floor(currentPosition / rows);
                const rowIndex = currentPosition % rows;

                const x = startX + (colIndex * (colWidth + colGap));
                const y = startY + (rowIndex * (rowHeight + rowGap));

                // Draw Box with subtle border
                doc.setDrawColor(180);
                doc.rect(x, y, colWidth, rowHeight);

                // Text Content
                const xText = x + 2.5;
                let yText = y + 4.5;

                // Subscription ID & Expiry (Format: SUB.NO-MM-YY)
                doc.setFontSize(9.5);
                doc.setFont("helvetica", "bold");
                let displayId = `Sub No: ${row.subscriberNo || '-'}`;
                if (row.endDate) {
                    const d = new Date(row.endDate);
                    if (!isNaN(d.getTime())) {
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const yy = String(d.getFullYear()).slice(-2);
                        displayId += `-${m}-${yy}`;
                    }
                }
                doc.text(displayId, xText, yText);

                // Name
                yText += 5.5;
                doc.setFontSize(10.5);
                doc.setFont("helvetica", "bold");
                const name = (row.name || 'Unknown').toUpperCase();
                const splitName = doc.splitTextToSize(name, maxWidth);
                splitName.forEach((line: string) => {
                    doc.text(line, xText, yText);
                    yText += 4.5;
                });

                // Address
                yText += 1.0;
                doc.setFontSize(10.5);
                doc.setFont("helvetica", "normal");

                if (typeof row.address === 'object' && row.address) {
                    const street = row.address.street || '';
                    const addressLine2 = row.address.addressLine2 || '';
                    const taluk = row.address.taluk || '';
                    const district = row.address.district || '';
                    const pincode = row.address.pincode || '';

                    // Render Street
                    if (street) {
                        const splitStreet = doc.splitTextToSize(street, maxWidth);
                        splitStreet.forEach((line: string) => {
                            doc.text(line, xText, yText);
                            yText += 4.0;
                        });
                    }

                    // Render Address Line 2 (Separate Line)
                    if (addressLine2) {
                        const splitAddr2 = doc.splitTextToSize(addressLine2, maxWidth);
                        splitAddr2.forEach((line: string) => {
                            doc.text(line, xText, yText);
                            yText += 4.0;
                        });
                    }

                    // Render Taluk (Wrapped)
                    if (taluk) {
                        doc.setFont("helvetica", "normal");
                        const splitTaluk = doc.splitTextToSize(`${taluk},`, maxWidth);
                        splitTaluk.forEach((line: string) => {
                            doc.text(line, xText, yText);
                            yText += 4.0;
                        });
                    }

                    // Render District (Bold), Pincode (Normal) and Mobile (Normal)
                    if (district) {
                        const pinPart = pincode ? ` - ${pincode}` : '';
                        const mobPart = row.mobile ? `, Mob no: ${row.mobile}` : '';

                        doc.setFont("helvetica", "bold");
                        const distWidth = doc.getTextWidth(district);
                        doc.setFont("helvetica", "normal");
                        const pinWidth = doc.getTextWidth(pinPart);
                        const mobWidth = doc.getTextWidth(mobPart);

                        if (distWidth + pinWidth + mobWidth <= maxWidth) {
                            // Everything fits on one line
                            doc.setFont("helvetica", "bold");
                            doc.text(district, xText, yText);
                            doc.setFont("helvetica", "normal");
                            doc.text(pinPart, xText + distWidth, yText);
                            if (row.mobile) {
                                doc.text(mobPart, xText + distWidth + pinWidth, yText);
                            }
                            yText += 4.0;
                        } else {
                            // Try District + Pincode on one line, Mobile on next
                            doc.setFont("helvetica", "bold");
                            doc.text(district, xText, yText);
                            doc.setFont("helvetica", "normal");
                            doc.text(pinPart, xText + distWidth, yText);
                            yText += 4.0;

                            if (row.mobile) {
                                doc.text(`Mob no: ${row.mobile}`, xText, yText);
                                yText += 4.0;
                            }
                        }
                    } else if (row.mobile) {
                        // Case where district is missing but mobile exists
                        doc.setFont("helvetica", "normal");
                        doc.text(`Mob no: ${row.mobile}`, xText, yText);
                        yText += 4.0;
                    }
                } else {
                    const addr = (row.address || '') + (row.mobile ? `, Mob no: ${row.mobile}` : '');
                    const splitAddr = doc.splitTextToSize(addr, maxWidth);
                    splitAddr.forEach((line: string) => {
                        doc.text(line, xText, yText);
                        yText += 4.0;
                    });
                }

                currentPosition++;
            });


            // Convert PDF to array buffer for Electron API
            const pdfBuffer = doc.output('arraybuffer');
            const filename = `Subscribers_Report_${planName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

            // Check if Electron API is available
            if (window.electronAPI && window.electronAPI.saveReport) {
                const result = await window.electronAPI.saveReport(new Uint8Array(pdfBuffer), filename);
                if (result.success) {
                    showNotification(`Report saved to ${result.path}`, 'success');
                } else {
                    showNotification('Failed to save report via Electron', 'error');
                }
            } else {
                // Fallback to browser download
                doc.save(filename);
                showNotification('Report downloaded to default location', 'success');
            }
        } catch (err) {
            showNotification('Error generating PDF. Please check console for details.', 'error');
        }
    };

    const downloadExcel = () => {
        if (reportData.length === 0) return;

        const data = reportData.map(row => {
            let addr: any = { street: '', addressLine2: '', taluk: '', district: '', state: '', pincode: '', country: 'India' };

            if (typeof row.address === 'object' && row.address) {
                addr = {
                    street: row.address.street || '',
                    addressLine2: row.address.addressLine2 || '',
                    taluk: row.address.taluk || '',
                    district: row.address.district || '',
                    state: row.address.state || '',
                    pincode: row.address.pincode || '',
                    country: row.address.country || 'India'
                };
            } else if (typeof row.address === 'string') {
                addr.street = row.address; // Fallback
            }

            return {
                Name: row.name,
                Mobile: row.mobile,
                Whatsapp: row.mobile, // Assuming same as mobile for now
                Street: addr.street,
                Address_Line_2: addr.addressLine2,
                Taluk: addr.taluk,
                District: addr.district,
                State: addr.state,
                Country: addr.country,
                Pincode: addr.pincode,
                Plan_Name: row.planName,
                Start_Date: row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : '',
                Payment_Method: row.paymentMethod || '', // Available now
                Reference_No: row.referenceNo || '',
                Dispatch_Type: row.dispatchType
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
        const filename = `Subscribers_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // Calculate summary stats - Removed
    // const totalRecords = reportData.length;
    // const activeCount = ...
    // const expiredCount = ...

    const [searchTerm, setSearchTerm] = useState('');

    const filteredReportData = reportData.filter(item => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
            (item.name?.toLowerCase() || '').includes(lowerSearch) ||
            (item.mobile?.toLowerCase() || '').includes(lowerSearch) ||
            (item.subscriberNo?.toLowerCase() || '').includes(lowerSearch) ||
            (typeof item.address === 'string' && item.address.toLowerCase().includes(lowerSearch)) ||
            (typeof item.address === 'object' && (
                (item.address.street?.toLowerCase() || '').includes(lowerSearch) ||
                (item.address.district?.toLowerCase() || '').includes(lowerSearch) ||
                (item.address.taluk?.toLowerCase() || '').includes(lowerSearch)
            ))
        );
    });

    return (
        <div className="reports-view-container">
            {/* Header Section */}
            <div className="reports-header">
                <h1 className="reports-title">Reports</h1>
                <p className="reports-subtitle">
                    Generate detailed subscriber reports with advanced filtering options
                </p>
            </div>

            {/* Filter Card */}
            <div className="reports-filter-card">
                <div className="filter-header">
                    <div className="filter-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <div className="filter-title">
                        <h3>Filter Options</h3>
                        <p>Customize your report with advanced filters</p>
                    </div>
                </div>

                <div className="filter-grid">
                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4"></path>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                            Status
                        </label>
                        <select
                            className="filter-input"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Subscription Customers</option>
                            <option value="Active">Active Customers</option>
                            <option value="Inactive">Inactive Customers</option>
                            <option value="Advertisement">Advertisement Customers</option>
                            <option value="Kovil">Kovil Customers</option>
                            <option value="Nagarathaar Sangam">Nagarathaar Sangam Customers</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z"></path>
                                <circle cx="12" cy="9" r="3"></circle>
                            </svg>
                            Location Filter
                        </label>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="District/Taluk..."
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                            Dispatch Mode
                        </label>
                        <select
                            className="filter-input"
                            value={dispatchFilter}
                            onChange={(e) => setDispatchFilter(e.target.value)}
                        >
                            <option value="All">All Modes</option>
                            <option value="Post">Post</option>
                            <option value="Courier">Courier</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                            {statusFilter === 'Advertisement' ? 'Ad Classification' : 'Member Plan'}
                        </label>

                        {statusFilter === 'Advertisement' ? (
                            <select
                                className="filter-input"
                                value={adTypeFilter}
                                onChange={(e) => {
                                    setAdTypeFilter(e.target.value);
                                    setReportData([]);
                                }}
                            >
                                <option value="">-- All Classifications --</option>
                                {adTypes.map((type: any) => (
                                    <option key={type._id} value={type.name}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                className="filter-input"
                                value={selectedPlanId}
                                onChange={(e) => {
                                    setSelectedPlanId(e.target.value);
                                    setReportData([]);
                                }}
                                disabled={['Advertisement', 'Kovil', 'Nagarathaar Sangam'].includes(statusFilter)}
                            >
                                <option value="">-- Choose Plan --</option>
                                {memberTypes.map(type => (
                                    <option key={type._id} value={type._id}>
                                        {type.name} ({type.durationInMonths} Months)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="filter-grid">
                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Start Date
                        </label>
                        <input
                            type={startDate ? 'date' : 'text'}
                            className="filter-input"
                            placeholder="DD/MM/YYYY"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            End Date
                        </label>
                        <input
                            type={endDate ? 'date' : 'text'}
                            className="filter-input"
                            placeholder="DD/MM/YYYY"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="generate-btn-container">
                    <button
                        className="generate-btn"
                        onClick={fetchReport}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="loading-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                                    <path d="M21 3v5h-5"></path>
                                </svg>
                                Generate Report
                            </>
                        )}
                    </button>
                </div>

                {/* Export Buttons */}
                {reportData.length > 0 && (
                    <div className="export-actions">
                        <button className="export-btn export-btn-pdf" onClick={downloadPDF}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"></path>
                            </svg>
                            Export PDF
                        </button>
                        <button className="export-btn export-btn-excel" onClick={downloadExcel}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                            </svg>
                            Export Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {reportData.length > 0 ? (
                <div className="reports-results-card">
                    <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Report Results ({filteredReportData.length} records)</h3>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <input
                                type="text"
                                placeholder="Search in results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8'
                                }}
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Sub No</th>
                                    <th>Name</th>
                                    <th>Mobile</th>
                                    <th>Address</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReportData.map((row, i) => {
                                    const isExpired = new Date(row.endDate) < new Date();
                                    const displayStatus = isExpired ? 'Expired' : row.status;
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <span className="sub-id">{row.subscriberNo}</span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{row.name}</td>
                                            <td>{row.mobile || '-'}</td>
                                            <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                                {typeof row.address === 'object' ?
                                                    `${row.address.street || ''}${row.address.addressLine2 ? ', ' + row.address.addressLine2 : ''}${row.address.taluk ? ', ' + row.address.taluk : ''}, ${row.address.district}, ${row.address.country || 'India'}` : row.address}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.startDate)}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.endDate)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`status-pill ${displayStatus === 'Active' ? 'status-active' : 'status-expired'}`}>
                                                    <span className="status-dot"></span>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3 className="empty-title">No Report Data</h3>
                    <p className="empty-text">
                        Configure your filters and click "Generate Report" to view subscriber data
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
