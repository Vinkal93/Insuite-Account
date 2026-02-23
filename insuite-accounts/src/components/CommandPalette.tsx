import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';

interface CommandItem {
    id: string;
    label: string;
    icon: string;
    category: string;
    action: () => void;
    keywords?: string;
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [dynamicItems, setDynamicItems] = useState<CommandItem[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Static navigation commands
    const staticCommands: CommandItem[] = [
        { id: 'nav-dash', label: 'Dashboard', icon: 'dashboard', category: 'Navigate', action: () => navigate('/'), keywords: 'home' },
        { id: 'nav-parties', label: 'Parties', icon: 'groups', category: 'Navigate', action: () => navigate('/parties'), keywords: 'customer vendor' },
        { id: 'nav-products', label: 'Products', icon: 'inventory_2', category: 'Navigate', action: () => navigate('/products'), keywords: 'item stock inventory' },
        { id: 'nav-sales', label: 'Sales / Invoices', icon: 'receipt_long', category: 'Navigate', action: () => navigate('/sales'), keywords: 'invoice bill' },
        { id: 'nav-purchases', label: 'Purchases', icon: 'shopping_cart', category: 'Navigate', action: () => navigate('/purchases'), keywords: 'buy vendor bill' },
        { id: 'nav-expenses', label: 'Expenses', icon: 'payments', category: 'Navigate', action: () => navigate('/expenses'), keywords: 'cost spend' },
        { id: 'nav-cashbank', label: 'Cash & Bank', icon: 'account_balance', category: 'Navigate', action: () => navigate('/cash-bank'), keywords: 'money transaction' },
        { id: 'nav-reports', label: 'Reports', icon: 'analytics', category: 'Navigate', action: () => navigate('/reports'), keywords: 'report profit loss' },
        { id: 'nav-gst', label: 'GST', icon: 'receipt', category: 'Navigate', action: () => navigate('/gst'), keywords: 'tax gst return' },
        { id: 'nav-settings', label: 'Settings', icon: 'settings', category: 'Navigate', action: () => navigate('/settings'), keywords: 'config preferences theme' },
        { id: 'nav-company', label: 'Company Setup', icon: 'business', category: 'Navigate', action: () => navigate('/company-setup'), keywords: 'company info gstin' },

        // Report shortcuts
        { id: 'rpt-pl', label: 'Profit & Loss Report', icon: 'analytics', category: 'Reports', action: () => navigate('/reports'), keywords: 'pnl profit loss income' },
        { id: 'rpt-bs', label: 'Balance Sheet', icon: 'account_balance_wallet', category: 'Reports', action: () => navigate('/reports'), keywords: 'balance sheet assets liabilities' },
        { id: 'rpt-tb', label: 'Trial Balance', icon: 'balance', category: 'Reports', action: () => navigate('/reports'), keywords: 'trial balance debit credit' },
        { id: 'rpt-daybook', label: 'Day Book', icon: 'calendar_today', category: 'Reports', action: () => navigate('/reports'), keywords: 'daybook daily transactions' },
        { id: 'rpt-stock', label: 'Stock Summary', icon: 'inventory', category: 'Reports', action: () => navigate('/reports'), keywords: 'stock inventory item' },
        { id: 'rpt-recv', label: 'Outstanding Receivables', icon: 'call_received', category: 'Reports', action: () => navigate('/reports'), keywords: 'receivable due money owed' },
        { id: 'rpt-pay', label: 'Outstanding Payables', icon: 'call_made', category: 'Reports', action: () => navigate('/reports'), keywords: 'payable due owe' },

        // Actions
        { id: 'act-print', label: 'Print Current View', icon: 'print', category: 'Actions', action: () => window.print(), keywords: 'print page' },
        { id: 'act-shortcuts', label: 'Keyboard Shortcuts', icon: 'keyboard', category: 'Actions', action: () => document.dispatchEvent(new CustomEvent('toggle-shortcuts-help')) },
    ];

    // Load dynamic items (parties, products)
    useEffect(() => {
        if (!open) return;
        (async () => {
            const [parties, products] = await Promise.all([
                db.parties.limit(50).toArray(),
                db.products.limit(50).toArray()
            ]);
            const items: CommandItem[] = [
                ...parties.map(p => ({
                    id: `party-${p.id}`, label: p.name, icon: 'person', category: 'Parties',
                    action: () => navigate('/parties'), keywords: `${p.phone || ''} ${p.gstin || ''}`
                })),
                ...products.map(p => ({
                    id: `prod-${p.id}`, label: p.name, icon: 'inventory_2', category: 'Products',
                    action: () => navigate('/products'), keywords: `${p.hsn || ''} ${p.unit}`
                })),
            ];
            setDynamicItems(items);
        })();
    }, [open, navigate]);

    // Ctrl+K handler
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(v => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Filter results
    const allCommands = [...staticCommands, ...dynamicItems];
    const filtered = query.trim()
        ? allCommands.filter(cmd => {
            const q = query.toLowerCase();
            return cmd.label.toLowerCase().includes(q) ||
                cmd.category.toLowerCase().includes(q) ||
                (cmd.keywords || '').toLowerCase().includes(q);
        })
        : allCommands.slice(0, 15);

    // Keyboard nav
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filtered[activeIndex]) {
            e.preventDefault();
            filtered[activeIndex].action();
            setOpen(false);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }, [filtered, activeIndex]);

    // Group by category
    const grouped: Record<string, CommandItem[]> = {};
    filtered.forEach(cmd => {
        if (!grouped[cmd.category]) grouped[cmd.category] = [];
        grouped[cmd.category].push(cmd);
    });

    if (!open) return null;

    let flatIndex = -1;
    return (
        <div className="command-palette-overlay" onClick={() => setOpen(false)}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <div className="command-palette-input-wrapper">
                    <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-outline)', fontSize: '20px' }}>search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search commands, pages, parties, products..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                        onKeyDown={handleKeyDown}
                        className="command-palette-input"
                    />
                    <kbd className="command-palette-esc">ESC</kbd>
                </div>
                <div className="command-palette-results">
                    {Object.entries(grouped).length === 0 ? (
                        <div className="command-palette-empty">
                            <span className="material-symbols-rounded" style={{ fontSize: '40px', color: 'var(--md-sys-color-outline)' }}>search_off</span>
                            <p>No results found</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                                <div className="command-palette-category">{cat}</div>
                                {items.map(cmd => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <div
                                            key={cmd.id}
                                            className={`command-palette-item ${idx === activeIndex ? 'active' : ''}`}
                                            onClick={() => { cmd.action(); setOpen(false); }}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                        >
                                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{cmd.icon}</span>
                                            <span>{cmd.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
