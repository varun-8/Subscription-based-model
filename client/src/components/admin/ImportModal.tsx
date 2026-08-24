import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { MdClose, MdCloudUpload, MdInfoOutline, MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import axios from 'axios';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'customers' | 'subscriptions' | 'advertisements';
    onSuccess: (count: number) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any[]>([]);
    const [step, setStep] = useState<1 | 2>(1); // 1: Upload/Preview, 2: Result

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setPreview(data);
            setFile(selectedFile);
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleImport = async () => {
        if (!preview.length) return;

        setLoading(true);
        setErrors([]);
        try {
            let endpoint = '';
            let payload = {};

            if (type === 'customers') {
                endpoint = '/api/admin/bulk-import-customers';
                payload = { records: preview };
            } else if (type === 'subscriptions') {
                endpoint = '/api/admin/bulk-import';
                payload = { records: preview };
            } else if (type === 'advertisements') {
                endpoint = '/api/admin/bulk-import-ads';
                payload = { records: preview };
            }

            const res = await axios.post(endpoint, payload, { withCredentials: true });
            
            if (res.data.errors && res.data.errors.length > 0) {
                setErrors(res.data.errors);
            }
            
            setStep(2);
            if (res.data.successCount > 0) {
                onSuccess(res.data.successCount);
            }
        } catch (err: any) {
            setErrors([{ message: err.response?.data?.message || 'Import failed. Check column headers.' }]);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        let headers: string[] = [];
        if (type === 'customers') {
            headers = ['Customer ID', 'Name', 'Mobile', 'WhatsApp', 'Customer Type', 'Dispatch Preference', 'Street', 'Landmark', 'Taluk', 'District', 'State', 'Country', 'Pincode', 'Status'];
        } else if (type === 'subscriptions') {
            headers = ['Sub ID', 'Ref No', 'Customer ID', 'Customer Name', 'Mobile', 'WhatsApp', 'Plan', 'Start Date', 'End Date', 'Payment Method', 'Receipt No', 'Status', 'Customer Type', 'Dispatch Info', 'Street', 'Taluk', 'District', 'State', 'Pincode'];
        } else if (type === 'advertisements') {
            headers = ['Client Name', 'Ref No', 'Ad Name', 'Ad Types', 'Page Size', 'Qty', 'Total Price', 'Start Date', 'End Date', 'Payment Method', 'Payment Status', 'Client Mobile', 'Client WhatsApp', 'Taluk', 'District'];
        }

        const ws = XLSX.utils.json_to_sheet([headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {})], { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${type}_import_template.xlsx`);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px',
                display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                            Import {type.charAt(0).toUpperCase() + type.slice(1)}
                        </h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Upload Excel file to bulk create records</p>
                    </div>
                    <button onClick={onClose} style={{
                        width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b'
                    }}>
                        <MdClose size={20} />
                    </button>
                </div>

                <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {step === 1 ? (
                        <>
                            <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                                <MdInfoOutline size={24} color="#0369a1" style={{ flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, color: '#0c4a6e', fontSize: '0.9rem' }}>Template Requirement</div>
                                    <div style={{ fontSize: '0.85rem', color: '#0369a1', marginTop: '4px' }}>
                                        Please use the correct column headers. Download the template to ensure data compatibility.
                                    </div>
                                    <button onClick={downloadTemplate} style={{
                                        marginTop: '10px', padding: '6px 12px', background: '#0369a1', color: 'white', border: 'none',
                                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                                    }}>
                                        Download Template
                                    </button>
                                </div>
                            </div>

                            {!file ? (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '3rem 2rem', cursor: 'pointer',
                                    transition: 'all 0.2s', background: '#f8fafc'
                                }} onDragOver={(e) => e.preventDefault()}>
                                    <MdCloudUpload size={48} color="#94a3b8" />
                                    <span style={{ marginTop: '1rem', fontWeight: 600, color: '#475569' }}>Click or drag Excel file here</span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Supports .xlsx, .xls</span>
                                    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                            ) : (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                                        <button onClick={() => { setFile(null); setPreview([]); }} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}>Change</button>
                                    </div>
                                    <div style={{ padding: '1rem', maxHeight: '200px', overflow: 'auto' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Found {preview.length} rows</div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                                    {preview.length > 0 && Object.keys(preview[0]).map(k => <th key={k} style={{ padding: '4px 8px' }}>{k}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.slice(0, 5).map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                        {Object.values(row).map((v: any, j) => <td key={j} style={{ padding: '4px 8px', color: '#475569' }}>{String(v)}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {preview.length > 5 && <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8', fontSize: '0.75rem' }}>... and {preview.length - 5} more rows</div>}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            {errors.length === 0 ? (
                                <>
                                    <MdCheckCircle size={64} color="#10b981" />
                                    <h3 style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#1e293b' }}>Import Complete!</h3>
                                    <p style={{ color: '#64748b' }}>Successfully processed {preview.length - errors.length} records.</p>
                                </>
                            ) : (
                                <>
                                    <MdErrorOutline size={64} color="#f59e0b" />
                                    <h3 style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#1e293b' }}>Completed with Issues</h3>
                                    <p style={{ color: '#64748b' }}>Processed {preview.length - errors.length} records, but {errors.length} rows failed.</p>
                                    
                                    <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem', marginBottom: '8px' }}>Error Details:</div>
                                        <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem', color: '#b91c1c' }}>
                                            {errors.map((err, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>Row {err.user || i+1}: {err.message}</div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc' }}>
                    <button onClick={onClose} style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white',
                        fontWeight: 600, color: '#64748b', cursor: 'pointer'
                    }}>
                        {step === 2 ? 'Close' : 'Cancel'}
                    </button>
                    {step === 1 && (
                        <button 
                            onClick={handleImport}
                            disabled={!file || loading}
                            style={{
                                padding: '0.75rem 2rem', borderRadius: '12px', border: 'none', background: loading || !file ? '#cbd5e1' : '#1e293b',
                                fontWeight: 600, color: 'white', cursor: loading || !file ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {loading ? 'Processing...' : 'Start Import'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
