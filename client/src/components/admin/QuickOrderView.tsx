import React, { useState, useEffect, useRef } from 'react';
import { DISTRICTS, STATES } from '../../constants';
import axios from 'axios';
import { MdPersonAdd, MdSubscriptions, MdCheckCircle, MdArrowForward, MdLocalPostOffice, MdLocalShipping, MdReceipt } from 'react-icons/md';
import './QuickOrderView.css';

interface QuickOrderViewProps {
    memberTypes: any[];
    onInvoiceDownload: (invoice: any) => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    handleError: (err: any, msg?: string, subErrors?: any[]) => void;
    initialStep?: number;
    initialCustomer?: any;
    subscriptionToUpdate?: any;
    onPaymentUpdateSuccess?: () => void;
}

const QuickOrderView: React.FC<QuickOrderViewProps> = ({
    memberTypes,
    onInvoiceDownload,
    showNotification,
    handleError,
    initialStep,
    initialCustomer,
    subscriptionToUpdate,
    onPaymentUpdateSuccess
}) => {
    const [step, setStep] = useState(initialStep || 1);
    const [customerForm, setCustomerForm] = useState({
        name: '', street: '', addressLine2: '', taluk: '', district: '', state: '', country: 'India', pincode: '',
        mobile: '', whatsapp: '', customerType: 'Subscription', memberTypeId: '', dispatchType: 'Post'
    });
    const [createdCustomer, setCreatedCustomer] = useState<any>(initialCustomer || null);
    const [subForm, setSubForm] = useState({ userId: '', memberTypeId: '', startDate: '', endDate: '', paymentMethod: '', referenceNo: '', tempReceiptNo: '' });
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [useCustomDistrict, setUseCustomDistrict] = useState(false);
    const [useCustomState, setUseCustomState] = useState(false);

    // Field refs for navigation
    const fieldRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        if (subscriptionToUpdate) {
            setSubForm({
                userId: subscriptionToUpdate.userId._id || subscriptionToUpdate.userId,
                memberTypeId: subscriptionToUpdate.memberTypeId._id || subscriptionToUpdate.memberTypeId,
                startDate: subscriptionToUpdate.startDate ? new Date(subscriptionToUpdate.startDate).toISOString().split('T')[0] : today,
                endDate: subscriptionToUpdate.endDate ? new Date(subscriptionToUpdate.endDate).toISOString().split('T')[0] : '',
                paymentMethod: '',
                referenceNo: subscriptionToUpdate.referenceNo || '',
                tempReceiptNo: subscriptionToUpdate.tempReceiptNo || ''
            });
            setCreatedCustomer(initialCustomer);
            setStep(2);
        } else {
            setSubForm(prev => ({
                ...prev,
                startDate: today
            }));
        }
    }, [subscriptionToUpdate, initialCustomer]);

    const calculateEndDate = (startDateStr: string, memberTypeId: string) => {
        if (!startDateStr || !memberTypeId) return '';
        const plan = memberTypes.find(t => t._id === memberTypeId);
        if (!plan) return '';
        const date = new Date(startDateStr);
        date.setMonth(date.getMonth() + plan.durationInMonths);
        return date.toISOString().split('T')[0];
    };

    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/admin/customers', customerForm, { withCredentials: true });

            // Should skip subscription step for specialized types
            if (['Kovil', 'Nagarathaar Sangam'].includes(customerForm.customerType)) {
                setCreatedCustomer(res.data);
                setStep(3);
                showNotification('Customer created successfully!', 'success');
            } else {
                setCreatedCustomer(res.data);
                setSubForm(prev => ({ ...prev, userId: res.data._id }));
                setStep(2);
                showNotification('Customer created successfully!', 'success');
            }
        } catch (err) {
            handleError(err, 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (subscriptionToUpdate) {
                const res = await axios.put(`/api/admin/subscriptions/${subscriptionToUpdate._id}/payment`, subForm, { withCredentials: true });
                showNotification('Payment updated successfully!', 'success');
                onPaymentUpdateSuccess?.();
                setInvoice(res.data.invoice);
                setStep(3);
            } else {
                const res = await axios.post('/api/admin/subscriptions', subForm, { withCredentials: true });
                setInvoice(res.data.invoice);
                setStep(3);
                showNotification('Subscription added successfully!', 'success');
            }
        } catch (err) {
            handleError(err, 'Failed to process subscription');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setCreatedCustomer(null);
        setCustomerForm({
            name: '', street: '', addressLine2: '', taluk: '', district: '', state: '', country: 'India', pincode: '',
            mobile: '', whatsapp: '', customerType: 'Subscription', memberTypeId: '', dispatchType: 'Post'
        });
        setSubForm({ userId: '', memberTypeId: '', startDate: new Date().toISOString().split('T')[0], endDate: '', paymentMethod: '', referenceNo: '', tempReceiptNo: '' });
        setInvoice(null);
    };

    const handleEnter = (e: React.KeyboardEvent, currentField: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const order = [
                'name', 'mobile', 'whatsapp',
                'customerType', 'dispatchType',
                'street', 'addressLine2',
                'taluk', 'district', 'state', 'pincode', 'country'
            ];
            const currentIndex = order.indexOf(currentField);
            if (currentIndex !== -1 && currentIndex < order.length - 1) {
                const nextField = order[currentIndex + 1];
                const el = fieldRefs.current[nextField];
                if (el) el.focus();
            } else if (currentField === 'pincode' || currentField === 'country') {
                handleCustomerSubmit(e as any);
            }
        }
    };

    return (
        <div className="quick-order-container">
            <div className="quick-order-header">
                <h1 className="quick-order-title">New Order Flow</h1>
                <p className="quick-order-subtitle">Efficiently manage new subscriptions and customers</p>
            </div>

            <div className="quick-order-content">
                {/* Stepper */}
                <div className="stepper-container">
                    <div className="stepper-progress-bg">
                        <div className="stepper-progress-fill" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                    </div>
                    {[
                        { s: 1, label: 'Customer Info', icon: <MdPersonAdd /> },
                        { s: 2, label: 'Subscription', icon: <MdSubscriptions /> },
                        { s: 3, label: 'Complete', icon: <MdCheckCircle /> }
                    ].map((item) => (
                        <div key={item.s} className={`stepper-item ${step >= item.s ? 'active' : ''} ${step > item.s ? 'completed' : ''}`}>
                            <div className="stepper-icon-box">{item.icon}</div>
                            <span className="stepper-label">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Customer Info */}
                {step === 1 && (
                    <div className="form-card">
                        <form onSubmit={handleCustomerSubmit}>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        ref={el => { fieldRefs.current['name'] = el }}
                                        onKeyDown={e => handleEnter(e, 'name')}
                                        className="form-input"
                                        value={customerForm.name}
                                        onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                        placeholder="Enter customer name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mobile</label>
                                    <input
                                        ref={el => { fieldRefs.current['mobile'] = el }}
                                        onKeyDown={e => handleEnter(e, 'mobile')}
                                        className="form-input"
                                        value={customerForm.mobile}
                                        onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                                        placeholder="Primary mobile"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">WhatsApp</label>
                                    <input
                                        ref={el => { fieldRefs.current['whatsapp'] = el }}
                                        onKeyDown={e => handleEnter(e, 'whatsapp')}
                                        className="form-input"
                                        value={customerForm.whatsapp}
                                        onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                                        placeholder="WhatsApp number"
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Customer Type</label>
                                    <div className="radio-group">
                                        {['Subscription', 'Kovil', 'Nagarathaar Sangam'].map((type, idx) => (
                                            <label key={type} className={`radio-card ${customerForm.customerType === type ? 'selected' : ''}`}>
                                                <input
                                                    ref={idx === 0 ? (el => { fieldRefs.current['customerType'] = el }) : null}
                                                    onKeyDown={e => handleEnter(e, 'customerType')}
                                                    type="radio"
                                                    checked={customerForm.customerType === type}
                                                    onChange={() => setCustomerForm({ ...customerForm, customerType: type })}
                                                />
                                                <span className="radio-card-label">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Dispatch Preference</label>
                                    <div className="radio-group">
                                        {[{ id: 'Post', label: 'Post', icon: <MdLocalPostOffice /> }, { id: 'Courier', label: 'Courier', icon: <MdLocalShipping /> }].map((pref, idx) => (
                                            <label key={pref.id} className={`radio-card ${customerForm.dispatchType === pref.id ? 'selected' : ''}`}>
                                                <input
                                                    ref={idx === 0 ? (el => { fieldRefs.current['dispatchType'] = el }) : null}
                                                    onKeyDown={e => handleEnter(e, 'dispatchType')}
                                                    type="radio"
                                                    checked={customerForm.dispatchType === pref.id}
                                                    onChange={() => setCustomerForm({ ...customerForm, dispatchType: pref.id })}
                                                />
                                                <span className="radio-card-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {pref.icon} {pref.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label">Detailed Address</label>
                                <div className="form-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                    <input
                                        ref={el => { fieldRefs.current['street'] = el }}
                                        onKeyDown={e => handleEnter(e, 'street')}
                                        className="form-input"
                                        placeholder="Street Address"
                                        value={customerForm.street}
                                        onChange={e => setCustomerForm({ ...customerForm, street: e.target.value })}
                                    />
                                    <input
                                        ref={el => { fieldRefs.current['addressLine2'] = el }}
                                        onKeyDown={e => handleEnter(e, 'addressLine2')}
                                        className="form-input"
                                        placeholder="Area / Landmark"
                                        value={customerForm.addressLine2}
                                        onChange={e => setCustomerForm({ ...customerForm, addressLine2: e.target.value })}
                                    />
                                </div>
                                <div className="form-grid-address">
                                    <input
                                        ref={el => { fieldRefs.current['taluk'] = el }}
                                        onKeyDown={e => handleEnter(e, 'taluk')}
                                        className="form-input"
                                        placeholder="Taluk"
                                        value={customerForm.taluk}
                                        onChange={e => setCustomerForm({ ...customerForm, taluk: e.target.value })}
                                    />
                                    <select
                                        ref={el => { fieldRefs.current['district'] = el }}
                                        onKeyDown={e => handleEnter(e, 'district')}
                                        className="form-input"
                                        value={useCustomDistrict ? 'Other' : customerForm.district}
                                        onChange={e => { if (e.target.value === 'Other') setUseCustomDistrict(true); else { setUseCustomDistrict(false); setCustomerForm({ ...customerForm, district: e.target.value }); } }}
                                        style={{ color: (useCustomDistrict || customerForm.district) ? '#1e293b' : '#94a3b8' }}
                                    >
                                        <option value="" style={{ color: '#94a3b8' }}>Select District</option>
                                        {DISTRICTS.map((d: string) => <option key={d} value={d}>{d}</option>)}
                                        <option value="Other">Other...</option>
                                    </select>
                                    <select
                                        ref={el => { fieldRefs.current['state'] = el }}
                                        onKeyDown={e => handleEnter(e, 'state')}
                                        className="form-input"
                                        value={useCustomState ? 'Other' : customerForm.state}
                                        onChange={e => { if (e.target.value === 'Other') setUseCustomState(true); else { setUseCustomState(false); setCustomerForm({ ...customerForm, state: e.target.value }); } }}
                                        style={{ color: (useCustomState || customerForm.state) ? '#1e293b' : '#94a3b8' }}
                                    >
                                        <option value="" style={{ color: '#94a3b8' }}>Select State</option>
                                        {STATES.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                        <option value="Other">Other...</option>
                                    </select>
                                    <input
                                        ref={el => { fieldRefs.current['pincode'] = el }}
                                        onKeyDown={e => handleEnter(e, 'pincode')}
                                        className="form-input"
                                        placeholder="Pincode"
                                        value={customerForm.pincode}
                                        onChange={e => setCustomerForm({ ...customerForm, pincode: e.target.value })}
                                        required
                                    />
                                    <input
                                        ref={el => { fieldRefs.current['country'] = el }}
                                        onKeyDown={e => handleEnter(e, 'country')}
                                        className="form-input"
                                        placeholder="Country"
                                        value={customerForm.country}
                                        onChange={e => setCustomerForm({ ...customerForm, country: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="submit-btn">
                                {loading ? 'Processing...' : 'Proceed to Subscription'} <MdArrowForward size={24} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Subscription */}
                {step === 2 && createdCustomer && (
                    <div className="form-card">
                        <form onSubmit={handleSubSubmit}>
                            <div className="form-group" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '2rem', borderRadius: '20px', marginBottom: '2.5rem', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Subscription for: <span style={{ color: '#6366f1' }}>{createdCustomer.name}</span></h3>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Subscriber ID: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#1e293b' }}>{createdCustomer.subscriberNo}</code></p>
                                </div>
                                <div style={{ background: '#6366f1', padding: '0.75rem 1.5rem', borderRadius: '12px', color: 'white', fontWeight: 700, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                                    {subscriptionToUpdate ? 'UPDATING' : 'NEW ORDER'}
                                </div>
                            </div>

                            {!subscriptionToUpdate && (
                                <div className="form-grid-3">
                                    <div className="form-group">
                                        <label className="form-label">Membership Plan</label>
                                        <select
                                            className="form-input"
                                            value={subForm.memberTypeId}
                                            onChange={e => setSubForm(p => ({ ...p, memberTypeId: e.target.value, endDate: calculateEndDate(p.startDate, e.target.value) }))}
                                            required
                                            style={{ color: subForm.memberTypeId ? '#1e293b' : '#94a3b8' }}
                                        >
                                            <option value="" style={{ color: '#94a3b8' }}>Select Plan</option>
                                            {memberTypes.map(t => <option key={t._id} value={t._id}>{t.name} (₹{t.price})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={subForm.startDate}
                                            onChange={e => setSubForm(p => ({ ...p, startDate: e.target.value, endDate: calculateEndDate(e.target.value, p.memberTypeId) }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date (Auto)</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={subForm.endDate}
                                            readOnly
                                            style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select
                                        className="form-input"
                                        value={subForm.paymentMethod}
                                        onChange={e => setSubForm(p => ({ ...p, paymentMethod: e.target.value }))}
                                        required
                                        style={{ color: subForm.paymentMethod ? '#1e293b' : '#94a3b8' }}
                                    >
                                        <option value="" style={{ color: '#94a3b8' }}>Select Mode</option>
                                        <option value="Cash">Cash / Direct</option>
                                        <option value="GPay">GPay / UPI</option>
                                        <option value="Transfer">Bank Transfer</option>
                                        <option value="Credit">Credit Transaction</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="form-label">Ref #</label>
                                        <input
                                            className="form-input"
                                            value={subForm.referenceNo}
                                            onChange={e => setSubForm(p => ({ ...p, referenceNo: e.target.value }))}
                                            placeholder="UTR / ID"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Receipt #</label>
                                        <input
                                            className="form-input"
                                            value={subForm.tempReceiptNo}
                                            onChange={e => setSubForm(p => ({ ...p, tempReceiptNo: e.target.value }))}
                                            placeholder="Book No"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="submit-btn" style={{ background: '#10b981', marginTop: '3rem', height: '56px' }}>
                                {loading ? 'Processing...' : 'Generate Invoice & Finish'} <MdCheckCircle size={24} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <div className="form-card success-container">
                        <div className="success-icon-wrapper">
                            <MdCheckCircle size={56} />
                        </div>

                        {invoice ? (
                            <>
                                <h2 className="success-title">Success!</h2>
                                <p className="success-text">Order processed for <b>{createdCustomer?.name}</b></p>
                            </>
                        ) : (
                            <>
                                <h2 className="success-title">Customer Added!</h2>
                                <p className="success-text">
                                    <b>{createdCustomer?.name}</b> ({createdCustomer?.customerType}) has been added successfully.<br />
                                    Subscriber ID: <b style={{ color: '#6366f1' }}>{createdCustomer?.subscriberNo}</b>
                                </p>
                            </>
                        )}

                        <div className="action-buttons">
                            {invoice && (
                                <button onClick={() => onInvoiceDownload(invoice)} className="submit-btn" style={{ width: 'auto', background: '#6366f1', padding: '0.8rem 2rem' }}>
                                    Download Invoice <MdReceipt />
                                </button>
                            )}
                            <button onClick={resetFlow} className="btn-secondary">
                                New Order
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickOrderView;
