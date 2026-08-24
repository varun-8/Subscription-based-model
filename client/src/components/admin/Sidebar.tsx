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
    MdStorage,
    MdChevronLeft,
    MdChevronRight
} from 'react-icons/md';


interface SidebarProps {
    view: string;
    setView: (view: string) => void;
    fetchData: (view: string) => void;
    fetchSubscriptions: (status: string) => void;
    onLogout?: () => void; // Made optional or could be removed
}

import sidebarLogo from '../../assets/sidebar-logo.png';

const Sidebar: React.FC<SidebarProps> = ({ view, setView, fetchData, fetchSubscriptions }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                {!isCollapsed ? (
                    <img src={sidebarLogo} alt="Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'contain' }} />
                ) : (
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', padding: '10px' }}>AV</div>
                )}
            </div>

            <button className="collapse-toggle" onClick={toggleCollapse} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                {isCollapsed ? <MdChevronRight size={24} /> : <MdChevronLeft size={24} />}
            </button>

            <div className="sidebar-nav">
                <button
                    className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setView('dashboard')}
                    title="Dashboard"
                >
                    <MdDashboard size={22} />
                    {!isCollapsed && <span>Dashboard</span>}
                </button>
                <button
                    className={`nav-item ${view === 'quick-order' ? 'active' : ''}`}
                    onClick={() => setView('quick-order')}
                    title="Quick Order"
                >
                    <MdShoppingCart size={22} />
                    {!isCollapsed && <span>Quick Order</span>}
                </button>
                <button
                    className={`nav-item ${view === 'subscribers' ? 'active' : ''}`}
                    onClick={() => fetchData('subscribers')}
                    title="Customers"
                >
                    <MdPeople size={22} />
                    {!isCollapsed && <span>Customers</span>}
                </button>
                <button
                    className={`nav-item ${view === 'subscriptions' ? 'active' : ''}`}
                    onClick={() => fetchSubscriptions('')}
                    title="Subscriptions"
                >
                    <MdSubscriptions size={22} />
                    {!isCollapsed && <span>Subscriptions</span>}
                </button>
                <button
                    className={`nav-item ${view === 'invoices' ? 'active' : ''}`}
                    onClick={() => fetchData('invoices')}
                    title="Invoices"
                >
                    <MdReceipt size={22} />
                    {!isCollapsed && <span>Invoices</span>}
                </button>

                <button
                    className={`nav-item ${view === 'advertisements' ? 'active' : ''}`}
                    onClick={() => fetchData('advertisements')}
                    title="Advertisements"
                >
                    <MdCampaign size={22} />
                    {!isCollapsed && <span>Advertisements</span>}
                </button>
                <button
                    className={`nav-item ${view === 'inventory' ? 'active' : ''}`}
                    onClick={() => fetchData('inventory')}
                    title="Inventory"
                >
                    <MdInventory size={22} />
                    {!isCollapsed && <span>Inventory</span>}
                </button>

                <button
                    className={`nav-item ${view === 'member-types' ? 'active' : ''}`}
                    onClick={() => fetchData('member-types')}
                    title="Categories"
                >
                    <MdSettings size={22} />
                    {!isCollapsed && <span>Categories</span>}
                </button>
                <button
                    className={`nav-item ${view === 'reports' ? 'active' : ''}`}
                    onClick={() => fetchData('reports')}
                    title="Reports"
                >
                    <MdAssessment size={22} />
                    {!isCollapsed && <span>Reports</span>}
                </button>
                <button
                    className={`nav-item ${view === 'database' ? 'active' : ''}`}
                    onClick={() => setView('database')}
                    title="Backup & Restore"
                >
                    <MdStorage size={22} />
                    {!isCollapsed && <span>Backup & Restore</span>}
                </button>

                <div style={{ flex: 1 }}></div>

            </div>
        </div>
    );
};

export default Sidebar;
