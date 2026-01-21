import React from 'react';
import '../../admin.css';

interface OrderSuccessModalProps {
    customerName: string;
    invoice: any;
    onDownload: (invoice: any) => void;
    onClose: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ customerName, invoice, onDownload, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px', padding: '30px' }}>
                <div style={{ fontSize: '48px', color: '#2ea44f', marginBottom: '15px' }}>✓</div>
                <h3 className="modal-title" style={{ justifyContent: 'center', marginBottom: '10px' }}>Success!</h3>
                <p style={{ color: '#64748b', marginBottom: '25px', lineHeight: '1.5' }}>
                    Subscription for <strong>{customerName}</strong> has been successfully processed.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    {invoice ? (
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => onDownload(invoice)}
                        >
                            Download Invoice
                        </button>
                    ) : (
                        <div style={{ color: '#8b949e', fontSize: '0.9rem' }}>No invoice generated.</div>
                    )}

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            marginTop: '10px',
                            textDecoration: 'underline'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
