import React, { useState, useRef, useEffect } from 'react';
import { MdPerson, MdPhone, MdLocationOn, MdDateRange, MdConfirmationNumber, MdLayers, MdShortText, MdPayment } from 'react-icons/md';
import axios from 'axios';
import SearchableSelect from './SearchableSelect';

interface SalesEntryFormModalProps {
    onSubmit: (data: any) => void;
    onClose: () => void;
    initialData?: any;
    onDelete?: (id: string) => void;
    confirm?: (title: string, message: string, action: () => void) => void;
    showNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SalesEntryFormModal: React.FC<SalesEntryFormModalProps> = ({ onSubmit, onClose, onDelete, initialData, confirm, showNotification }) => {
    const [formData, setFormData] = useState({
        billNo: '',
        date: new Date().toISOString().split('T')[0],
        salesCategory: '',
        customerName: '',
        modeOfPayment: 'Cash',
        salesmen: '',
        remarks: ''
    });

    const [items, setItems] = useState<any[]>([]);
    const [currentProductName, setCurrentProductName] = useState('');
    const lastRowQtyRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                billNo: initialData.billNo || '',
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
                salesCategory: initialData.salesCategory || '',
                customerName: initialData.customerName || '',
                modeOfPayment: initialData.modeOfPayment || 'Cash',
                salesmen: initialData.salesmen || '',
                remarks: initialData.remarks || ''
            });

            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map((i: any, idx: number) => ({
                    id: idx,
                    productName: i.productName,
                    qty: i.qty,
                    rate: i.rate,
                    amount: i.amount
                })));
            } else if (initialData.price) {
                // Legacy support
                setItems([{
                    id: 0,
                    productName: 'Legacy Item',
                    qty: 1,
                    rate: initialData.price,
                    amount: initialData.price
                }]);
            } else {
                setItems([]);
            }
        }
    }, [initialData]);

    // Focus last row qty when items change (add)
    useEffect(() => {
        if (items.length > 0 && lastRowQtyRef.current) {
            lastRowQtyRef.current.focus();
        }
    }, [items.length]);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAddProduct = () => {
        if (!currentProductName.trim()) return;

        setItems([
            ...items,
            {
                id: Date.now(),
                productName: currentProductName,
                qty: '', // Empty as requested
                rate: '',
                amount: 0
            }
        ]);
        setCurrentProductName('');
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        item[field] = value;

        // Calculate Amount if valid numbers
        const q = parseFloat(item.qty) || 0;
        const r = parseFloat(item.rate) || 0;
        item.amount = q * r;

        newItems[index] = item;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate
        if (items.length === 0) {
            if (showNotification) showNotification("Please add at least one product.", "warning");
            else alert("Please add at least one product.");
            return;
        }

        const payload = {
            ...formData,
            items: items.map(i => ({
                productName: i.productName,
                qty: parseFloat(i.qty) || 0,
                rate: parseFloat(i.rate) || 0,
                amount: i.amount
            })),
            totalAmount: calculateTotal()
        };
        onSubmit(payload);
    };

    const totalAmount = calculateTotal();

    // Styles



    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1100px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header Bar */}
                <div className="modal-header" style={{ background: '#e0f2fe', color: '#000', padding: '0.5rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #bae6fd' }}>
                    <h3 className="modal-title" style={{ color: '#0369a1', fontWeight: 'bold' }}>Sales Entry</h3>
                    <button className="modal-close" onClick={onClose} style={{ color: '#475569', fontSize: '1.5rem' }}>&times;</button>
                </div>

                <div className="modal-body" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                        {/* Top Form Section - Compact Grid */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                                {/* Row 1 */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Bill No</label>
                                    <input className="form-input" name="billNo" value={formData.billNo} onChange={handleHeaderChange} required style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Date</label>
                                    <input type="date" className="form-input" name="date" value={formData.date} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Customer Name</label>
                                    <input className="form-input" name="customerName" value={formData.customerName} onChange={handleHeaderChange} required style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Payment Mode</label>
                                    <select className="form-input" name="modeOfPayment" value={formData.modeOfPayment} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.4rem' }}>
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Account Transfer">Account</option>
                                        <option value="Credit Transaction">Credit Transaction</option>
                                    </select>
                                </div>

                                {/* Row 2 */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Sales Category</label>
                                    <input className="form-input" name="salesCategory" value={formData.salesCategory} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Salesman</label>
                                    <input className="form-input" name="salesmen" value={formData.salesmen} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Remarks</label>
                                    <input className="form-input" name="remarks" value={formData.remarks} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.4rem' }} />
                                </div>
                            </div>
                        </div>

                        {/* Product Entry Bar - Compact */}
                        <div style={{
                            background: '#eff6ff', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #bfdbfe'
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    className="form-input"
                                    style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.5rem 0.5rem 0.5rem 2.5rem', fontSize: '1rem', height: '40px' }}
                                    value={currentProductName}
                                    onChange={(e) => setCurrentProductName(e.target.value)}
                                    placeholder="Scan or Type Product Name..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddProduct();
                                        }
                                    }}
                                />
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', fontWeight: 'bold' }}>🔍</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                style={{
                                    background: '#3b82f6', color: '#fff', border: 'none',
                                    fontWeight: 'bold', padding: '0 1.5rem', borderRadius: '4px', cursor: 'pointer', height: '40px'
                                }}
                            >
                                ADD ITEM
                            </button>
                        </div>

                        {/* Items Table - Big & Visible */}
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflowY: 'auto', background: '#fff', marginBottom: '1rem', minHeight: '300px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                                <thead style={{ background: '#f0f9ff', position: 'sticky', top: 0, zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', width: '60px', color: '#475569', textAlign: 'center' }}>#</th>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', textAlign: 'left', color: '#475569' }}>Item Name</th>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', width: '120px', color: '#475569', textAlign: 'right' }}>Qty</th>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', width: '150px', color: '#475569', textAlign: 'right' }}>Price</th>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', width: '150px', color: '#475569', textAlign: 'right' }}>Amount</th>
                                        <th style={{ borderBottom: '2px solid #e2e8f0', padding: '1rem', width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 500, color: '#0f172a' }}>{item.productName}</td>
                                            <td style={{ padding: '0' }}>
                                                <input
                                                    ref={index === items.length - 1 ? lastRowQtyRef : null}
                                                    type="number"
                                                    style={{ width: '100%', height: '100%', border: '2px solid transparent', padding: '0.75rem', textAlign: 'right', outline: 'none', background: '#f8fafc', fontSize: '1rem', fontWeight: 600, color: '#0ea5e9' }}
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                    placeholder="0"
                                                    onFocus={(e) => e.target.style.background = '#e0f2fe'}
                                                    onBlur={(e) => e.target.style.background = '#f8fafc'}
                                                />
                                            </td>
                                            <td style={{ padding: '0' }}>
                                                <input
                                                    type="number"
                                                    style={{ width: '100%', height: '100%', border: '2px solid transparent', padding: '0.75rem', textAlign: 'right', outline: 'none', background: '#fff', fontSize: '1rem' }}
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                    placeholder="0.00"
                                                    onFocus={(e) => e.target.style.background = '#fffbeb'}
                                                    onBlur={(e) => e.target.style.background = '#fff'}
                                                />
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>
                                                {(item.amount || 0).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '0', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', padding: '0.5rem' }}
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Section */}
                        <div style={{ background: '#f0f9ff', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '4px', border: '1px solid #e0f2fe' }}>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No of Items</span>
                                    <strong style={{ color: '#0f172a' }}>{items.length}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No of Units</span>
                                    <strong style={{ color: '#0f172a' }}>{items.reduce((acc, i) => acc + (parseFloat(i.qty) || 0), 0)}</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', marginBottom: '0.2rem', color: '#64748b' }}>Gross Value: {(totalAmount).toFixed(2)}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>Net Amount: {(totalAmount).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn-secondary"
                                    >
                                        Exit
                                    </button>
                                    {initialData && onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm) {
                                                    confirm('Delete Sales Entry?', 'Are you sure you want to delete this sales entry?', () => {
                                                        onDelete(initialData._id || initialData.id);
                                                    });
                                                } else if (window.confirm('Are you sure you want to delete this sales entry?')) {
                                                    onDelete(initialData._id || initialData.id);
                                                }
                                            }}
                                            className="btn-danger"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

interface PurchaseEntryFormModalProps {
    onSubmit: (data: any) => void;
    onClose: () => void;
    initialData?: any;
    onDelete?: (id: string) => void;
    confirm?: (title: string, message: string, action: () => void) => void;
    showNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PurchaseEntryFormModal: React.FC<PurchaseEntryFormModalProps> = ({ onSubmit, onClose, onDelete, initialData, confirm, showNotification }) => {
    const [formData, setFormData] = useState({
        entryNo: '',
        billNo: '',
        date: new Date().toISOString().split('T')[0],
        billDate: '',
        supplier: '',
        purchaseCategory: '',
        modeOfPayment: 'Cash',
        enteredBy: '',
        remarks: ''
    });

    const [items, setItems] = useState<any[]>([]);
    const [currentProductName, setCurrentProductName] = useState('');
    const lastRowQtyRef = useRef<HTMLInputElement>(null);
    const rowRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                entryNo: initialData.entryNo || '',
                billNo: initialData.billNo || '',
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
                billDate: initialData.billDate ? initialData.billDate.split('T')[0] : '',
                supplier: initialData.supplier || '',
                purchaseCategory: initialData.purchaseCategory || '',
                modeOfPayment: initialData.modeOfPayment || 'Cash',
                enteredBy: initialData.enteredBy || '',
                remarks: initialData.remarks || ''
            });

            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map((i: any, idx: number) => ({
                    id: idx,
                    productName: i.productName,
                    qty: i.qty,
                    rate: i.rate,
                    amount: i.amount
                })));
            } else if (initialData.productName) {
                // Legacy support for single item
                setItems([{
                    id: 0,
                    productName: initialData.productName,
                    qty: initialData.qty,
                    rate: initialData.billAmount / (initialData.qty || 1),
                    amount: initialData.billAmount
                }]);
            } else {
                setItems([]);
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (items.length > 0 && lastRowQtyRef.current) {
            lastRowQtyRef.current.focus();
        }
    }, [items.length]);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAddProduct = () => {
        if (!currentProductName.trim()) return;
        setItems([...items, {
            id: Date.now(),
            productName: currentProductName,
            qty: '', rate: '', amount: 0
        }]);
        setCurrentProductName('');
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        item[field] = value;
        const q = parseFloat(item.qty) || 0;
        const r = parseFloat(item.rate) || 0;
        item.amount = q * r;
        newItems[index] = item;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'qty') {
                // Move to Rate
                const rateInput = rowRefs.current[`rate-${index}`];
                if (rateInput) rateInput.focus();
            } else if (field === 'rate') {
                // Determine if it's the last row
                if (index === items.length - 1) {
                    // It's the last row, usually user might want to add new item or just stay? 
                    // Let's just focus back to product search to add new item or if we had a way to add empty row.
                    // But here structure is: Search Product -> Add -> Edit Qty/Rate.
                    // So if done with rate, maybe focus back to Product Search?
                    // Or if we want to simulate grid entry where next row is empty? 
                    // Based on existing UI (Add Item button), let's focus on Product Search input.
                    // But wait, the user said "move horizontally to the next field".
                    // Qty -> Rate -> Next??
                    // If no next field, loop or stop.
                    // Let's assume focusing Product Search is efficient flow.
                    // Actually, let's try to find an element with id 'product-search-input'
                    const productInput = document.getElementById('product-search-input');
                    if (productInput) productInput.focus();
                } else {
                    // Move to next row Qty
                    const nextQty = rowRefs.current[`qty-${index + 1}`];
                    if (nextQty) nextQty.focus();
                }
            }
        }
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            if (showNotification) showNotification("Please add at least one product.", "warning");
            else alert("Please add at least one product.");
            return;
        }
        onSubmit({
            ...formData,
            items: items.map(i => ({
                productName: i.productName,
                qty: parseFloat(i.qty) || 0,
                rate: parseFloat(i.rate) || 0,
                amount: i.amount
            })),
            billAmount: calculateTotal()
        });
    };

    const totalAmount = calculateTotal();

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1100px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '1rem 1.5rem', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', borderBottom: 'none' }}>
                    <h3 className="modal-title" style={{ color: '#fff', fontWeight: 600, letterSpacing: '0.02em' }}>
                        {initialData ? 'Edit Purchase Transaction' : 'New Purchase Transaction'}
                    </h3>
                    <button className="modal-close" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem' }}>&times;</button>
                </div>

                <div className="modal-body" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Top Form Grid */}
                        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdConfirmationNumber size={14} color="#6366f1" /> Entry No
                                    </label>
                                    <input
                                        className="form-input"
                                        name="entryNo"
                                        value={formData.entryNo}
                                        readOnly
                                        placeholder="Auto"
                                        style={{ width: '100%', padding: '0.6rem', background: '#f3f4f6', color: '#6b7280', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdConfirmationNumber size={14} color="#6366f1" /> Bill No <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input className="form-input" name="billNo" value={formData.billNo} onChange={handleHeaderChange} required style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdPerson size={14} color="#6366f1" /> Supplier
                                    </label>
                                    <input className="form-input" name="supplier" value={formData.supplier} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdPerson size={14} color="#6366f1" /> Entered By
                                    </label>
                                    <input className="form-input" name="enteredBy" value={formData.enteredBy} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdDateRange size={14} color="#6366f1" /> Date
                                    </label>
                                    <input type="date" className="form-input" name="date" value={formData.date} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdPayment size={14} color="#6366f1" /> Payment Mode
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <select
                                            className="form-input"
                                            name="modeOfPayment"
                                            value={formData.modeOfPayment && formData.modeOfPayment.startsWith('Account Transfer') ? 'Account Transfer' : formData.modeOfPayment}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, modeOfPayment: val });
                                            }}
                                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="GPay">GPay</option>
                                            <option value="Account Transfer">Account Transfer</option>
                                            <option value="Credit Transaction">Credit Transaction</option>
                                        </select>
                                        {(formData.modeOfPayment && formData.modeOfPayment.startsWith('Account Transfer')) && (
                                            <select
                                                className="form-input"
                                                value={formData.modeOfPayment.includes('-') ? formData.modeOfPayment.split(' - ')[1] : ''}
                                                onChange={(e) => {
                                                    const subMode = e.target.value;
                                                    setFormData({ ...formData, modeOfPayment: `Account Transfer - ${subMode}` });
                                                }}
                                                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                                            >
                                                <option value="">Select Mode</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="DD">DD</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdDateRange size={14} color="#6366f1" /> Bill Date
                                    </label>
                                    <input type="date" className="form-input" name="billDate" value={formData.billDate} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdLayers size={14} color="#6366f1" /> Category
                                    </label>
                                    <input className="form-input" name="purchaseCategory" value={formData.purchaseCategory} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdShortText size={16} color="#6366f1" /> Remarks
                                    </label>
                                    <input className="form-input" name="remarks" value={formData.remarks} onChange={handleHeaderChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                        </div>

                        {/* Product Bar */}
                        <div style={{
                            background: '#ffffff', padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
                            display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    id="product-search-input"
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.8rem', fontSize: '1rem' }}
                                    value={currentProductName}
                                    onChange={(e) => setCurrentProductName(e.target.value)}
                                    placeholder="Type Product Name..."
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(); } }}
                                />
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '1.2rem' }}>🔍</span>
                            </div>
                            <button type="button" onClick={handleAddProduct}
                                style={{
                                    background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600,
                                    padding: '0 1.5rem', borderRadius: '8px', cursor: 'pointer', height: '45px',
                                    fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                ADD ITEM
                            </button>
                        </div>

                        {/* Items Table */}
                        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '12px', overflowY: 'auto', background: '#fff', marginBottom: '1.5rem', minHeight: '300px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', width: '60px', color: '#6b7280', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Name</th>
                                        <th style={{ padding: '1rem', width: '120px', color: '#6b7280', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                                        <th style={{ padding: '1rem', width: '150px', color: '#6b7280', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                                        <th style={{ padding: '1rem', width: '150px', color: '#6b7280', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                        <th style={{ padding: '1rem', width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>{index + 1}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500, color: '#1f2937', fontSize: '0.95rem' }}>{item.productName}</td>
                                            <td style={{ padding: '0' }}>
                                                <input
                                                    ref={(el) => {
                                                        rowRefs.current[`qty-${index}`] = el;
                                                        if (index === items.length - 1) lastRowQtyRef.current = el; // Keep legacy ref working if needed
                                                    }}
                                                    type="number"
                                                    style={{ width: '100%', border: 'none', padding: '1rem', textAlign: 'right', background: '#f9fafb', fontWeight: 500, color: '#2563eb', fontSize: '0.95rem', outline: 'none' }}
                                                    value={item.qty}
                                                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index, 'qty')}
                                                    onFocus={(e) => e.target.style.background = '#eff6ff'}
                                                    onBlur={(e) => e.target.style.background = '#f9fafb'}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td style={{ padding: '0' }}>
                                                <input
                                                    ref={(el) => { rowRefs.current[`rate-${index}`] = el; }}
                                                    type="number"
                                                    style={{ width: '100%', border: 'none', padding: '1rem', textAlign: 'right', fontSize: '0.95rem', outline: 'none', color: '#374151' }}
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index, 'rate')}
                                                    onFocus={(e) => e.target.style.background = '#fffbeb'}
                                                    onBlur={(e) => e.target.style.background = 'transparent'}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{(item.amount || 0).toFixed(2)}</td>
                                            <td style={{ padding: '0', textAlign: 'center' }}>
                                                <button type="button" onClick={() => handleRemoveItem(index)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', padding: '0.5rem' }}>&times;</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div style={{ background: '#f9fafb', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div><span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>No of Items</span><br /><strong style={{ color: '#1f2937', fontSize: '1.1rem' }}>{items.length}</strong></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.2rem' }}>Grand Total</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>₹ {totalAmount.toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid #e5e7eb' }}>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>Save Entry</button>
                                    <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>Cancel</button>
                                    {initialData && onDelete && (
                                        <button type="button" onClick={() => {
                                            if (confirm) {
                                                confirm('Delete Purchase Entry?', 'Are you sure you want to delete this purchase entry?', () => {
                                                    onDelete(initialData._id);
                                                });
                                            } else if (window.confirm('Delete this entry?')) {
                                                onDelete(initialData._id);
                                            }
                                        }}
                                            className="btn-danger" style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>Delete</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


interface CourierEntryFormModalProps {
    onSubmit: (data: any) => void;
    onClose: () => void;
    initialData?: any;
    onDelete?: (id: string) => void;
    confirm?: (title: string, message: string, action: () => void) => void;
    showNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const CourierEntryFormModal: React.FC<CourierEntryFormModalProps> = ({ onSubmit, onClose, onDelete, initialData, confirm }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        customerName: '',
        subscriberNo: '',
        mobile: '',
        address: '',
        qty: 1,
        edition: new Date().toLocaleString('default', { month: 'short' }),
        remarks: ''
    });

    const [customers, setCustomers] = useState<any[]>([]);
    const [isCustomCustomer, setIsCustomCustomer] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get('/api/admin/subscribers', { withCredentials: true });
                setCustomers(res.data);
            } catch (err) { }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
                customerId: initialData.customerId || '',
                customerName: initialData.customerName || '',
                subscriberNo: initialData.subscriberNo || '',
                mobile: initialData.mobile || '',
                address: initialData.address || '',
                qty: initialData.qty || 1,
                edition: initialData.edition || 'Jan',
                remarks: initialData.remarks || ''
            });
            setIsCustomCustomer(!initialData.customerId && !!initialData.customerName);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerSelect = (custId: string) => {
        const cust = customers.find(c => c._id === custId);
        if (cust) {
            setFormData(prev => ({
                ...prev,
                customerId: cust._id,
                customerName: cust.name,
                subscriberNo: cust.subscriberNo,
                mobile: cust.mobile || '',
                address: [cust.address?.street, cust.address?.addressLine2, cust.address?.taluk, cust.address?.district, cust.address?.state, cust.address?.pincode].filter(Boolean).join(', ')
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData };
        if (!payload.customerId) delete (payload as any).customerId;
        onSubmit(payload);
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px', width: '95%', borderRadius: '24px', overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: '#fff', padding: '1.5rem 2rem', borderBottom: 'none' }}>
                    <div>
                        <h3 className="modal-title" style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>
                            {initialData ? 'Update Shipment' : 'New Courier Entry'}
                        </h3>
                        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Fill in the details to record your courier shipment.</p>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{ color: 'white', fontSize: '2rem', opacity: 0.7 }}>&times;</button>
                </div>

                <div className="modal-body" style={{ padding: '2rem', background: '#f8fafc' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#475569' }}>
                                    <MdDateRange /> Shipment Date
                                </label>
                                <input type="date" className="form-input" name="date" value={formData.date} onChange={handleChange} required
                                    style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '0.75rem', fontSize: '1rem' }} />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#475569' }}>
                                    <MdLayers /> Edition
                                </label>
                                <select className="form-input" name="edition" value={formData.edition} onChange={handleChange}
                                    style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '0.75rem', fontSize: '1rem', background: 'white' }}>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.05rem' }}>
                                    <MdPerson color="#4f46e5" /> Customer Information
                                </label>
                                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#6366f1', fontWeight: 600, padding: '4px 12px', background: '#eff6ff', borderRadius: '99px' }}>
                                    <input
                                        type="checkbox"
                                        checked={isCustomCustomer}
                                        onChange={(e) => {
                                            setIsCustomCustomer(e.target.checked);
                                            setFormData(prev => ({
                                                ...prev,
                                                customerId: '', subscriberNo: '', mobile: '', address: '', customerName: ''
                                            }));
                                        }}
                                        style={{ accentColor: '#4f46e5' }}
                                    />
                                    Manual Entry
                                </label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {isCustomCustomer ? (
                                    <input
                                        className="form-input"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder="Full Customer Name"
                                        required
                                        style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '0.75rem' }}
                                    />
                                ) : (
                                    <SearchableSelect
                                        options={customers}
                                        value={formData.customerId}
                                        onChange={handleCustomerSelect}
                                        placeholder="Type to search subscriber..."
                                        labelKey="name"
                                        valueKey="_id"
                                        required={!isCustomCustomer}
                                    />
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group-inner">
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MdConfirmationNumber /> Sub No
                                        </label>
                                        <input
                                            className="form-input"
                                            name="subscriberNo"
                                            value={formData.subscriberNo}
                                            onChange={handleChange}
                                            readOnly={!isCustomCustomer}
                                            style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', padding: '0.5rem 0.75rem', background: !isCustomCustomer ? '#f8fafc' : 'white' }}
                                            placeholder="Auto-filled"
                                        />
                                    </div>
                                    <div className="form-group-inner">
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MdPhone /> Contact
                                        </label>
                                        <input
                                            className="form-input"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            readOnly={!isCustomCustomer}
                                            style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', padding: '0.5rem 0.75rem', background: !isCustomCustomer ? '#f8fafc' : 'white' }}
                                            placeholder="Auto-filled"
                                        />
                                    </div>
                                </div>

                                <div className="form-group-inner">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MdLocationOn /> Delivery Address
                                    </label>
                                    <textarea
                                        className="form-input"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        readOnly={!isCustomCustomer}
                                        style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', padding: '0.75rem', background: !isCustomCustomer ? '#f8fafc' : 'white', minHeight: '80px', width: '100%', resize: 'none' }}
                                        rows={3}
                                        placeholder="Full delivery address details..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700, color: '#475569' }}>Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    name="qty"
                                    value={formData.qty}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                    style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '0.75rem', fontSize: '1.1rem', textAlign: 'center', fontWeight: 800, color: '#4f46e5' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#475569' }}>
                                    <MdShortText /> Internal Remarks
                                </label>
                                <input className="form-input" name="remarks" value={formData.remarks} onChange={handleChange}
                                    style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '0.75rem', width: '100%' }}
                                    placeholder="Optional notes..." />
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                            {initialData && onDelete && (
                                <button type="button" className="btn-danger"
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, background: '#fee2e2', color: '#ef4444', border: 'none' }}
                                    onClick={() => {
                                        if (confirm) confirm('Delete Entry?', 'Are you sure you want to delete this courier record?', () => onDelete(initialData._id));
                                        else if (window.confirm('Delete this entry?')) onDelete(initialData._id);
                                    }}>Delete Record</button>
                            )}
                            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: 'none' }}>Cancel</button>
                            <button type="submit" className="btn-primary"
                                style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                                {initialData ? 'Update Record' : 'Save Shipment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};
