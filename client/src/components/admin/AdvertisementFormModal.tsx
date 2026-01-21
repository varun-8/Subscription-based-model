import React, { useState, useEffect } from 'react';
import { DISTRICTS, STATES } from '../../constants';
import axios from 'axios';
import SearchableSelect from './SearchableSelect';
import { MdClose } from 'react-icons/md';

interface AdvertisementFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onSaveSuccess?: () => void;
    customers?: any[];
    onDownloadInvoice?: (invoice: any) => void;
    adTypes?: any[];
    showNotification?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AdvertisementFormModal: React.FC<AdvertisementFormModalProps> = ({
    editMode, formData, setFormData, onSubmit, onClose, onSaveSuccess, customers = [], onDownloadInvoice, adTypes = [], showNotification
}) => {
    // Local state for the "Quick Order" style flow
    const [mode, setMode] = useState<'new' | 'existing'>(editMode ? 'existing' : 'new');
    const [success, setSuccess] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [useCustomDistrict, setUseCustomDistrict] = useState(false);
    const [useCustomState, setUseCustomState] = useState(false);

    // Handle Enter key navigation
    const handleKeyDown = (e: React.KeyboardEvent, currentFieldId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Define field order based on current mode
            const newCustomerFields = [
                'ad_name', 'ad_mobile', 'ad_whatsapp', 'street', 'addressLine2', 'taluk',
                'district', 'state', 'pincode', 'country', 'adName'
            ];

            const existingCustomerFields = [
                'clientName', 'adName'
            ];

            const fieldOrder = mode === 'new' ? newCustomerFields : existingCustomerFields;
            const currentIndex = fieldOrder.indexOf(currentFieldId);

            if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
                const nextFieldId = fieldOrder[currentIndex + 1];
                const nextElement = document.getElementById(nextFieldId);
                if (nextElement) {
                    nextElement.focus();
                }
            }
        }
    };

    // Local form states for creation
    const [custForm, setCustForm] = useState({
        name: '', street: '', addressLine2: '', taluk: '', district: '', state: '', country: 'India', pincode: '',
        mobile: '', whatsapp: '', customerType: 'Advertisement'
    });

    useEffect(() => {
        if (custForm.state && !STATES.includes(custForm.state)) {
            setUseCustomState(true);
        }
    }, [custForm.state]);

    // We'll sync this with the parent's formData for the Ad part
    const [adDate, setAdDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (formData.startDate) {
            setAdDate(formData.startDate.split('T')[0]);
        }
    }, [formData.startDate]);

    const [selectedTypes, setSelectedTypes] = useState<string[]>(formData.types || []);

    // Custom Type Logic
    const standardTypes = ['Black & White', 'Colour', 'Front', 'Back', 'Half Page', 'Full Page'];

    const initialCustomType = (formData.types || []).find((t: string) => !standardTypes.includes(t)) || '';
    const [customType, setCustomType] = useState(initialCustomType);
    const [isCustomTypeActive, setIsCustomTypeActive] = useState(!!initialCustomType);

    const handleAdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const toggleType = (typeName: string) => {
        let newTypes;
        if (selectedTypes.includes(typeName)) {
            newTypes = selectedTypes.filter(t => t !== typeName);
        } else {
            newTypes = [...selectedTypes, typeName];
        }
        setSelectedTypes(newTypes);
        setFormData({ ...formData, types: newTypes });
    };

    const handleCustChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustForm({ ...custForm, [name]: value });
    };

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editMode) {
                await onSubmit(e);
                return;
            }

            // --- CREATE FLOW ---
            let userId = '';
            let clientName = '';

            if (mode === 'new') {
                const custRes = await axios.post('/api/admin/customers', {
                    ...custForm,
                    customerType: 'Advertisement'
                }, { withCredentials: true });
                userId = custRes.data._id;
                clientName = custRes.data.name;
            } else {
                const selectedCust = customers.find(c => c.name === formData.clientName);
                if (!selectedCust) {
                    if (showNotification) showNotification("Please select a valid customer", "warning");
                    else alert("Please select a valid customer");
                    setLoading(false);
                    return;
                }
                userId = selectedCust._id;
                clientName = selectedCust.name;
            }

            const adPayload = {
                ...formData,
                userId,
                clientName,
                startDate: adDate,
                endDate: adDate,
                types: selectedTypes
            };

            const res = await axios.post('/api/admin/advertisements', adPayload, { withCredentials: true });

            if (res.data.invoice) {
                setCreatedInvoice(res.data.invoice);
            }

            setSuccess(true);
            if (onSaveSuccess) onSaveSuccess();

        } catch (err: any) {
            if (showNotification) showNotification(err.response?.data?.message || 'Operation failed', "error");
            else alert(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, startDate: adDate, endDate: adDate, types: selectedTypes };
        setFormData(finalData);
        setTimeout(() => onSubmit(e), 0);
    };

    if (success) {
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', color: '#2ea44f', marginBottom: '20px' }}>✓</div>
                    <h3>Advertisement Created!</h3>
                    <p style={{ color: '#64748b', marginBottom: '30px' }}>
                        The advertisement and invoice have been generated successfully.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        {createdInvoice && (
                            <button className="btn btn-primary" onClick={() => {
                                if (onDownloadInvoice) {
                                    onDownloadInvoice(createdInvoice);
                                }
                            }}>
                                Download Invoice
                            </button>
                        )}
                        <button className="btn btn-outline" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
                {/* Header */}
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff',
                    padding: '1.25rem 1.5rem',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 className="modal-title" style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{editMode ? 'Edit Advertisement' : 'New Advertisement'}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        <MdClose size={18} />
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={editMode ? handleEditSubmit : handleInternalSubmit}>

                        {!editMode ? (
                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', width: 'fit-content', marginBottom: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMode('new')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 20px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: mode === 'new' ? '#ffffff' : 'transparent',
                                            color: mode === 'new' ? '#0f172a' : '#64748b',
                                            boxShadow: mode === 'new' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        New Customer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('existing')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 20px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: mode === 'existing' ? '#ffffff' : 'transparent',
                                            color: mode === 'existing' ? '#0f172a' : '#64748b',
                                            boxShadow: mode === 'existing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Existing Customer
                                    </button>
                                </div>

                                {mode === 'new' ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className="form-group">
                                                <label className="form-label">Customer Name</label>
                                                <input
                                                    id="ad_name"
                                                    className="form-input"
                                                    name="name"
                                                    value={custForm.name}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'ad_name')}
                                                    required
                                                    placeholder="Name"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Mobile</label>
                                                <input
                                                    id="ad_mobile"
                                                    className="form-input"
                                                    name="mobile"
                                                    value={custForm.mobile}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'ad_mobile')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Whatsapp</label>
                                                <input
                                                    id="ad_whatsapp"
                                                    className="form-input"
                                                    name="whatsapp"
                                                    value={custForm.whatsapp}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'ad_whatsapp')}
                                                />
                                            </div>
                                        </div>


                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <input
                                                    id="street"
                                                    className="form-input"
                                                    name="street"
                                                    value={custForm.street}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'street')}
                                                    placeholder="Street / Door No"
                                                />
                                                <input
                                                    id="addressLine2"
                                                    className="form-input"
                                                    name="addressLine2"
                                                    value={custForm.addressLine2}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'addressLine2')}
                                                    placeholder="Address Line 2 (Optional)"
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                                <input
                                                    id="taluk"
                                                    className="form-input"
                                                    name="taluk"
                                                    value={custForm.taluk}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'taluk')}
                                                    placeholder="Taluk"
                                                />
                                                <select
                                                    id="district"
                                                    className="form-input"
                                                    value={useCustomDistrict ? 'Other' : (DISTRICTS.includes(custForm.district) ? custForm.district : '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other') {
                                                            setUseCustomDistrict(true);
                                                            setCustForm({ ...custForm, district: '' });
                                                        } else {
                                                            setUseCustomDistrict(false);
                                                            setCustForm({ ...custForm, district: val.toUpperCase() });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => handleKeyDown(e, 'district')}
                                                >
                                                    <option value="">Select District</option>
                                                    {DISTRICTS.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                    <option value="Other">Other...</option>
                                                </select>
                                                <select
                                                    id="state"
                                                    className="form-input"
                                                    value={useCustomState ? 'Other' : (STATES.includes(custForm.state) ? custForm.state : '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other') {
                                                            setUseCustomState(true);
                                                            setCustForm({ ...custForm, state: '' });
                                                        } else {
                                                            setUseCustomState(false);
                                                            setCustForm({ ...custForm, state: val.toUpperCase() });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => handleKeyDown(e, 'state')}
                                                >
                                                    <option value="">Select State</option>
                                                    {STATES.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                    <option value="Other">Other...</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <input
                                                    id="pincode"
                                                    className="form-input"
                                                    name="pincode"
                                                    value={custForm.pincode}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'pincode')}
                                                    placeholder="Pincode"
                                                    required
                                                />
                                                <input
                                                    id="country"
                                                    className="form-input"
                                                    name="country"
                                                    value={custForm.country}
                                                    onChange={handleCustChange}
                                                    onKeyDown={(e) => handleKeyDown(e, 'country')}
                                                    placeholder="Country"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Select Customer</label>
                                        <div id="clientName">
                                            <SearchableSelect
                                                options={customers}
                                                value={formData.clientName}
                                                onChange={(val) => setFormData({ ...formData, clientName: val })}
                                                placeholder="Search Advertiser..."
                                                valueKey="name"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label">Customer</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.clientName || ''}
                                    disabled
                                    style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Advertisement Name</label>
                            <input
                                id="adName"
                                type="text"
                                className="form-input"
                                name="adName"
                                value={formData.adName}
                                onChange={handleAdChange}
                                onKeyDown={(e) => handleKeyDown(e, 'adName')}
                                required
                                placeholder="e.g. Summer Campaign"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#1e293b' }}>Ad Type</label>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                marginTop: '0.25rem'
                            }}>
                                {(adTypes || []).map((t: any) => {
                                    const isSelected = selectedTypes.includes(t.name);
                                    return (
                                        <div
                                            key={t._id}
                                            onClick={() => toggleType(t.name)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                border: isSelected ? '1px solid #e11d48' : '1px solid #cbd5e1',
                                                background: isSelected ? '#fff1f2' : '#ffffff',
                                                color: isSelected ? '#be123c' : '#475569',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: isSelected ? 600 : 400,
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                boxShadow: isSelected ? '0 2px 4px rgba(225, 29, 72, 0.1)' : 'none'
                                            }}
                                        >
                                            <span style={{ userSelect: 'none' }}>{t.name}</span>
                                            {isSelected && <span style={{ fontSize: '1.2em', lineHeight: 0.5 }}>✓</span>}
                                        </div>
                                    );
                                })}
                                <div
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: isCustomTypeActive ? '1px solid #e11d48' : '1px solid #cbd5e1',
                                        background: isCustomTypeActive ? '#fff1f2' : '#ffffff',
                                        color: isCustomTypeActive ? '#be123c' : '#475569',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={isCustomTypeActive}
                                            onChange={(e) => {
                                                const active = e.target.checked;
                                                setIsCustomTypeActive(active);
                                                if (!active) {
                                                    const newTypes = selectedTypes.filter(t => t !== customType);
                                                    setSelectedTypes(newTypes);
                                                    setFormData({ ...formData, types: newTypes });
                                                } else if (customType) {
                                                    const newTypes = [...selectedTypes, customType];
                                                    setSelectedTypes(newTypes);
                                                    setFormData({ ...formData, types: newTypes });
                                                }
                                            }}
                                            style={{ accentColor: '#e11d48', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', fontWeight: isCustomTypeActive ? 600 : 400, userSelect: 'none' }}>Other...</span>
                                    </label>
                                </div>
                            </div>

                            {isCustomTypeActive && (
                                <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter custom ad type"
                                        value={customType}
                                        onChange={(e) => {
                                            const oldVal = customType;
                                            const newVal = e.target.value;
                                            setCustomType(newVal);

                                            let updatedTypes = selectedTypes.filter(t => t !== oldVal);
                                            if (newVal) {
                                                updatedTypes = [...updatedTypes, newVal];
                                            }
                                            setSelectedTypes(updatedTypes);
                                            setFormData({ ...formData, types: updatedTypes });
                                        }}
                                        autoFocus
                                        style={{ borderColor: '#e11d48', boxShadow: '0 0 0 1px rgba(225, 29, 72, 0.1)' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Page Size</label>
                                <select
                                    className="form-input"
                                    value={['Full', 'Half', 'Quarter'].includes(formData.pageSize) ? formData.pageSize : (formData.pageSize ? 'Other' : '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Other') {
                                            setFormData({ ...formData, pageSize: '' });
                                        } else {
                                            setFormData({ ...formData, pageSize: val });
                                        }
                                    }}
                                    style={{ height: '45px' }}
                                >
                                    <option value="">Select Size</option>
                                    <option value="Full">Full Page</option>
                                    <option value="Half">Half Page</option>
                                    <option value="Quarter">Quarter Page</option>
                                    <option value="Other">Other (Custom)...</option>
                                </select>
                                {!['Full', 'Half', 'Quarter'].includes(formData.pageSize) && formData.pageSize !== undefined && (
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter custom size"
                                        value={formData.pageSize || ''}
                                        onChange={(e) => setFormData({ ...formData, pageSize: e.target.value })}
                                        style={{ marginTop: '0.8rem' }}
                                    />
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    name="qty"
                                    value={formData.qty || 1}
                                    onChange={handleAdChange}
                                    min="1"
                                    required
                                    style={{ height: '45px' }}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1rem' }}>Payment Details</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Price (Rs.)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>₹</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleAdChange}
                                            required
                                            style={{ paddingLeft: '2rem', height: '45px', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={adDate}
                                        onChange={(e) => setAdDate(e.target.value)}
                                        required
                                        style={{ height: '45px' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Payment Method</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="form-input"
                                        name="paymentMethod"
                                        value={formData.paymentMethod && formData.paymentMethod.startsWith('Account Transfer') ? 'Account Transfer' : (formData.paymentMethod || '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, paymentMethod: val });
                                        }}
                                        required
                                        style={{ height: '45px' }}
                                    >
                                        <option value="">Select Payment Method</option>
                                        <option value="Cash">Cash</option>
                                        <option value="GPay">GPay</option>
                                        <option value="Account Transfer">Account Transfer</option>
                                        <option value="Credit Transaction">Credit Transaction</option>
                                        <option value="Money Order">Money Order</option>
                                    </select>
                                    {(formData.paymentMethod && formData.paymentMethod.startsWith('Account Transfer')) && (
                                        <select
                                            className="form-input"
                                            value={formData.paymentMethod.includes('-') ? formData.paymentMethod.split(' - ')[1] : ''}
                                            onChange={(e) => {
                                                const subMode = e.target.value;
                                                setFormData({ ...formData, paymentMethod: `Account Transfer - ${subMode}` });
                                            }}
                                            required
                                            style={{ height: '45px' }}
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="DD">DD</option>
                                            <option value="NEFT">NEFT</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Reference No</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="referenceNo"
                                    value={formData.referenceNo || ''}
                                    onChange={handleAdChange}
                                    placeholder="Optional"
                                    style={{ height: '45px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temp Receipt No</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="tempReceiptNo"
                                    value={formData.tempReceiptNo || ''}
                                    onChange={handleAdChange}
                                    placeholder="Optional"
                                    style={{ height: '45px' }}
                                />
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '2rem', padding: '1rem 0 0', borderTop: '1px solid #f1f5f9' }}>
                            <button type="button" className="btn-cancel" onClick={onClose} style={{ padding: '0.8rem' }}>Cancel</button>
                            <button type="submit" className="btn-submit" disabled={loading} style={{
                                flex: 2,
                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: loading ? 'wait' : 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {loading ? 'Processing...' : (editMode ? 'Update Advertisement' : 'Create Order')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdvertisementFormModal;
