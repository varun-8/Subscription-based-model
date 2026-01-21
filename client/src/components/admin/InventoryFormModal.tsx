import React, { useEffect, useState } from 'react';

interface InventoryFormModalProps {
    editMode: boolean;
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const InventoryFormModal: React.FC<InventoryFormModalProps> = ({ editMode, formData, setFormData, onSubmit, onClose }) => {

    // Ensure controlled inputs
    const [localData, setLocalData] = useState({
        itemName: '',
        category: '',
        quantity: 0,
        unitPrice: 0,
        supplier: '',
        description: ''
    });

    useEffect(() => {
        if (formData) {
            setLocalData({
                itemName: formData.itemName || '',
                category: formData.category || '',
                quantity: formData.quantity || 0,
                unitPrice: formData.unitPrice || 0,
                supplier: formData.supplier || '',
                description: formData.description || ''
            });
        }
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalData({ ...localData, [name]: value });
        setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{editMode ? 'Edit Item' : 'New Inventory Item'}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label className="form-label">Item Name</label>
                            <input
                                className="form-input"
                                name="itemName"
                                value={localData.itemName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input
                                    className="form-input"
                                    name="category"
                                    value={localData.category}
                                    onChange={handleChange}
                                    placeholder="e.g. Paper, Ink"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <input
                                    className="form-input"
                                    name="supplier"
                                    value={localData.supplier}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    name="quantity"
                                    value={localData.quantity}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit Price (₹)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    name="unitPrice"
                                    value={localData.unitPrice}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                name="description"
                                value={localData.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-submit">
                                {editMode ? 'Update Item' : 'Add Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InventoryFormModal;
