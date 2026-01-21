import React, { useState } from 'react';
import {
    MdCardMembership,
    MdAddBusiness,
    MdAccessTime,
    MdCurrencyRupee,
    MdShortText,
    MdAdd,
    MdLabel,
    MdCategory,
    MdInfoOutline
} from 'react-icons/md';

interface CategoriesViewProps {
    data: any[];
    adTypes: any[];
    onAddMemberType: () => void;
    onEditMemberType: (item: any) => void;
    onAddAdType: () => void;
    onEditAdType: (item: any) => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({
    data, adTypes,
    onAddMemberType, onEditMemberType,
    onAddAdType, onEditAdType
}) => {
    const [activeTab, setActiveTab] = useState<'member' | 'ad'>('member');

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="view-header" style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="view-title" style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0
                        }}>
                            <MdCategory style={{ color: '#6366f1' }} /> Categories
                        </h1>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '1rem' }}>
                            Configure subscription plans and advertisement classifications.
                        </p>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={activeTab === 'member' ? onAddMemberType : onAddAdType}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <MdAdd size={20} />
                        {activeTab === 'member' ? 'New Plan' : 'New Ad Type'}
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '8px',
                    background: '#f1f5f9',
                    padding: '6px',
                    borderRadius: '14px',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setActiveTab('member')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'member' ? 'white' : 'transparent',
                            color: activeTab === 'member' ? '#4f46e5' : '#64748b',
                            boxShadow: activeTab === 'member' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        <MdCardMembership size={20} /> Member Types
                    </button>
                    <button
                        onClick={() => setActiveTab('ad')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'ad' ? 'white' : 'transparent',
                            color: activeTab === 'ad' ? '#4f46e5' : '#64748b',
                            boxShadow: activeTab === 'ad' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        <MdAddBusiness size={20} /> Ad Classifications
                    </button>
                </div>
            </div>

            <div className="content-container">
                {activeTab === 'member' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {data.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>📋</div>
                                <h3 style={{ color: '#1e293b', margin: 0 }}>No Membership Plans</h3>
                                <p style={{ color: '#64748b', marginTop: '8px' }}>Start by adding your first subscription type.</p>
                            </div>
                        ) : (
                            data.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => onEditMemberType(item)}
                                    className="category-card"
                                    style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                        border: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{
                                            background: '#f1f5f9',
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 800,
                                            color: '#1e293b',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                        }}>
                                            {item.letter || '?'}
                                        </div>
                                        <div style={{
                                            background: '#ecfdf5',
                                            color: '#10b981',
                                            padding: '4px 12px',
                                            borderRadius: '99px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <MdCurrencyRupee size={14} /> {item.price}
                                        </div>
                                    </div>

                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{item.name}</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                            <MdAccessTime size={18} style={{ color: '#94a3b8' }} />
                                            <span>Duration: <strong>{item.durationInMonths} Months</strong></span>
                                        </div>
                                        {item.description && (
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                                <MdShortText size={20} style={{ color: '#94a3b8', marginTop: '-1px' }} />
                                                <span style={{ lineHeight: 1.5 }}>{item.description}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{
                                        position: 'absolute',
                                        right: '-10px',
                                        bottom: '-10px',
                                        opacity: 0.03,
                                        transform: 'rotate(-15deg)'
                                    }}>
                                        <MdCardMembership size={120} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}>
                                <MdInfoOutline size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Ad Classification Schema</h3>
                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.9rem' }}>These categories define how advertisements are logged and reported.</p>
                            </div>
                        </div>

                        {adTypes.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>No ad types defined.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {adTypes.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => onEditAdType(item)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 20px',
                                            background: '#f8fafc',
                                            borderRadius: '16px',
                                            border: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                        className="ad-type-row"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <MdLabel style={{ color: '#6366f1' }} size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{item.description || 'No description provided'}</div>
                                            </div>
                                        </div>
                                        <div style={{ color: '#94a3b8' }}>
                                            <MdAdd size={20} style={{ transform: 'rotate(45deg)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .category-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    border-color: #6366f1 !important;
                }
                .ad-type-row:hover {
                    background: #f1f5f9 !important;
                    border-color: #e2e8f0 !important;
                    transform: scale(1.01);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CategoriesView;
