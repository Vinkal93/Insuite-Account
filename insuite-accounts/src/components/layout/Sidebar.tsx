import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useCompany } from '../../context/CompanyContext';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    shortcut?: string;
}

const dashboardItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', shortcut: 'Ctrl+D' },
];

const masterItems: NavItem[] = [
    { path: '/ledger-groups', label: 'Ledger Groups', icon: 'account_tree', shortcut: 'Alt+1' },
    { path: '/ledgers', label: 'Ledgers', icon: 'menu_book', shortcut: 'Alt+2' },
    { path: '/stock-groups', label: 'Stock Groups', icon: 'category', shortcut: 'Alt+3' },
    { path: '/units', label: 'Units', icon: 'straighten', shortcut: 'Alt+4' },
    { path: '/stock-items', label: 'Stock Items', icon: 'inventory_2', shortcut: 'Alt+5' },
    { path: '/parties', label: 'Parties', icon: 'groups', shortcut: 'Alt+6' },
];

const transactionNavItems: NavItem[] = [
    { path: '/sales', label: 'Sales', icon: 'receipt_long', shortcut: 'Alt+7' },
    { path: '/purchases', label: 'Purchases', icon: 'shopping_cart', shortcut: 'Alt+8' },
    { path: '/expenses', label: 'Expenses', icon: 'payments' },
    { path: '/cash-bank', label: 'Cash & Bank', icon: 'account_balance' },
];

const reportNavItems: NavItem[] = [
    { path: '/reports', label: 'Reports', icon: 'analytics' },
    { path: '/gst', label: 'GST', icon: 'receipt' },
];

const settingsNavItems: NavItem[] = [
    { path: '/company-setup', label: 'Company', icon: 'business' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onCollapse }: SidebarProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const { activeCompany } = useCompany();

    const renderNavItems = (items: NavItem[]) => (
        items.map((item, index) => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item stagger-item ${isActive ? 'active' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => window.innerWidth < 768 && onClose()}
                end={item.path === '/'}
                title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            >
                <span className="nav-item-icon material-symbols-rounded">{item.icon}</span>
                {!isCollapsed && (
                    <>
                        <span className="nav-item-label">{item.label}</span>
                        {item.shortcut && <kbd className="nav-shortcut-hint">{item.shortcut}</kbd>}
                    </>
                )}
            </NavLink>
        ))
    );

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">IS</div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="sidebar-title">InSuite</h1>
                            <span className="sidebar-subtitle">Accounts</span>
                        </div>
                    )}
                    <button className="sidebar-collapse-btn" onClick={onCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
                        <span className="material-symbols-rounded">{isCollapsed ? 'chevron_right' : 'chevron_left'}</span>
                    </button>
                </div>

                {/* Active Company Badge */}
                {activeCompany && !isCollapsed && (
                    <div className="sidebar-company-badge">
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>business</span>
                        <span className="sidebar-company-name">{activeCompany.name}</span>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {renderNavItems(dashboardItems)}

                    {!isCollapsed && <div className="nav-section-title">Masters</div>}
                    {renderNavItems(masterItems)}

                    {!isCollapsed && <div className="nav-section-title">Transactions</div>}
                    {renderNavItems(transactionNavItems)}

                    {!isCollapsed && <div className="nav-section-title">Reports & Tax</div>}
                    {renderNavItems(reportNavItems)}

                    {!isCollapsed && <div className="nav-section-title">Settings</div>}
                    {renderNavItems(settingsNavItems)}
                </nav>

                <div className="sidebar-footer">
                    {!isCollapsed && (
                        <button className="btn btn-outlined sidebar-theme-btn"
                            onClick={() => document.dispatchEvent(new CustomEvent('toggle-shortcuts-help'))}
                            title="Keyboard Shortcuts (Ctrl+/)"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '6px' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>keyboard</span>
                            Shortcuts
                            <kbd className="nav-shortcut-hint" style={{ marginLeft: 'auto' }}>Ctrl+/</kbd>
                        </button>
                    )}
                    <button className="btn btn-outlined sidebar-theme-btn"
                        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                        title={resolvedTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        style={{ width: '100%', justifyContent: 'center' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                            {resolvedTheme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                        {!isCollapsed && (resolvedTheme === 'light' ? 'Dark Mode' : 'Light Mode')}
                    </button>
                </div>
            </aside>
        </>
    );
}
