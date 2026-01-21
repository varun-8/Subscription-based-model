import React from 'react';
import SearchableSelect from './SearchableSelect';
import { MdClose } from 'react-icons/md';

interface SubFormModalProps {
    formData: any;
    setFormData: (data: any) => void;
    customers: any[];
    magazines: any[];
    memberTypes: any[];
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const SubscriptionFormModal: React.FC<SubFormModalProps> = ({
    formData, setFormData, customers, memberTypes, onSubmit, onClose
}) => {

    const calculateEndDate = (start: string, planId: string) => {
        if (!start || !planId) return formData.endDate;
        const plan = memberTypes.find(t => t._id === planId);
        if (!plan) return formData.endDate;

        const date = new Date(start);
        date.setMonth(date.getMonth() + plan.durationInMonths);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff',
                    padding: '1.25rem 1.5rem',
                    borderBottom: 'none',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 className="modal-title" style={{ color: '#fff', fontWeight: 600, margin: 0 }}>
                        Add Subscription
                    </h3>
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
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label className="form-label">Select Customer</label>
                            <SearchableSelect
                                options={customers}
                                value={formData.userId}
                                onChange={(val) => setFormData({ ...formData, userId: val })}
                                placeholder="Search Name, Email or ID..."
                                required
                            />
                        </div>

                        {formData.userId && (() => {
                            const selectedCustomer = customers.find(c => c._id === formData.userId);
                            if (selectedCustomer) {
                                return (
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Selected Customer</h4>
                                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{selectedCustomer.name}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '0.25rem' }}>
                                            {selectedCustomer.subscriberNo && <span style={{ marginRight: '1rem', fontFamily: 'monospace' }}>#{selectedCustomer.subscriberNo}</span>}
                                            {selectedCustomer.mobile && <span>📞 {selectedCustomer.mobile}</span>}
                                        </div>
                                        {selectedCustomer.address && (
                                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                {typeof selectedCustomer.address === 'object' ?
                                                    `${selectedCustomer.address.street || ''}, ${selectedCustomer.address.district || ''}` :
                                                    selectedCustomer.address}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })()}



                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Membership Plan</label>
                                <select
                                    className="form-input"
                                    value={formData.memberTypeId}
                                    onChange={e => {
                                        const newPlanId = e.target.value;
                                        const newEnd = calculateEndDate(formData.startDate, newPlanId);
                                        setFormData({ ...formData, memberTypeId: newPlanId, endDate: newEnd });
                                    }}
                                    required
                                >
                                    <option value="">Select Plan</option>
                                    {memberTypes && memberTypes.map(t => (
                                        <option key={t._id} value={t._id}>
                                            {t.name} ({t.durationInMonths} Months)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.startDate || ''}
                                    onChange={e => {
                                        const newStart = e.target.value;
                                        const newEnd = calculateEndDate(newStart, formData.memberTypeId);
                                        setFormData({ ...formData, startDate: newStart, endDate: newEnd });
                                    }}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">End Date (Auto)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate || ''}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Payment Status</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="form-input"
                                        value={formData.paymentMethod && formData.paymentMethod.startsWith('Account Transfer') ? 'Account Transfer' : (formData.paymentMethod || '')}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, paymentMethod: val });
                                        }}
                                        required
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Select Payment Status</option>
                                        <option value="Cash">Paid - Cash</option>
                                        <option value="GPay">Paid - GPay</option>
                                        <option value="Account Transfer">Paid - Account Transfer</option>
                                        <option value="Credit Transaction">Credit Transaction</option>
                                        <option value="Money Order">Paid - Money Order</option>
                                    </select>
                                    {(formData.paymentMethod && formData.paymentMethod.startsWith('Account Transfer')) && (
                                        <select
                                            className="form-input"
                                            value={formData.paymentMethod.includes('-') ? formData.paymentMethod.split(' - ')[1] : ''}
                                            onChange={e => {
                                                const subMode = e.target.value;
                                                setFormData({ ...formData, paymentMethod: `Account Transfer - ${subMode}` });
                                            }}
                                            required
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="NEFT">NEFT</option>
                                        </select>
                                    )}
                                </div>
                                <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>
                                    Selecting a 'Paid' option will activate the subscription and mark invoice as Paid.
                                </small>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Reference No (Optional)</label>
                                    <input
                                        className="form-input"
                                        value={formData.referenceNo || ''}
                                        onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                                        placeholder="e.g. PO-12345"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Temp Receipt No (Optional)</label>
                                    <input
                                        className="form-input"
                                        value={formData.tempReceiptNo || ''}
                                        onChange={e => setFormData({ ...formData, tempReceiptNo: e.target.value })}
                                        placeholder="e.g. TR-987"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">Confirm</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default SubscriptionFormModal;
