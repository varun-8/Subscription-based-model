import React from 'react';
import { MdClose } from 'react-icons/md';
import './SubscriptionModals.css';

interface RenewalModalProps {
    subscription: any;
    memberTypes: any[];
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    formData: any;
    setFormData: (data: any) => void;
}

const RenewalModal: React.FC<RenewalModalProps> = ({
    subscription, memberTypes, onSubmit, onClose, formData, setFormData
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
                        Renew Subscription
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
                        {/* Customer Information - Read Only */}
                        <div className="sub-info-card">
                            <h4 className="sub-info-title">Customer Details</h4>
                            <div className="sub-info-name">{subscription.userId?.name}</div>
                            <div className="sub-info-meta">
                                {subscription.userId?.subscriberNo && <span style={{ marginRight: '1rem', fontFamily: 'monospace' }}>#{subscription.userId.subscriberNo}</span>}
                                {subscription.userId?.mobile && <span>📞 {subscription.userId.mobile}</span>}
                            </div>
                            {subscription.userId?.address && (
                                <div className="sub-info-address">
                                    {typeof subscription.userId.address === 'object' ?
                                        `${subscription.userId.address.street || ''}, ${subscription.userId.address.district || ''}` :
                                        subscription.userId.address}
                                </div>
                            )}
                        </div>

                        {/* Current Subscription Info */}
                        <div className="sub-current-card">
                            <h4 className="sub-current-title">Current Subscription</h4>
                            <div className="sub-current-grid">
                                <div>
                                    <div className="sub-current-label">Current Plan</div>
                                    <div className="sub-current-value">{subscription.memberTypeId?.name}</div>
                                </div>
                                <div>
                                    <div className="sub-current-label">Expires On</div>
                                    <div className="sub-current-value">{new Date(subscription.endDate).toLocaleDateString('en-GB')}</div>
                                </div>
                                <div>
                                    <div className="sub-current-label">Status</div>
                                    {new Date(subscription.endDate).getTime() >= new Date().setHours(0, 0, 0, 0) ? (
                                        <div className="sub-status-ok">Active</div>
                                    ) : (
                                        <div className="sub-status-expired">Expired</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Renewal Options */}
                        <div className="sub-options-card">
                            <h4 className="sub-options-title">Renewal Options</h4>

                            <div className="sub-options-grid">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">New Membership Plan</label>
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
                                                {t.name} ({t.durationInMonths} Months) - ₹{t.price}
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

                            {/* Payment Details */}
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
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
                                        Selecting a 'Paid' option will renew the subscription and create a new invoice.
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
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">Renew Subscription</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default RenewalModal;


