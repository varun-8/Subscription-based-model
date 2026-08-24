import React from 'react';
import SearchableSelect from './SearchableSelect';
import { MdClose } from 'react-icons/md';
import './SubscriptionModals.css';

interface SubFormModalProps {
    editMode?: boolean;
    formData: any;
    setFormData: (data: any) => void;
    customers: any[];
    magazines: any[];
    memberTypes: any[];
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const SubscriptionFormModal: React.FC<SubFormModalProps> = ({
    editMode = false, formData, setFormData, customers, memberTypes, onSubmit, onClose
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

    const calculateStartDate = (end: string, planId: string) => {
        if (!end || !planId) return formData.startDate;
        const plan = memberTypes.find(t => t._id === planId);
        if (!plan) return formData.startDate;

        const date = new Date(end);
        date.setDate(date.getDate() + 1);
        date.setMonth(date.getMonth() - plan.durationInMonths);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg sub-modal-shell" onClick={e => e.stopPropagation()}>
                <div className="modal-header sub-modal-header">
                    <h3 className="modal-title sub-modal-title">
                        {editMode ? 'Edit Subscription' : 'Add Subscription'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="sub-modal-close"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label className="form-label">Select Customer</label>
                            {editMode ? (
                                <div
                                    className="form-input"
                                    style={{
                                        background: '#f8fafc',
                                        color: '#334155',
                                        display: 'flex',
                                        alignItems: 'center',
                                        minHeight: '42px'
                                    }}
                                >
                                    {customers.find(c => c._id === formData.userId)?.name || 'Selected customer'}
                                </div>
                            ) : (
                                <SearchableSelect
                                    options={customers}
                                    value={formData.userId}
                                    onChange={(val) => setFormData({ ...formData, userId: val })}
                                    placeholder="Search Name, Email or ID..."
                                    required
                                />
                            )}
                        </div>

                        {formData.userId && (() => {
                            const selectedCustomer = customers.find(c => c._id === formData.userId);
                            if (selectedCustomer) {
                                return (
                                    <div className="sub-info-card">
                                        <h4 className="sub-info-title">Selected Customer</h4>
                                        <div className="sub-info-name">{selectedCustomer.name}</div>
                                        <div className="sub-info-meta">
                                            {selectedCustomer.subscriberNo && <span style={{ marginRight: '1rem', fontFamily: 'monospace' }}>#{selectedCustomer.subscriberNo}</span>}
                                            {selectedCustomer.mobile && <span>📞 {selectedCustomer.mobile}</span>}
                                        </div>
                                        {selectedCustomer.address && (
                                            <div className="sub-info-address">
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
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate || ''}
                                    onChange={e => {
                                        const newEnd = e.target.value;
                                        const newStart = calculateStartDate(newEnd, formData.memberTypeId);
                                        setFormData({ ...formData, endDate: newEnd, startDate: newStart });
                                    }}
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
                                        style={{ color: formData.paymentMethod ? '#1e293b' : '#94a3b8', flex: 1 }}
                                    >
                                        <option value="" style={{ color: '#94a3b8' }}>Select Payment Status</option>
                                        <option value="Cash">Cash</option>
                                        <option value="GPay">GPay</option>
                                        <option value="Account Transfer">Account Transfer</option>
                                        <option value="Money Order">Money Order</option>
                                        <option value="Credit Transaction">Credit Transaction</option>
                                    </select>
                                    {(formData.paymentMethod && formData.paymentMethod.startsWith('Account Transfer')) && (
                                        <select
                                            className="form-input"
                                            value={formData.paymentMethod.includes('Account Transfer - ') ? formData.paymentMethod.replace('Account Transfer - ', '') : ''}
                                            onChange={e => {
                                                const subMode = e.target.value;
                                                setFormData({ ...formData, paymentMethod: `Account Transfer - ${subMode}` });
                                            }}
                                            required
                                            style={{ flex: 1, color: '#1e293b' }}
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="NEFT">NEFT</option>
                                            <option value="GPay - N Palaniappan">GPay - N Palaniappan</option>
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
                            <button type="submit" className="btn-submit">{editMode ? 'Save Changes' : 'Confirm'}</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default SubscriptionFormModal;
