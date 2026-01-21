import React, { useEffect } from 'react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#238636';
            case 'error':
                return '#da3633';
            case 'warning':
                return '#d29922';
            default:
                return '#1f6feb';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: getBackgroundColor(),
                color: '#fff',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minWidth: '300px',
                maxWidth: '500px',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                ×
            </button>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Notification;
