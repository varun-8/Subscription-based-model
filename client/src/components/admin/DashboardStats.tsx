import React from 'react';

interface StatsProps {
    stats: {
        totalSubscribers: number;
        activeSubscriptions: number;
        revenue: number;
        adRevenue?: number;
    };
    onAnalyticsClick?: () => void;
}

const DashboardStats: React.FC<StatsProps> = ({ onAnalyticsClick }) => {
    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0.5rem 0' }}>
                <h1
                    style={{
                        margin: 0,
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        // textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: onAnalyticsClick ? 'pointer' : 'default',
                        transition: 'all 0.3s ease'
                    }}
                    onClick={onAnalyticsClick}
                    onMouseEnter={(e) => {
                        if (onAnalyticsClick) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            // e.currentTarget.style.textShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (onAnalyticsClick) {
                            e.currentTarget.style.transform = 'scale(1)';
                            // e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }
                    }}
                >
                    Admin Dashboard
                </h1>
            </div>



            <div style={{
                textAlign: 'center',
                padding: '0.5rem 0',
                marginBottom: '1rem',
                marginTop: '2rem',
                color: '#1e293b',
                // textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <img
                    src="/invoice-logo.png"
                    alt="Logo"
                    style={{
                        height: '400px',
                        maxWidth: '90%',
                        marginBottom: '0.5rem',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                    }}
                />
            </div>
        </div>
    );
};

export default DashboardStats;
