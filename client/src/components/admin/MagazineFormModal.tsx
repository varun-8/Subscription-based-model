import React from 'react';
import { MdClose } from 'react-icons/md';

interface MagazineFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const MagazineFormModal: React.FC<MagazineFormModalProps> = ({
    editMode, formData, setFormData, onSubmit, onClose
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{editMode ? 'Edit Magazine' : 'Add New Magazine'}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: '#1e293b', border: 'none', borderRadius: '12px',
                            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 100, color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'all 0.2s'
                        }}
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                className="form-input"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (Monthly)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Periodicity</label>
                            <select
                                className="form-input"
                                value={formData.periodicity}
                                onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cover Image URL</label>
                            <input
                                className="form-input"
                                value={formData.coverImage}
                                onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">
                                {editMode ? 'Update Magazine' : 'Create Magazine'}
                            </button>
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MagazineFormModal;
