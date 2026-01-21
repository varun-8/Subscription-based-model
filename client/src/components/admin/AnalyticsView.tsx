import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    MdTrendingUp,
    MdTrendingDown,
    MdShowChart,
    MdGroups,
    MdAccountBalanceWallet,
    MdMonetizationOn,
    MdStar,
    MdHistory,
    MdRefresh,
    MdSecurity,
    MdFileDownload,
    MdBarChart,
    MdCloudUpload
} from 'react-icons/md';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SecuritySettingsModal from './SecuritySettingsModal';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

interface AnalyticsViewProps {
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    onAdCustomerCountChange?: (count: number) => void;
    onOpenDetailedBreakdown: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ showNotification, onAdCustomerCountChange, onOpenDetailedBreakdown }) => {
    const [analyticsData, setAnalyticsData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('subscription');
    const [reportPeriod, setReportPeriod] = useState('day');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [subPaymentMethod, setSubPaymentMethod] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // Bulk Data State
    const [importData, setImportData] = useState<any[]>([]);
    const [memberTypes, setMemberTypes] = useState<any[]>([]);

    useEffect(() => {
        fetchMemberTypes();
    }, []);

    const fetchMemberTypes = async () => {
        try {
            const res = await axios.get('/api/admin/member-types', { withCredentials: true });
            setMemberTypes(res.data);
        } catch (error) {
            console.error('Error fetching member types', error);
        }
    };
    const [adPaymentType, setAdPaymentType] = useState('All');

    const [reportAdPaymentMethod, setReportAdPaymentMethod] = useState('');


    React.useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange, adPaymentType]); // Keep adPaymentType for dashboard

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/admin/analytics?range=${timeRange}&adPaymentType=${adPaymentType === 'All' ? '' : adPaymentType}`, { withCredentials: true });
            setAnalyticsData(response.data);

            // Notify parent (Admin) about Advertisement customer count from analytics breakdown
            if (onAdCustomerCountChange && response.data?.customerTypeBreakdown) {
                const adEntry = response.data.customerTypeBreakdown.find((c: any) => c.name === 'Advertisement');
                if (adEntry) {
                    onAdCustomerCountChange(adEntry.count || 0);
                }
            }
        } catch (error) {
            showNotification('Failed to load analytics data', 'error'); // Assuming handleError is not defined, keeping showNotification
        } finally {
            setLoading(false);
        }
    };



    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const formatPercentage = (num: number) => {
        return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
    };

    const getTimeRangeLabel = (range: string) => {
        switch (range) {
            case '7d': return 'Last 7 days';
            case '30d': return 'Last 30 days';
            case '90d': return 'Last 90 days';
            case '1y': return 'Last year';
            default: return 'Last 30 days';
        }
    };

    // --- Bulk Data Functions ---

    const downloadSample = () => {
        const sample = [{
            name: 'John Doe',
            mobile: '9876543210',
            whatsapp: '9876543210',
            email: 'john@example.com',
            customerType: 'Subscription',
            dispatchType: 'Post',
            street: '123 Main St',
            addressLine2: 'Apt 4B',
            taluk: 'Central',
            district: 'CHENNAI',
            state: 'TAMIL NADU',
            country: 'India',
            pincode: '600001',
            planName: memberTypes[0]?.name || 'Standard Plan',
            startDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            referenceNo: 'TXN123',
            tempReceiptNo: 'REC001'
        }];
        const ws = XLSX.utils.json_to_sheet(sample);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sample");
        XLSX.writeFile(wb, "bulk_import_sample.xlsx");
    };

    const downloadBulkData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/customers', { withCredentials: true });

            if (!Array.isArray(res.data)) {
                console.error('Unexpected response format:', res.data);
                throw new Error('Server returned invalid data format');
            }

            const data = res.data.map((c: any) => ({
                subscriberNo: c.subscriberNo,
                name: c.name,
                mobile: c.mobile,
                whatsapp: c.whatsapp || '',
                email: c.email || '',
                customerType: c.customerType || 'Subscription',
                dispatchType: c.dispatchType || 'Post',
                street: c.address?.street || '',
                addressLine2: c.address?.addressLine2 || '',
                taluk: c.address?.taluk || '',
                district: c.address?.district || '',
                state: c.address?.state || '',
                country: c.address?.country || 'India',
                pincode: c.address?.pincode || '',
                planName: c.latestPlan?.name || memberTypes.find((m: any) => m._id === c.latestSubscription?.memberTypeId)?.name || '',
                startDate: c.latestSubscription?.startDate ? new Date(c.latestSubscription.startDate).toISOString().split('T')[0] : '',
                paymentMethod: c.latestInvoice?.paymentMethod || '',
                referenceNo: c.latestSubscription?.referenceNo || '',
                tempReceiptNo: c.latestSubscription?.tempReceiptNo || '',
                status: c.latestSubscription?.status || c.status || 'Active',
                expiryDate: c.latestSubscription?.endDate ? new Date(c.latestSubscription.endDate).toLocaleDateString() : 'N/A'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Customers");
            XLSX.writeFile(wb, "customer_export.xlsx");
        } catch (err) {
            showNotification('Failed to export data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setImportData(data);
                showNotification(`Loaded ${data.length} records. Review and click Start Import.`, 'info');
            } catch (err) {
                showNotification('Failed to parse Excel file.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    const submitBulkData = async () => {
        if (importData.length === 0) return;
        setLoading(true);
        try {
            const res = await axios.post('/api/admin/bulk-import', { records: importData }, { withCredentials: true });
            if (res.data.successCount > 0) {
                showNotification(`Imported ${res.data.successCount} records successfully!`, 'success');
                setImportData([]);
                fetchAnalyticsData(); // Refresh metrics after import
            }
            if (res.data.errors?.length > 0) {
                console.error('Import errors:', res.data.errors);
                showNotification(`${res.data.successCount} imported, ${res.data.errors.length} failed. Check console.`, 'warning');
            }
        } catch (err) {
            showNotification('Import failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            setReportLoading(true);
            const params = new URLSearchParams({
                type: reportType,
                period: reportPeriod,
                date: reportDate,
            });
            if (reportType === 'subscription' && subPaymentMethod) {
                params.append('paymentMethod', subPaymentMethod);
            }
            if (reportType === 'advertisement' && reportAdPaymentMethod) {
                params.append('paymentMethod', reportAdPaymentMethod);
            }

            const response = await axios.get(`/api/admin/revenue-report?${params.toString()}`, { withCredentials: true });
            const { meta, data } = response.data;

            if (!data || data.length === 0) {
                showNotification('No data found for the selected period.', 'warning');
                setReportLoading(false);
                return;
            }

            const doc = new jsPDF();

            // --- Helpers for Header ---
            /*
            const loadImage = (url: string): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } else resolve('');
                    };
                    img.onerror = () => resolve('');
                });
            };

            const createTitleImage = (text: string) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return '';
                const fontSize = 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                const textWidth = ctx.measureText(text).width;
                canvas.width = textWidth + 80;
                canvas.height = fontSize + 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                ctx.fillStyle = '#6D0F1B'; // Brand Color
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 40, canvas.height / 2);
                return canvas.toDataURL('image/png');
            };

            const createAddressImage = (lines: string[], boldFirst = false) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return '';
                const fontSize = 35;
                const boldFontSize = 50;
                let maxWidth = 0;
                lines.forEach((l, i) => {
                    ctx.font = (i === 0 && boldFirst) ? `bold ${boldFontSize}px "Arial Unicode MS", Arial, sans-serif` : `${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                    const w = ctx.measureText(l).width;
                    if (w > maxWidth) maxWidth = w;
                });
                canvas.width = maxWidth + 40;
                const totalHeight = (boldFirst ? boldFontSize + 15 : 0) + ((boldFirst ? lines.length - 1 : lines.length) * (fontSize + 15)) + 40;
                canvas.height = totalHeight;
                ctx.textBaseline = 'top';
                let currentY = 20;
                lines.forEach((l, i) => {
                    const isBold = i === 0 && boldFirst;
                    const size = isBold ? boldFontSize : fontSize;
                    ctx.font = `${isBold ? 'bold ' : ''}${size}px "Arial Unicode MS", Arial, sans-serif`;
                    ctx.fillStyle = isBold ? '#0f172a' : '#4b5563';
                    ctx.fillText(l, 20, currentY);
                    currentY += size + 15;
                });
                return canvas.toDataURL('image/png');
            };
            */

            // --- Load Header Assets ---
            // const logoData = await loadImage('/invoice-ganesha.png');
            // const titleImg = createTitleImage('ஆச்சி வந்தாச்சு');
            // const addrImg = createAddressImage([
            //     'தமிழ் இலக்கிய மாத இதழ்,',
            //     '17/7 கிழப்பட்டமார் தெரு, முதல் தளம்,',
            //     'மதுரை - 625001.',
            //     'Ph: 0452 4375375'
            // ]);

            // --- Render Header ---
            // if (logoData) doc.addImage(logoData, 'PNG', 15, 15, 30, 42);
            // if (titleImg) doc.addImage(titleImg, 'PNG', 50, 13, 70, 18);
            // if (addrImg) doc.addImage(addrImg, 'PNG', 50, 30, 65, 27);

            // Report Title (Right)
            doc.setFontSize(24);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text("REVENUE REPORT", 195, 25, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 33, { align: 'right' });

            // --- Divider ---
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(14, 60, 196, 60);

            /* Previous Header 
            // --- Header ---
            // Company Details (Left)
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // Slate 800
            doc.setFont("helvetica", "bold");
            doc.text("Aachi Vanthachu", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "normal");
            doc.text("No.4/11xx, MMDA 1st Main Rd,", 14, 26);
            doc.text("Mathuravoyal, Chennai - 600095", 14, 31);
            doc.text("Ph: 98402 34475, 98402 34475", 14, 36);

            // Report Title (Right)
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229); // Primary
            doc.setFont("helvetica", "bold");
            doc.text("REVENUE AUDIT REPORT", 195, 20, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 28, { align: 'right' });

            // --- Divider ---
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(14, 42, 196, 42);

            */
            // --- Report Summary Block ---
            // Background
            doc.setFillColor(241, 245, 249);
            doc.rect(14, 65, 182, 30, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(14, 65, 182, 30, 'S');

            // Summary Details
            let typeLabel = reportType === 'advertisement' ? 'Advertisement Revenue' : 'Subscription Revenue';

            let dateStr = '';
            const d = new Date(meta.startDate);
            if (reportPeriod === 'day') dateStr = d.toLocaleDateString();
            else if (reportPeriod === 'month') dateStr = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            else if (reportPeriod === 'year') dateStr = d.getFullYear().toString();

            // Left Col (Meta)
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text("REPORT TYPE", 20, 75);
            doc.text("PERIOD", 20, 85);

            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(typeLabel.toUpperCase(), 50, 75);
            doc.text(dateStr.toUpperCase(), 50, 85);

            // Right Col (Totals)
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "normal");
            doc.text("TOTAL TRANSACTIONS", 120, 75);
            doc.text("TOTAL REVENUE", 120, 85);

            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(data.length.toString(), 160, 75);

            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text(formatCurrency(meta.totalAmount).replace('₹', 'Rs. '), 160, 86);

            /* Old Summary
            // --- Report Summary Block ---
            // Background
            doc.setFillColor(241, 245, 249);
            doc.rect(14, 48, 182, 35, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(14, 48, 182, 35, 'S');

            // Summary Details
            let typeLabel = reportType === 'advertisement' ? 'Advertisement Revenue' : 'Subscription Revenue';

            let dateStr = '';
            const d = new Date(meta.startDate);
            if (reportPeriod === 'day') dateStr = d.toLocaleDateString();
            else if (reportPeriod === 'month') dateStr = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            else if (reportPeriod === 'year') dateStr = d.getFullYear().toString();

            let paymentLabel = 'All Modes';
            if (reportType === 'subscription' && subPaymentMethod) {
                paymentLabel = subPaymentMethod === 'Other' ? 'Online/Bank' : 'Cash Only';
            }
            if (reportType === 'advertisement' && reportAdPaymentMethod) {
                paymentLabel = reportAdPaymentMethod === 'Other' ? 'Online/Bank' : 'Cash Only';
            }

            // Left Col (Meta)
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text("REPORT TYPE", 20, 58);
            doc.text("PERIOD", 20, 68);
            doc.text("PAYMENT MODE", 20, 78);

            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(typeLabel.toUpperCase(), 60, 58);
            doc.text(dateStr.toUpperCase(), 60, 68);
            doc.text(paymentLabel.toUpperCase(), 60, 78);

            // Right Col (Totals)
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "normal");
            doc.text("TOTAL TRANSACTIONS", 130, 58);
            doc.text("TOTAL REVENUE", 130, 72);

            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(data.length.toString(), 130, 64);

            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text(formatCurrency(meta.totalAmount).replace('₹', 'Rs. '), 130, 79);

            // Table
            */
            // --- Table ---
            const tableColumn = ["DATE", "INVOICE #", "CUSTOMER NAME", "AMOUNT"];
            const tableRows = data.map((item: any) => [
                new Date(item.date).toLocaleDateString(),
                item.invoiceNumber,
                item.customerName || 'N/A',
                formatCurrency(item.amount).replace('₹', 'Rs. ')
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 105,
                theme: 'striped',
                headStyles: {
                    fillColor: [30, 41, 59], // Slate 800
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                bodyStyles: {
                    textColor: 50,
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Date
                    1: { cellWidth: 40 }, // Invoice
                    2: { cellWidth: 'auto' }, // Customer
                    3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 } // Amount
                },
                foot: [['', '', 'TOTAL', formatCurrency(meta.totalAmount).replace('₹', 'Rs. ')]],
                footStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    halign: 'right'
                },
                didDrawPage: (data) => {
                    // Footer
                    const pageCount = doc.internal.pages.length - 1;
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount} - Authorized Computer Generated Report`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                    );
                }
            });

            doc.save(`Revenue_Audit_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
            showNotification('Audit Report downloaded successfully', 'success');
            setShowReportModal(false);

            /* Old Table
            // --- Table ---
            const tableColumn = ["DATE", "INVOICE #", "CUSTOMER NAME", "PAYMENT MODE", "AMOUNT"];
            const tableRows = data.map((item: any) => [
                new Date(item.date).toLocaleDateString(),
                item.invoiceNumber,
                item.customerName || 'N/A',
                item.paymentMethod || '-',
                formatCurrency(item.amount).replace('₹', 'Rs. ')
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 95,
                theme: 'striped',
                headStyles: {
                    fillColor: [30, 41, 59], // Slate 800
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                bodyStyles: {
                    textColor: 50,
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Date
                    1: { cellWidth: 35 }, // Invoice
                    2: { cellWidth: 'auto' }, // Customer
                    3: { cellWidth: 35 }, // Mode
                    4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 } // Amount
                },
                foot: [['', '', 'TOTAL', '', formatCurrency(meta.totalAmount).replace('₹', 'Rs. ')]],
                footStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    halign: 'right'
                },
                didDrawPage: (data) => {
                    // Footer
                    const pageCount = doc.internal.pages.length - 1;
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount} - Authorized Computer Generated Report`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                    );
                }
            });

            */

        } catch (error) {
            showNotification('Failed to generate report', 'error');
        } finally {
            setReportLoading(false);
        }
    };

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
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading analytics...</p>
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
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Analytics Dashboard
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
                        Comprehensive insights for your magazine business
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: '#374151',
                            cursor: 'pointer',
                            minWidth: '140px'
                        }}
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>

                    <button
                        onClick={onOpenDetailedBreakdown}
                        className="btn-secondary"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Detailed Breakdown
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <MdFileDownload size={18} />
                        Download Report
                    </button>

                    <button
                        onClick={() => setShowSecurityModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <MdSecurity size={18} />
                        Password Settings
                    </button>

                    <button
                        onClick={fetchAnalyticsData}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                        }}
                    >
                        <MdRefresh size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* hidden file input for excel import */}
            <input
                type="file"
                id="excel-upload"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        setLoading(true);
                        await axios.post('/api/admin/import-excel', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            withCredentials: true
                        });
                        showNotification('Data imported successfully from Excel', 'success');
                        fetchAnalyticsData(); // Refresh data
                    } catch (err: any) {
                        showNotification('Import failed: ' + (err.response?.data?.message || err.message), 'error');
                    } finally {
                        setLoading(false);
                        e.target.value = ''; // Reset
                    }
                }}
            />

            {/* Calculations and New Metrics Section */}
            {(() => {
                const totalRev = analyticsData.totalRevenue || 0;
                const adRev = analyticsData.adRevenue || 0;
                const subRev = Math.max(0, totalRev - adRev);
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Revenue Card */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
                                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalRev)}</h3>
                                </div>
                                <div style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '12px' }}>
                                    <MdMonetizationOn size={24} />
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                {(analyticsData.revenueChange || 0) >= 0 ? (
                                    <MdTrendingUp color="#10b981" />
                                ) : (
                                    <MdTrendingDown color="#ef4444" />
                                )}
                                <span style={{ color: (analyticsData.revenueChange || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                    {formatPercentage(analyticsData.revenueChange || 0)}
                                </span>
                                <span style={{ color: '#94a3b8' }}>vs last period</span>
                            </div>
                        </div>

                        {/* Subscription Revenue Card */}
                        <div style={{
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#1e40af', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscription Revenue</p>
                                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a' }}>{formatCurrency(subRev)}</h3>
                                </div>
                                <div style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                    <MdAccountBalanceWallet size={24} />
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Revenue from plans</span>
                            </div>
                        </div>

                        {/* Ad Revenue Card */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ad Revenue</p>
                                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(analyticsData.adRevenue || 0)}</h3>
                                </div>
                                <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}>
                                    <MdStar size={24} />
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <select
                                    value={adPaymentType}
                                    onChange={(e) => setAdPaymentType(e.target.value)}
                                    style={{ border: 'none', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: '#4b5563' }}
                                >
                                    <option value="All">All Payments</option>
                                    <option value="Cash">Cash Only</option>
                                    <option value="Other">Digital/Bank</option>
                                </select>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.85rem',
                                    color: (analyticsData.adRevenueChange || 0) >= 0 ? '#f59e0b' : '#ef4444',
                                    fontWeight: 700
                                }}>
                                    {(analyticsData.adRevenueChange || 0) >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                                    {analyticsData.adRevenueChange}%
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Basic Stats Summary Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '10px' }}><MdGroups size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Customers</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatNumber(analyticsData.totalSubscribers || 0)}</div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '10px', borderRadius: '10px' }}><MdShowChart size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Subs</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatNumber(analyticsData.activeSubscriptions || 0)}</div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '10px' }}><MdHistory size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Expense</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(analyticsData.totalPurchaseCost || 0)}</div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#faf5ff', color: '#a855f7', padding: '10px', borderRadius: '10px' }}><MdBarChart size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Expiring 30d</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{analyticsData.expiringCount || 0}</div>
                    </div>
                </div>
            </div>

            {/* Charts and Detailed Analytics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                {/* Main Chart Area */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div>
                            <h2 style={{
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#1e293b'
                            }}>
                                Revenue Trends
                            </h2>
                            <p style={{
                                margin: 0,
                                color: '#64748b',
                                fontSize: '0.9rem'
                            }}>
                                {getTimeRangeLabel(timeRange)} • Subscription & Advertisement Revenue
                            </p>
                        </div>

                    </div>

                    {/* Revenue Trend Chart */}
                    <div style={{
                        height: '300px',
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                    }}>
                        {analyticsData.revenueTrend && analyticsData.revenueTrend.length > 0 ? (
                            <Line
                                data={{
                                    labels: analyticsData.revenueTrend.map((item: any) =>
                                        new Date(item.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                    ),
                                    datasets: [
                                        {
                                            label: 'Total Revenue',
                                            data: analyticsData.revenueTrend.map((item: any) => item.totalRevenue),
                                            borderColor: '#667eea',
                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                            fill: true,
                                            tension: 0.4,
                                            pointRadius: 0,
                                            pointHoverRadius: 6,
                                            pointHoverBackgroundColor: '#667eea',
                                            pointHoverBorderColor: '#ffffff',
                                            pointHoverBorderWidth: 2,
                                        },
                                        {
                                            label: 'Subscription Revenue',
                                            data: analyticsData.revenueTrend.map((item: any) => item.subscriptionRevenue),
                                            borderColor: '#10b981',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            fill: false,
                                            tension: 0.4,
                                            pointRadius: 0,
                                            pointHoverRadius: 4,
                                            pointHoverBackgroundColor: '#10b981',
                                            pointHoverBorderColor: '#ffffff',
                                            pointHoverBorderWidth: 2,
                                        },
                                        {
                                            label: 'Advertisement Revenue',
                                            data: analyticsData.revenueTrend.map((item: any) => item.advertisementRevenue),
                                            borderColor: '#f59e0b',
                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                            fill: false,
                                            tension: 0.4,
                                            pointRadius: 0,
                                            pointHoverRadius: 4,
                                            pointHoverBackgroundColor: '#f59e0b',
                                            pointHoverBorderColor: '#ffffff',
                                            pointHoverBorderWidth: 2,
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    interaction: {
                                        intersect: false,
                                        mode: 'index'
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top' as const,
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20,
                                                font: {
                                                    size: 12,
                                                    weight: 500
                                                }
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            titleColor: '#1e293b',
                                            bodyColor: '#64748b',
                                            borderColor: '#e2e8f0',
                                            borderWidth: 1,
                                            cornerRadius: 8,
                                            padding: 12,
                                            displayColors: true,
                                            callbacks: {
                                                title: function (context) {
                                                    const date = new Date(analyticsData.revenueTrend[context[0].dataIndex].date);
                                                    return date.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    });
                                                },
                                                label: function (context) {
                                                    return `${context.dataset.label}: ₹${(context.parsed.y || 0).toLocaleString('en-IN')}`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            grid: {
                                                display: false
                                            },
                                            ticks: {
                                                font: {
                                                    size: 11
                                                },
                                                maxTicksLimit: 7
                                            }
                                        },
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: '#f1f5f9'
                                            },
                                            ticks: {
                                                callback: function (value) {
                                                    return '₹' + (value as number).toLocaleString('en-IN');
                                                },
                                                font: {
                                                    size: 11
                                                }
                                            }
                                        }
                                    },
                                    elements: {
                                        point: {
                                            hoverRadius: 6
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
                                borderRadius: '8px',
                                border: '2px dashed #cbd5e1'
                            }}>
                                <div style={{ textAlign: 'center', color: '#64748b' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                                        <path d="M9 19V13L4 9L9 5L14 9V19M9 19L14 19M9 19L4 15M14 19L19 15V9L14 13V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                                        No Revenue Data Available
                                    </p>
                                    <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                        Revenue trends will appear here as transactions occur
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Panel - Top Metrics */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1e293b'
                    }}>
                        Key Insights
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1rem',
                            background: '#f0f4ff',
                            borderRadius: '8px',
                            border: '1px solid #c7d2fe'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#667eea'
                                }}></div>
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: '#3730a3'
                                }}>
                                    Best Performing Plan
                                </span>
                            </div>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                {analyticsData.topPlan || '6 Month Plan'} - {formatNumber(analyticsData.topPlanCount || 145)} subscribers
                            </p>
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: '#fef3f2',
                            borderRadius: '8px',
                            border: '1px solid #fecaca'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#dc2626'
                                }}></div>
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: '#991b1b'
                                }}>
                                    Expiring Soon
                                </span>
                            </div>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                {formatNumber(analyticsData.expiringCount || 23)} subscriptions expiring this month
                            </p>
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            border: '1px solid #bbf7d0'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#16a34a'
                                }}></div>
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: '#14532d'
                                }}>
                                    Growth Rate
                                </span>
                            </div>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                {formatPercentage(analyticsData.growthRate || 18.5)} new subscribers this period
                            </p>
                        </div>
                    </div>
                </div>
            </div>



            {/* Bottom Analytics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Geographic Distribution */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1e293b'
                    }}>
                        Geographic Distribution
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(!analyticsData.geographicData || analyticsData.geographicData.length === 0) ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: '#64748b',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                    No geographic data available
                                </p>
                            </div>
                        ) : (
                            analyticsData.geographicData.map((item: any, index: number) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        minWidth: '80px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: '#64748b'
                                    }}>
                                        {item.region}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            height: '8px',
                                            background: '#e2e8f0',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${item.percentage}%`,
                                                background: `linear-gradient(90deg, ${index === 0 ? '#667eea' :
                                                    index === 1 ? '#764ba2' :
                                                        index === 2 ? '#f59e0b' :
                                                            index === 3 ? '#10b981' : '#8b5cf6'
                                                    }, ${index === 0 ? '#7c3aed' :
                                                        index === 1 ? '#667eea' :
                                                            index === 2 ? '#d97706' :
                                                                index === 3 ? '#059669' : '#7c3aed'
                                                    })`,
                                                borderRadius: '4px'
                                            }}></div>
                                        </div>
                                    </div>
                                    <div style={{
                                        minWidth: '60px',
                                        textAlign: 'right',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: '#1e293b'
                                    }}>
                                        {item.count}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1e293b'
                    }}>
                        Revenue Breakdown
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(analyticsData.revenueBreakdown || [
                            { source: 'Subscriptions', amount: 0, percentage: 0, color: '#667eea' },
                            { source: 'Advertisements', amount: 0, percentage: 0, color: '#f59e0b' },
                            { source: 'Other', amount: 0, percentage: 0, color: '#10b981' }
                        ]).map((item: any, index: number) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: item.color,
                                    flexShrink: 0
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.25rem'
                                    }}>
                                        <span style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: '#1e293b'
                                        }}>
                                            {item.source}
                                        </span>
                                        <span style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: '#64748b'
                                        }}>
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: '#e2e8f0',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${item.percentage}%`,
                                            background: item.color,
                                            borderRadius: '3px'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{
                        margin: '0 0 1.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1e293b'
                    }}>
                        Recent Activity
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(!analyticsData.recentActivity || analyticsData.recentActivity.length === 0) ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                color: '#64748b',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '2px dashed #e2e8f0'
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                                    <path d="M9 19V13L4 9L9 5L14 9V19M9 19L14 19M9 19L4 15M14 19L19 15V9L14 13V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                                    No Recent Activity
                                </p>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                    Activity data will appear here as transactions occur.
                                </p>
                            </div>
                        ) : (
                            analyticsData.recentActivity.map((activity: any, index: number) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: activity.type === 'subscription' ? '#dbeafe' :
                                            activity.type === 'payment' ? '#dcfce7' :
                                                activity.type === 'advertisement' ? '#fef3c7' : '#e0e7ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: activity.type === 'subscription' ? '#1d4ed8' :
                                            activity.type === 'payment' ? '#166534' :
                                                activity.type === 'advertisement' ? '#92400e' : '#3730a3'
                                    }}>
                                        {activity.type === 'subscription' && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        )}
                                        {activity.type === 'payment' && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93M12 8C10.8954 8 10 8.89543 10 10V14C10 15.1046 10.8954 16 12 16C13.1046 16 14 15.1046 14 14V10C14 8.89543 13.1046 8 12 8Z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        )}
                                        {activity.type === 'advertisement' && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        )}
                                        {activity.type === 'renewal' && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8.41421C20 8.149 19.8946 7.89464 19.7071 7.70711L14.2929 2.29289C14.1054 2.10536 13.851 2 13.5858 2H6C4.89543 2 4 2.89543 4 4Z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {activity.action}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#64748b'
                                        }}>
                                            {activity.user} • {activity.time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Data Management Section - Moved from QuickOrderView */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>

                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#eef2ff', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', margin: '0 auto 1.5rem'
                        }}>
                            <MdCloudUpload size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', marginTop: 0 }}>Bulk Data Management</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Import new subscribers or export existing data</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                        {/* Template Card */}
                        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}><MdFileDownload /></div>
                                <span style={{ fontWeight: 600, color: '#334155' }}>Step 1: Get Template</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Download the Excel template to ensure your data is formatted correctly.</p>
                            <button onClick={downloadSample} style={{
                                padding: '0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px',
                                cursor: 'pointer', fontWeight: 600, color: '#475569', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                            }}>
                                <MdFileDownload size={18} /> Download Template
                            </button>
                        </div>

                        {/* Export Card */}
                        <div style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}><MdCloudUpload /></div>
                                <span style={{ fontWeight: 600, color: '#334155' }}>Export Data</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Download a complete backup of all customer data in Excel format.</p>
                            <button onClick={downloadBulkData} style={{
                                padding: '0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px',
                                cursor: 'pointer', fontWeight: 600, color: '#475569', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                            }}>
                                <MdFileDownload size={18} /> Export All Data
                            </button>
                        </div>
                    </div>

                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', position: 'relative', transition: 'all 0.3s' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        <div style={{ width: '64px', height: '64px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', margin: '0 auto 1.5rem' }}>
                            <MdCloudUpload size={32} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Click or Drag to Upload Excel</h3>
                        <p style={{ margin: 0, color: '#94a3b8' }}>Supports .xlsx and .xls files</p>
                    </div>

                    {importData.length > 0 && (
                        <div style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontWeight: 700 }}>{importData.length}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 700, color: '#334155' }}>Records Found</span>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Ready to import</span>
                                    </div>
                                </div>
                                <button onClick={submitBulkData} style={{
                                    padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
                                    borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                                }}>
                                    Start Import
                                </button>
                            </div>
                            <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Mobile</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Type</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Plan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importData.map((r: any, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                                <td style={{ padding: '1rem', color: '#334155', fontWeight: 500 }}>{r.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b' }}>{r.mobile}</td>
                                                <td style={{ padding: '1rem' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: '#eef2ff', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>{r.customerType}</span></td>
                                                <td style={{ padding: '1rem', color: '#64748b' }}>{r.planName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>



            {
                showReportModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '16px',
                            width: '90%',
                            maxWidth: '500px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1e293b' }}>
                                Download Revenue Report
                            </h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
                                    Report Type
                                </label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value="subscription"
                                            checked={reportType === 'subscription'}
                                            onChange={(e) => setReportType(e.target.value)}
                                            style={{ accentColor: '#667eea', width: '18px', height: '18px' }}
                                        />
                                        Subscription Revenue
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value="advertisement"
                                            checked={reportType === 'advertisement'}
                                            onChange={(e) => setReportType(e.target.value)}
                                            style={{ accentColor: '#667eea', width: '18px', height: '18px' }}
                                        />
                                        Advertisement Revenue
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
                                        Period
                                    </label>
                                    <select
                                        value={reportPeriod}
                                        onChange={(e) => setReportPeriod(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            color: '#1e293b'
                                        }}
                                    >
                                        <option value="day">Daily</option>
                                        <option value="month">Monthly</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
                                        {reportPeriod === 'year' ? 'Year' : reportPeriod === 'month' ? 'Select Month & Year' : 'Date'}
                                    </label>
                                    {reportPeriod === 'year' ? (
                                        <select
                                            value={new Date(reportDate).getFullYear()}
                                            onChange={(e) => {
                                                const d = new Date(reportDate);
                                                d.setFullYear(parseInt(e.target.value));
                                                setReportDate(d.toISOString().split('T')[0]);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                background: '#f8fafc',
                                                color: '#1e293b'
                                            }}
                                        >
                                            {Array.from({ length: 15 }, (_, i) => {
                                                const year = 2024 + i;
                                                return (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : reportPeriod === 'month' ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select
                                                value={new Date(reportDate).getMonth()}
                                                onChange={(e) => {
                                                    const d = new Date(reportDate);
                                                    d.setMonth(parseInt(e.target.value));
                                                    setReportDate(d.toISOString().split('T')[0]);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    background: '#f8fafc',
                                                    color: '#1e293b'
                                                }}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={new Date(reportDate).getFullYear()}
                                                onChange={(e) => {
                                                    const d = new Date(reportDate);
                                                    d.setFullYear(parseInt(e.target.value));
                                                    setReportDate(d.toISOString().split('T')[0]);
                                                }}
                                                style={{
                                                    width: '100px',
                                                    padding: '0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    background: '#f8fafc',
                                                    color: '#1e293b'
                                                }}
                                            >
                                                {Array.from({ length: 15 }, (_, i) => {
                                                    const year = 2024 + i;
                                                    return (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    ) : (
                                        <input
                                            type="date"
                                            value={reportDate}
                                            onChange={(e) => setReportDate(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                background: '#f8fafc',
                                                color: '#1e293b'
                                            }}
                                            onClick={(e) => {
                                                (e.target as HTMLInputElement).showPicker();
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {reportType === 'subscription' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
                                        Payment Method (Optional)
                                    </label>
                                    <select
                                        value={subPaymentMethod}
                                        onChange={(e) => setSubPaymentMethod(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            color: '#1e293b'
                                        }}
                                    >
                                        <option value="">All Transactions (Cash & Online)</option>
                                        <option value="Cash">Cash Only</option>
                                        <option value="Other">Online / Bank Transfer / Other</option>
                                    </select>
                                </div>
                            )}

                            {reportType === 'advertisement' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
                                        Payment Method (Optional)
                                    </label>
                                    <select
                                        value={reportAdPaymentMethod}
                                        onChange={(e) => setReportAdPaymentMethod(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            color: '#1e293b'
                                        }}
                                    >
                                        <option value="">All Transactions (Cash & Online)</option>
                                        <option value="Cash">Cash Only</option>
                                        <option value="Other">Online / Bank Transfer / Other</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        background: 'white',
                                        color: '#64748b',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDownloadReport}
                                    disabled={reportLoading}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: reportLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: reportLoading ? 0.7 : 1
                                    }}
                                >
                                    {reportLoading ? (
                                        <>
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid white',
                                                borderTopColor: 'transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Security Modal */}
            <SecuritySettingsModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                showNotification={showNotification}
            />
        </div >
    );
};

export default AnalyticsView;
