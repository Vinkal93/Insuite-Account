import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    shortcut?: string;
}

const mainNavItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', shortcut: 'Ctrl+D' },
    { path: '/parties', label: 'Parties', icon: 'groups', shortcut: 'Alt+1' },
    { path: '/products', label: 'Products', icon: 'inventory_2', shortcut: 'Alt+2' },
];

const transactionNavItems: NavItem[] = [
    { path: '/sales', label: 'Sales', icon: 'receipt_long', shortcut: 'Alt+3' },
    { path: '/purchases', label: 'Purchases', icon: 'shopping_cart', shortcut: 'Alt+4' },
    { path: '/expenses', label: 'Expenses', icon: 'payments', shortcut: 'Alt+5' },
    { path: '/cash-bank', label: 'Cash & Bank', icon: 'account_balance', shortcut: 'Alt+6' },
];

const reportNavItems: NavItem[] = [
    { path: '/reports', label: 'Reports', icon: 'analytics', shortcut: 'Alt+7' },
    { path: '/gst', label: 'GST', icon: 'receipt', shortcut: 'Alt+8' },
];

const settingsNavItems: NavItem[] = [
    { path: '/settings', label: 'Settings', icon: 'settings', shortcut: 'Alt+9' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onCollapse }: SidebarProps) {
    const { resolvedTheme, setTheme } = useTheme();

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
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
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
                    {/* Collapse Button (Desktop) */}
                    <button
                        className="sidebar-collapse-btn"
                        onClick={onCollapse}
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        <span className="material-symbols-rounded">
                            {isCollapsed ? 'chevron_right' : 'chevron_left'}
                        </span>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {renderNavItems(mainNavItems)}

                    {!isCollapsed && <div className="nav-section-title">Transactions</div>}
                    {renderNavItems(transactionNavItems)}

                    {!isCollapsed && <div className="nav-section-title">Reports & Tax</div>}
                    {renderNavItems(reportNavItems)}

                    {!isCollapsed && <div className="nav-section-title">Settings</div>}
                    {renderNavItems(settingsNavItems)}
                </nav>

                <div className="sidebar-footer">
                    {/* Keyboard shortcut hint */}
                    {!isCollapsed && (
                        <button
                            className="btn btn-outlined sidebar-theme-btn"
                            onClick={() => document.dispatchEvent(new CustomEvent('toggle-shortcuts-help'))}
                            title="Keyboard Shortcuts (Ctrl+/)"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '6px' }}
                        >
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>keyboard</span>
                            Shortcuts
                            <kbd className="nav-shortcut-hint" style={{ marginLeft: 'auto' }}>Ctrl+/</kbd>
                        </button>
                    )}
                    <button
                        className="btn btn-outlined sidebar-theme-btn"
                        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                        title={resolvedTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
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
