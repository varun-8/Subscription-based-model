import React, { useState } from 'react';
import { MdClose, MdPerson, MdLocationOn, MdLocalPostOffice, MdStars } from 'react-icons/md';
import { DISTRICTS, STATES } from '../../constants';

interface CustomerFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    memberTypes?: any[];
    isAdContext?: boolean;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
    editMode, formData, setFormData, onSubmit, onClose, memberTypes, isAdContext
}) => {
    const [useCustomDistrict, setUseCustomDistrict] = useState(false);
    const [useCustomState, setUseCustomState] = useState(false);

    React.useEffect(() => {
        if (formData.district && !DISTRICTS.includes(formData.district)) {
            setUseCustomDistrict(true);
        }
        if (formData.state && !STATES.includes(formData.state)) {
            setUseCustomState(true);
        }
    }, [formData.district, formData.state]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                {/* Header */}
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: '#fff',
                    padding: '1.5rem 2rem',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h3 className="modal-title" style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
                            {editMode ? 'Edit Customer' : 'Add New Customer'}
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            {editMode ? 'Update existing customer details' : 'Register a new customer to the database'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="premium-close-btn premium-close-btn--dark"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form onSubmit={onSubmit}>
                        {/* Section: Customer Type */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                <MdStars style={{ color: '#6366f1' }} /> Customer Classification
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { id: 'Subscription', label: 'Subscription' },
                                    { id: 'Advertisement', label: 'Advertisement', show: isAdContext || formData.customerType === 'Advertisement' },
                                    { id: 'Kovil', label: 'Kovil' },
                                    { id: 'Nagarathaar Sangam', label: 'Sangam' }
                                ].map((type) => (
                                    (type.show !== false) && (
                                        <div
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, customerType: type.id })}
                                            style={{
                                                padding: '0.85rem 0.5rem', borderRadius: '14px', border: '2px solid',
                                                borderColor: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#6366f1' : '#f1f5f9',
                                                background: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#f5f7ff' : '#f8fafc',
                                                color: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#4f46e5' : '#64748b',
                                                cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                                                transform: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            {type.label}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Section: Dispatch Preference */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                <MdLocalPostOffice style={{ color: '#6366f1' }} /> Delivery Preference
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {[
                                    { id: 'Post', label: 'Post (India Post)' },
                                    { id: 'Courier', label: 'Courier Service' }
                                ].map((pref) => (
                                    <div
                                        key={pref.id}
                                        onClick={() => setFormData({ ...formData, dispatchType: pref.id })}
                                        style={{
                                            flex: 1, padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid',
                                            borderColor: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#6366f1' : '#f1f5f9',
                                            background: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#f5f7ff' : '#f8fafc',
                                            color: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#4f46e5' : '#64748b',
                                            cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                                            transform: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? 'translateY(-2px)' : 'none'
                                        }}
                                    >
                                        {pref.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '1.5px', background: 'linear-gradient(to right, #f1f5f9, #e2e8f0, #f1f5f9)', marginBottom: '2.5rem' }}></div>

                        {/* Conditional Section: Plan Selection */}
                        {!editMode && formData.customerType !== 'Advertisement' && (
                            <div style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                <label className="form-label" style={{ fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '1rem', fontSize: '1rem' }}>Initial Subscription Plan</label>
                                <select
                                    className="form-input"
                                    value={formData.memberTypeId || ''}
                                    onChange={e => setFormData({ ...formData, memberTypeId: e.target.value })}
                                    required
                                    style={{ height: '52px', borderRadius: '12px', border: '1.5px solid #cbd5e1', background: 'white', fontWeight: 600 }}
                                >
                                    <option value="">-- Select Membership Level --</option>
                                    {memberTypes && memberTypes.map(t => (
                                        <option key={t._id} value={t._id}>
                                            {t.name} • {t.durationInMonths} Months • ₹{t.price}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#6366f1', background: '#eef2ff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    <MdStars size={16} />
                                    <span style={{ fontWeight: 600 }}>ID will be auto-generated based on the selected plan prefix.</span>
                                </div>
                            </div>
                        )}

                        {/* Section: Basic Information */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MdPerson style={{ color: '#6366f1' }} />
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Personal Details</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', transition: 'all 0.2s' }}
                                    placeholder="e.g. John Doe"
                                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)' }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Primary Mobile</label>
                                <input
                                    className="form-input"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                    style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', transition: 'all 0.2s' }}
                                    placeholder="+91 XXXXX XXXXX"
                                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)' }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>WhatsApp (Optional)</label>
                                <input
                                    className="form-input"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', transition: 'all 0.2s' }}
                                    placeholder="Enter if different from mobile"
                                    onFocus={(e) => { e.target.style.borderColor = '#25d366'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 211, 102, 0.1)' }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
                                />
                            </div>
                        </div>

                        {/* Section: Address */}
                        <div style={{ background: '#fcfcfd', border: '1.5px solid #eef2f6', padding: '1.75rem', borderRadius: '22px', marginTop: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MdLocationOn style={{ color: '#6366f1' }} />
                                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Mailing Address</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Street / Door No.</label>
                                    <input
                                        className="form-input"
                                        placeholder="Flat/House No., Street Name"
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        required
                                        style={{ height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Area / Landmark</label>
                                    <input
                                        className="form-input"
                                        placeholder="Near main post office, Opp. bank"
                                        value={formData.addressLine2 || ''}
                                        onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                                        style={{ height: '52px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Taluk</label>
                                    <input
                                        className="form-input"
                                        placeholder="City / Village"
                                        value={formData.taluk}
                                        onChange={e => setFormData({ ...formData, taluk: e.target.value })}
                                        required
                                        style={{ height: '50px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>District</label>
                                    <select
                                        className="form-input"
                                        value={useCustomDistrict ? 'Other' : (DISTRICTS.includes(formData.district) ? formData.district : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Other') {
                                                setUseCustomDistrict(true);
                                                setFormData({ ...formData, district: '' });
                                            } else {
                                                setUseCustomDistrict(false);
                                                setFormData({ ...formData, district: val.toUpperCase() });
                                            }
                                        }}
                                        style={{ height: '50px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 500 }}
                                    >
                                        <option value="">Select District</option>
                                        {DISTRICTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                        <option value="Other">... Other District</option>
                                    </select>
                                    {useCustomDistrict && (
                                        <input
                                            className="form-input"
                                            placeholder="Type District Name"
                                            value={formData.district}
                                            onChange={e => setFormData({ ...formData, district: e.target.value.toUpperCase() })}
                                            style={{ marginTop: '8px', height: '44px', borderRadius: '10px', border: '2px solid #6366f1', background: 'white' }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>State</label>
                                    <select
                                        className="form-input"
                                        value={useCustomState ? 'Other' : (STATES.includes(formData.state) ? formData.state : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Other') {
                                                setUseCustomState(true);
                                                setFormData({ ...formData, state: '' });
                                            } else {
                                                setUseCustomState(false);
                                                setFormData({ ...formData, state: val.toUpperCase() });
                                            }
                                        }}
                                        style={{ height: '50px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 500 }}
                                    >
                                        <option value="">Select State</option>
                                        {STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        <option value="Other">... Other State</option>
                                    </select>
                                    {useCustomState && (
                                        <input
                                            className="form-input"
                                            placeholder="Type State Name"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                            style={{ marginTop: '8px', height: '44px', borderRadius: '10px', border: '2px solid #6366f1', background: 'white' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Country</label>
                                    <input
                                        className="form-input"
                                        placeholder="Country"
                                        value={formData.country || 'India'}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        style={{ height: '50px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Pincode / Postal Code</label>
                                    <input
                                        className="form-input"
                                        placeholder="6-digit ZIP code"
                                        value={formData.pincode}
                                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                        required
                                        maxLength={6}
                                        style={{ height: '50px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3.5rem' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 2, height: '60px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    color: 'white', border: 'none', borderRadius: '16px',
                                    fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 12px 20px -5px rgba(99, 102, 241, 0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(99, 102, 241, 0.5)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(99, 102, 241, 0.4)' }}
                            >
                                <MdPerson size={22} />
                                {editMode ? 'Update Client Record' : 'Create Customer Account'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1, height: '60px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0',
                                    borderRadius: '16px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default CustomerFormModal;
