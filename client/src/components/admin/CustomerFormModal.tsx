import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
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
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <form onSubmit={onSubmit}>
                        {/* Section: Customer Type */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>Customer Type</label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                                                flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid',
                                                borderColor: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#6366f1' : '#e2e8f0',
                                                background: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#eef2ff' : '#f8fafc',
                                                color: formData.customerType === type.id || (type.id === 'Subscription' && !formData.customerType) ? '#6366f1' : '#475569',
                                                cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                                                minWidth: '100px'
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
                            <label className="form-label" style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>Dispatch Preference</label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {[
                                    { id: 'Post', label: 'Post' },
                                    { id: 'Courier', label: 'Courier' }
                                ].map((pref) => (
                                    <div
                                        key={pref.id}
                                        onClick={() => setFormData({ ...formData, dispatchType: pref.id })}
                                        style={{
                                            flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid',
                                            borderColor: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#6366f1' : '#e2e8f0',
                                            background: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#eef2ff' : '#f8fafc',
                                            color: formData.dispatchType === pref.id || (pref.id === 'Post' && !formData.dispatchType) ? '#6366f1' : '#475569',
                                            cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                                        }}
                                    >
                                        {pref.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '2.5rem' }}></div>

                        {/* Conditional Section: Plan Selection */}
                        {!editMode && formData.customerType !== 'Advertisement' && (
                            <div style={{ marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <label className="form-label" style={{ fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '1rem' }}>Assign Membership Plan</label>
                                <select
                                    className="form-input"
                                    value={formData.memberTypeId || ''}
                                    onChange={e => setFormData({ ...formData, memberTypeId: e.target.value })}
                                    required
                                    style={{ height: '48px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                                >
                                    <option value="">-- Choose Plan --</option>
                                    {memberTypes && memberTypes.map(t => (
                                        <option key={t._id} value={t._id}>
                                            {t.name} (Prefix: {t.letter})
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: '#64748b', marginTop: '8px', display: 'block', fontWeight: 500 }}>
                                    System will generate an automated ID (e.g., {memberTypes?.[0]?.letter || 'A'}-01)
                                </small>
                            </div>
                        )}

                        {/* Section: Basic Information */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{ height: '48px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                                    placeholder="Enter client name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>Mobile No.</label>
                                <input
                                    className="form-input"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    style={{ height: '48px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                                    placeholder="Primary number"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 700 }}>WhatsApp</label>
                                <input
                                    className="form-input"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    style={{ height: '48px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        {/* Section: Address */}
                        <div style={{ background: '#fdfdfd', border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '20px', marginTop: '2.5rem' }}>
                            <label className="form-label" style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', marginBottom: '1.25rem', display: 'block' }}>Address Details</label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <input
                                    className="form-input"
                                    placeholder="Street / House No."
                                    value={formData.street}
                                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    style={{ height: '48px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                                />
                                <input
                                    className="form-input"
                                    placeholder="Landmark (Optional)"
                                    value={formData.addressLine2 || ''}
                                    onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                                    style={{ height: '48px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                <input
                                    className="form-input"
                                    placeholder="Taluk"
                                    value={formData.taluk}
                                    onChange={e => setFormData({ ...formData, taluk: e.target.value })}
                                    style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                                />
                                <div>
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
                                        style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                                    >
                                        <option value="">Select District</option>
                                        {DISTRICTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                        <option value="Other">Other...</option>
                                    </select>
                                    {useCustomDistrict && (
                                        <input
                                            className="form-input"
                                            placeholder="District Name"
                                            value={formData.district}
                                            onChange={e => setFormData({ ...formData, district: e.target.value.toUpperCase() })}
                                            style={{ marginTop: '8px', height: '40px', borderRadius: '10px', border: '1.5px solid #6366f1' }}
                                        />
                                    )}
                                </div>
                                <div>
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
                                        style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                                    >
                                        <option value="">Select State</option>
                                        {STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        <option value="Other">Other...</option>
                                    </select>
                                    {useCustomState && (
                                        <input
                                            className="form-input"
                                            placeholder="State Name"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                            style={{ marginTop: '8px', height: '40px', borderRadius: '10px', border: '1.5px solid #6366f1' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <input
                                    className="form-input"
                                    placeholder="Country"
                                    value={formData.country || 'India'}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                                />
                                <input
                                    className="form-input"
                                    placeholder="Pincode"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    required
                                    style={{ height: '44px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 2, height: '56px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '14px',
                                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.transform = 'translateY(0)' }}
                            >
                                {editMode ? 'Save Changes' : 'Register Customer'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1, height: '56px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                                    borderRadius: '14px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
                                }}
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
