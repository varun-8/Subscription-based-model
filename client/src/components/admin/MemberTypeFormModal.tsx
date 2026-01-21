import React from 'react';
import { MdClose } from 'react-icons/md';

interface MemberTypeFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const MemberTypeFormModal: React.FC<MemberTypeFormModalProps> = ({
    editMode, formData, setFormData, onSubmit, onClose, onDelete
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#fff',
                    padding: '1.25rem 1.5rem',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 className="modal-title" style={{ color: '#fff', fontWeight: 600, margin: 0 }}>
                        {editMode ? 'Edit Plan' : 'Create New Plan'}
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
                            <label className="form-label">Plan Name</label>
                            <input
                                className="form-input"
                                placeholder="e.g. 1 Year, 6 Months"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Duration (Months)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.durationInMonths}
                                    onChange={e => setFormData({ ...formData, durationInMonths: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Letter</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.letter}
                                    onChange={e => setFormData({ ...formData, letter: e.target.value.toUpperCase() })}
                                    required
                                    maxLength={1}
                                    placeholder="A"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-actions" style={{ justifyContent: 'space-between', display: 'flex' }}>
                            <div>
                                <button type="submit" className="btn-submit">
                                    {editMode ? 'Update Plan' : 'Create Plan'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={onClose} style={{ marginLeft: '1rem' }}>
                                    Cancel
                                </button>
                            </div>
                            {editMode && onDelete && (
                                <button
                                    type="button"
                                    className="btn-danger" // Just use the class directly, styles are likely global or imported
                                    onClick={onDelete}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MemberTypeFormModal;
