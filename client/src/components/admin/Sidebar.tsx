import React from 'react';
import {
    MdDashboard,
    MdShoppingCart,
    MdPeople,
    MdSubscriptions,
    MdReceipt,
    MdCampaign,
    MdInventory,
    MdSettings,
    MdAssessment,
    MdStorage
} from 'react-icons/md';


interface SidebarProps {
    view: string;
    setView: (view: string) => void;
    fetchData: (view: string) => void;
    fetchSubscriptions: (status: string) => void;
}

import sidebarLogo from '../../assets/sidebar-logo.png';

const Sidebar: React.FC<SidebarProps> = ({ view, setView, fetchData, fetchSubscriptions }) => {
    return (
        <div className="admin-sidebar">
            <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: '0' }}>
                <img src={sidebarLogo} alt="Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div className="sidebar-nav">
                <button
                    className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setView('dashboard')}
                >
                    <MdDashboard size={22} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={`nav-item ${view === 'quick-order' ? 'active' : ''}`}
                    onClick={() => setView('quick-order')}
                >
                    <MdShoppingCart size={22} />
                    <span>Quick Order</span>
                </button>
                <button
                    className={`nav-item ${view === 'subscribers' ? 'active' : ''}`}
                    onClick={() => fetchData('subscribers')}
                >
                    <MdPeople size={22} />
                    <span>Customers</span>
                </button>
                <button
                    className={`nav-item ${view === 'subscriptions' ? 'active' : ''}`}
                    onClick={() => fetchSubscriptions('')}
                >
                    <MdSubscriptions size={22} />
                    <span>Subscriptions</span>
                </button>
                <button
                    className={`nav-item ${view === 'invoices' ? 'active' : ''}`}
                    onClick={() => fetchData('invoices')}
                >
                    <MdReceipt size={22} />
                    <span>Invoices</span>
                </button>

                <button
                    className={`nav-item ${view === 'advertisements' ? 'active' : ''}`}
                    onClick={() => fetchData('advertisements')}
                >
                    <MdCampaign size={22} />
                    <span>Advertisements</span>
                </button>
                <button
                    className={`nav-item ${view === 'inventory' ? 'active' : ''}`}
                    onClick={() => fetchData('inventory')}
                >
                    <MdInventory size={22} />
                    <span>Inventory</span>
                </button>


                <button
                    className={`nav-item ${view === 'member-types' ? 'active' : ''}`}
                    onClick={() => fetchData('member-types')}
                >
                    <MdSettings size={22} />
                    <span>Categories</span>
                </button>
                <button
                    className={`nav-item ${view === 'reports' ? 'active' : ''}`}
                    onClick={() => fetchData('reports')}
                >
                    <MdAssessment size={22} />
                    <span>Reports</span>
                </button>
                <button
                    className={`nav-item ${view === 'database' ? 'active' : ''}`}
                    onClick={() => setView('database')}
                >
                    <MdStorage size={22} />
                    <span>Backup & Restore</span>
                </button>
                <div style={{ flex: 1 }}></div>

            </div>


        </div>
    );
};

export default Sidebar;
