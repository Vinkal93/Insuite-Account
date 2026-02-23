import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    category: string;
    action: () => void;
}

// Hook to register global keyboard shortcuts
export function useKeyboardShortcuts(onCommandPalette?: () => void) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const shortcuts: Shortcut[] = [
            // Navigation
            { key: 'd', ctrl: true, description: 'Dashboard', category: 'Navigation', action: () => navigate('/') },
            { key: '1', alt: true, description: 'Parties', category: 'Navigation', action: () => navigate('/parties') },
            { key: '2', alt: true, description: 'Products', category: 'Navigation', action: () => navigate('/products') },
            { key: '3', alt: true, description: 'Sales', category: 'Navigation', action: () => navigate('/sales') },
            { key: '4', alt: true, description: 'Purchases', category: 'Navigation', action: () => navigate('/purchases') },
            { key: '5', alt: true, description: 'Expenses', category: 'Navigation', action: () => navigate('/expenses') },
            { key: '6', alt: true, description: 'Cash & Bank', category: 'Navigation', action: () => navigate('/cash-bank') },
            { key: '7', alt: true, description: 'Reports', category: 'Navigation', action: () => navigate('/reports') },
            { key: '8', alt: true, description: 'GST', category: 'Navigation', action: () => navigate('/gst') },
            { key: '9', alt: true, description: 'Settings', category: 'Navigation', action: () => navigate('/settings') },

            // Quick Actions
            { key: 'F5', description: 'New Sale / Invoice', category: 'Quick Actions', action: () => navigate('/sales') },
            { key: 'F6', description: 'New Purchase', category: 'Quick Actions', action: () => navigate('/purchases') },
            { key: 'F7', description: 'New Party', category: 'Quick Actions', action: () => navigate('/parties') },
            { key: 'F8', description: 'New Expense', category: 'Quick Actions', action: () => navigate('/expenses') },
            { key: 'F9', description: 'Reports', category: 'Quick Actions', action: () => navigate('/reports') },

            // Tools
            { key: 'k', ctrl: true, description: 'Command Palette', category: 'Tools', action: () => onCommandPalette?.() },
            {
                key: '/', ctrl: true, description: 'Keyboard Shortcuts', category: 'Tools', action: () => {
                    document.dispatchEvent(new CustomEvent('toggle-shortcuts-help'));
                }
            },
            { key: 'p', ctrl: true, description: 'Print Current View', category: 'Tools', action: () => window.print() },

            // General
            {
                key: 'Escape', description: 'Close / Go Back', category: 'General', action: () => {
                    // Close any open modal first, otherwise go back
                    const event = new CustomEvent('escape-pressed');
                    document.dispatchEvent(event);
                }
            },
            { key: 'F1', alt: true, description: 'Go Back', category: 'General', action: () => window.history.back() },
        ];

        const handler = (e: KeyboardEvent) => {
            // Don't fire shortcuts when typing in inputs
            const tag = (e.target as HTMLElement).tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                }
                return;
            }

            for (const s of shortcuts) {
                const keyMatch = e.key === s.key || e.key.toLowerCase() === s.key.toLowerCase();
                const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey);
                const altMatch = !!s.alt === e.altKey;
                const shiftMatch = !!s.shift === e.shiftKey;

                if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                    e.preventDefault();
                    e.stopPropagation();
                    s.action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [navigate, location, onCommandPalette]);
}

// Shortcut Help Overlay
export function ShortcutHelpOverlay() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const toggle = () => setOpen(v => !v);
        document.addEventListener('toggle-shortcuts-help', toggle);
        return () => document.removeEventListener('toggle-shortcuts-help', toggle);
    }, []);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) setOpen(false);
    }, [open]);

    useEffect(() => {
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [handleEscape]);

    if (!open) return null;

    const categories = [
        {
            name: 'Navigation', shortcuts: [
                { keys: 'Ctrl+D', desc: 'Dashboard' },
                { keys: 'Alt+1', desc: 'Parties' },
                { keys: 'Alt+2', desc: 'Products' },
                { keys: 'Alt+3', desc: 'Sales' },
                { keys: 'Alt+4', desc: 'Purchases' },
                { keys: 'Alt+5', desc: 'Expenses' },
                { keys: 'Alt+6', desc: 'Cash & Bank' },
                { keys: 'Alt+7', desc: 'Reports' },
                { keys: 'Alt+8', desc: 'GST' },
                { keys: 'Alt+9', desc: 'Settings' },
            ]
        },
        {
            name: 'Quick Actions', shortcuts: [
                { keys: 'F5', desc: 'New Sale / Invoice' },
                { keys: 'F6', desc: 'New Purchase' },
                { keys: 'F7', desc: 'New Party' },
                { keys: 'F8', desc: 'New Expense' },
                { keys: 'F9', desc: 'Open Reports' },
            ]
        },
        {
            name: 'Tools', shortcuts: [
                { keys: 'Ctrl+K', desc: 'Command Palette' },
                { keys: 'Ctrl+/', desc: 'Keyboard Shortcuts' },
                { keys: 'Ctrl+P', desc: 'Print Current View' },
                { keys: 'Escape', desc: 'Close / Go Back' },
                { keys: 'Alt+F1', desc: 'Go Back' },
            ]
        }
    ];

    return (
        <div className="shortcut-overlay" onClick={() => setOpen(false)}>
            <div className="shortcut-overlay-content" onClick={e => e.stopPropagation()}>
                <div className="shortcut-overlay-header">
                    <h2>
                        <span className="material-symbols-rounded" style={{ fontSize: '22px' }}>keyboard</span>
                        Keyboard Shortcuts
                    </h2>
                    <button className="btn btn-icon" onClick={() => setOpen(false)}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div className="shortcut-categories">
                    {categories.map(cat => (
                        <div key={cat.name} className="shortcut-category">
                            <h3>{cat.name}</h3>
                            <div className="shortcut-list">
                                {cat.shortcuts.map(s => (
                                    <div key={s.keys} className="shortcut-item">
                                        <span className="shortcut-desc">{s.desc}</span>
                                        <kbd className="shortcut-key">{s.keys}</kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
