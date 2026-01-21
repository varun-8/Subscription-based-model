import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    description?: string;
    onConfirm: () => void;
    onClose: () => void;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    message,
    description,
    onConfirm,
    onClose,
    title = 'Confirm Action',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            backdropFilter: 'blur(3px)'
        }} onClick={onClose}>
            <div className="modal-content" style={{
                background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '1.5rem',
                maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f0f6fc', fontSize: '1.25rem' }}>{title}</h3>
                <p style={{ margin: '0 0 1.5rem 0', color: '#8b949e', fontSize: '1rem', lineHeight: '1.5' }}>
                    {message}
                    {description && <><br /><small style={{ marginTop: '0.5rem', display: 'block' }}>{description}</small></>}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: '1px solid #30363d',
                        color: '#c9d1d9',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} style={{
                        background: isDangerous ? '#da3633' : '#238636',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                    }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
