import React from 'react';
import '../../admin.css'; // Ensure we have access to the spinner CSS

const LoadingSpinner: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.7)', // Light, glassy background
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div className="aesthetic-spinner"></div>
            <p style={{
                marginTop: '1.5rem',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '1rem',
                letterSpacing: '0.05em',
                animation: 'pulse 2s infinite'
            }}>
                PROCESSING...
            </p>
        </div>
    );
};

export default LoadingSpinner;
