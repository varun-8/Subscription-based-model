import React from 'react';
import { MdErrorOutline } from 'react-icons/md';

interface ErrorModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onClose: () => void;
    subErrors?: { user: string; message: string }[];
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, title = 'Error', message, onClose, subErrors }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div className="modal-content" style={{
                background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '2rem',
                maxWidth: '450px', width: '90%', textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    width: '64px', height: '64px', background: 'rgba(218, 54, 51, 0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto', color: '#da3633'
                }}>
                    <MdErrorOutline size={40} />
                </div>

                <h3 style={{ margin: '0 0 0.75rem 0', color: '#f0f6fc', fontSize: '1.5rem', fontWeight: 600 }}>{title}</h3>
                <p style={{ margin: '0 0 1.5rem 0', color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.6' }}>
                    {message}
                </p>

                {subErrors && subErrors.length > 0 && (
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        background: 'rgba(218, 54, 51, 0.05)',
                        border: '1px solid rgba(218, 54, 51, 0.2)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left'
                    }}>
                        {subErrors.map((err, idx) => (
                            <div key={idx} style={{ padding: '0.5rem 0', borderBottom: idx === subErrors.length - 1 ? 'none' : '1px solid rgba(218, 54, 51, 0.1)', color: '#f85149', fontSize: '0.9rem' }}>
                                <strong style={{ color: '#f0f6fc' }}>{err.user}:</strong> {err.message}
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        background: '#da3633',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f85149'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#da3633'}
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

export default ErrorModal;
