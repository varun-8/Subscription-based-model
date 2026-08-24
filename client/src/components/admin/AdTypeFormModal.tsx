import React from 'react';
import { MdClose } from 'react-icons/md';

interface AdTypeFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const AdTypeFormModal: React.FC<AdTypeFormModalProps> = ({
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
                        {editMode ? 'Edit Ad Type' : 'Create New Ad Type'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="premium-close-btn premium-close-btn--dark"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label className="form-label">Ad Type Name</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Full Page, Half Page, Banner"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
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
                                    {editMode ? 'Update Type' : 'Create Type'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={onClose} style={{ marginLeft: '1rem' }}>
                                    Cancel
                                </button>
                            </div>
                            {editMode && onDelete && (
                                <button
                                    type="button"
                                    className="btn-danger"
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

export default AdTypeFormModal;
