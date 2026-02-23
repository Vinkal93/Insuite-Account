import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/parties': 'Party Management',
    '/products': 'Products & Services',
    '/sales': 'Sales & Invoices',
    '/purchases': 'Purchases',
    '/expenses': 'Expense Management',
    '/cash-bank': 'Cash & Bank',
    '/reports': 'Reports',
    '/gst': 'GST & Tax',
    '/settings': 'Settings',
    '/company-setup': 'Company Setup',
};

export default function TopBar() {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'InSuite Accounts';

    return (
        <header className="top-bar">
            <h2 className="top-bar-title">{title}</h2>
            <div className="top-bar-actions">
                <button className="btn btn-icon" title="Search">
                    <span className="material-symbols-rounded">search</span>
                </button>
                <button className="btn btn-icon" title="Notifications">
                    <span className="material-symbols-rounded">notifications</span>
                </button>
                <button className="btn btn-icon" title="Profile">
                    <span className="material-symbols-rounded">account_circle</span>
                </button>
            </div>
        </header>
    );
}
