import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const bottomNavItems = [
    { path: '/', label: 'Home', icon: 'dashboard' },
    { path: '/sales', label: 'Sales', icon: 'receipt_long' },
    { path: '/expenses', label: 'Expenses', icon: 'payments' },
    { path: '/reports', label: 'Reports', icon: 'analytics' },
    { path: '/settings', label: 'More', icon: 'menu' },
];

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { sidebarCollapsed, setSidebarCollapsed } = useTheme();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setSidebarOpen(true)}
                >
                    <span className="material-symbols-rounded">menu</span>
                </button>
                <div className="mobile-header-title">
                    <span className="mobile-logo">IS</span>
                    <span>InSuite Accounts</span>
                </div>
            </header>

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="main-content">
                <div className="page-content">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <div className="bottom-nav-items">
                    {bottomNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="material-symbols-rounded">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
