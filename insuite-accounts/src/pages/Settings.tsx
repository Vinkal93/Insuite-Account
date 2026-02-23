import { useEffect, useState } from 'react';
import { useTheme, COLOR_THEMES } from '../context/ThemeContext';
import db, { getSettings } from '../db/database';
import type { AppSettings, Company, Account } from '../types';

type ColorTheme = 'frosted' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'rose' | 'monochrome';

export default function Settings() {
    const { theme, setTheme, colorTheme, setColorTheme, buttonStyle, setButtonStyle, customColor, setCustomColor } = useTheme();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [activeTab, setActiveTab] = useState<'theme' | 'company' | 'accounts' | 'backup'>('theme');
    const [showAddBank, setShowAddBank] = useState(false);
    const [bankForm, setBankForm] = useState({ name: '', bankName: '', accountNumber: '', ifscCode: '', balance: 0 });

    useEffect(() => {
        async function load() {
            const s = await getSettings();
            const c = await db.company.toCollection().first();
            const a = await db.accounts.toArray();
            setSettings(s || null);
            setCompany(c || null);
            setAccounts(a);
        }
        load();
    }, []);

    const handleAddBank = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.accounts.add({
            ...bankForm,
            type: 'bank',
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        setBankForm({ name: '', bankName: '', accountNumber: '', ifscCode: '', balance: 0 });
        setShowAddBank(false);
        const a = await db.accounts.toArray();
        setAccounts(a);
    };

    const handleDeleteAccount = async (id: number) => {
        if (confirm('Delete this account?')) {
            await db.accounts.delete(id);
            const a = await db.accounts.toArray();
            setAccounts(a);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <h1 className="text-headline-medium">Settings</h1>
                <p className="text-body-medium text-muted">Customize your app experience</p>
            </div>

            {/* Tabs */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)', flexWrap: 'wrap' }}>
                    <button className={`btn ${activeTab === 'theme' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setActiveTab('theme')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>palette</span>
                        Theme
                    </button>
                    <button className={`btn ${activeTab === 'company' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setActiveTab('company')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>business</span>
                        Company
                    </button>
                    <button className={`btn ${activeTab === 'accounts' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setActiveTab('accounts')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>account_balance</span>
                        Banks
                    </button>
                    <button className={`btn ${activeTab === 'backup' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setActiveTab('backup')}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>backup</span>
                        Backup
                    </button>
                </div>
            </div>

            {/* Theme Settings */}
            {activeTab === 'theme' && (
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>palette</span>
                        Appearance
                    </h3>

                    {/* Light/Dark Mode */}
                    <div style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                        <label className="form-label" style={{ marginBottom: 'var(--md-sys-spacing-md)' }}>Mode</label>
                        <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)', flexWrap: 'wrap' }}>
                            <button className={`btn ${theme === 'light' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setTheme('light')} style={{ flex: '1 1 100px', padding: '16px 12px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>light_mode</span>
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.875rem' }}>Light</span>
                            </button>
                            <button className={`btn ${theme === 'dark' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setTheme('dark')} style={{ flex: '1 1 100px', padding: '16px 12px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>dark_mode</span>
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.875rem' }}>Dark</span>
                            </button>
                            <button className={`btn ${theme === 'system' ? 'btn-filled' : 'btn-outlined'}`} onClick={() => setTheme('system')} style={{ flex: '1 1 100px', padding: '16px 12px' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>computer</span>
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.875rem' }}>System</span>
                            </button>
                        </div>
                    </div>

                    {/* Color Theme */}
                    <div style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                        <label className="form-label" style={{ marginBottom: 'var(--md-sys-spacing-md)' }}>Color Theme</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--md-sys-spacing-sm)' }}>
                            {(Object.keys(COLOR_THEMES) as ColorTheme[]).map(key => {
                                const themeData = COLOR_THEMES[key];
                                const isActive = colorTheme === key;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => setColorTheme(key)}
                                        style={{
                                            padding: 'var(--md-sys-spacing-md)',
                                            borderRadius: 'var(--md-sys-shape-corner-md)',
                                            border: `2px solid ${isActive ? themeData.primary : 'var(--md-sys-color-outline-variant)'}`,
                                            background: isActive ? `${themeData.primary}15` : 'var(--md-sys-color-surface)',
                                            cursor: 'pointer',
                                            transition: 'all var(--md-sys-motion-duration-short)',
                                            position: 'relative'
                                        }}
                                    >
                                        {isActive && (
                                            <div style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', borderRadius: '50%', background: themeData.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-rounded" style={{ fontSize: '14px', color: '#fff' }}>check</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '3px', marginBottom: '8px' }}>
                                            {themeData.preview.map((color, i) => (
                                                <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.2)' }} />
                                            ))}
                                        </div>
                                        <div className="text-label-medium">{themeData.name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Button Style */}
                    <div style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                        <label className="form-label" style={{ marginBottom: 'var(--md-sys-spacing-md)' }}>Button Style</label>
                        <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', flexWrap: 'wrap' }}>
                            <div onClick={() => setButtonStyle('solid')} style={{
                                flex: '1 1 200px', padding: 'var(--md-sys-spacing-lg)',
                                borderRadius: '12px', cursor: 'pointer',
                                border: `2px solid ${buttonStyle === 'solid' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                background: buttonStyle === 'solid' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <button className="btn" style={{ background: 'var(--md-sys-color-primary)', color: '#fff', pointerEvents: 'none' }}>Solid Button</button>
                                </div>
                                <div className="text-label-large">Solid Color</div>
                                <div className="text-label-medium text-muted">Single flat color</div>
                            </div>
                            <div onClick={() => setButtonStyle('gradient')} style={{
                                flex: '1 1 200px', padding: 'var(--md-sys-spacing-lg)',
                                borderRadius: '12px', cursor: 'pointer',
                                border: `2px solid ${buttonStyle === 'gradient' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                background: buttonStyle === 'gradient' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <button className="btn" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))', color: '#fff', pointerEvents: 'none' }}>Gradient Button</button>
                                </div>
                                <div className="text-label-large">Gradient</div>
                                <div className="text-label-medium text-muted">Smooth color blend</div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Color Picker */}
                    <div>
                        <label className="form-label" style={{ marginBottom: 'var(--md-sys-spacing-md)' }}>Custom Accent Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-md)' }}>
                            <input
                                type="color"
                                value={customColor}
                                onChange={e => setCustomColor(e.target.value)}
                                style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                value={customColor}
                                onChange={e => setCustomColor(e.target.value)}
                                style={{ maxWidth: '120px' }}
                            />
                            <span className="text-label-medium text-muted">Choose any color</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Company Settings */}
            {activeTab === 'company' && (
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>domain</span>
                        Company Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--md-sys-spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input type="text" className="form-input" placeholder="Your Business Name" defaultValue={company?.name} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">GSTIN</label>
                            <input type="text" className="form-input" placeholder="15-digit GSTIN" defaultValue={company?.gstin} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">PAN</label>
                            <input type="text" className="form-input" placeholder="PAN Number" defaultValue={company?.pan} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input type="tel" className="form-input" placeholder="Business phone" defaultValue={company?.phone} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="Business email" defaultValue={company?.email} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Address</label>
                            <textarea className="form-input" rows={2} placeholder="Business address" defaultValue={company?.address} />
                        </div>
                    </div>
                    <button className="btn btn-filled" style={{ marginTop: 'var(--md-sys-spacing-md)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>save</span>
                        Save Company
                    </button>
                </div>
            )}

            {/* Bank Accounts */}
            {activeTab === 'accounts' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        <h3 className="text-title-large" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>account_balance</span>
                            Bank Accounts
                        </h3>
                        <button className="btn btn-filled" onClick={() => setShowAddBank(true)}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>add</span>
                            Add Bank
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--md-sys-spacing-md)' }}>
                        {accounts.map(acc => (
                            <div key={acc.id} style={{
                                padding: 'var(--md-sys-spacing-lg)',
                                borderRadius: 'var(--md-sys-shape-corner-lg)',
                                background: acc.type === 'bank'
                                    ? 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-secondary) 100%)'
                                    : 'linear-gradient(135deg, var(--md-sys-color-success) 0%, #059669 100%)',
                                color: '#fff'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>{acc.type === 'bank' ? acc.bankName : 'Cash'}</div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{acc.name}</div>
                                    </div>
                                    <span className="material-symbols-rounded" style={{ fontSize: '28px', opacity: 0.3 }}>
                                        {acc.type === 'bank' ? 'credit_card' : 'wallet'}
                                    </span>
                                </div>
                                {acc.accountNumber && (
                                    <div style={{ marginTop: '12px', fontSize: '0.875rem', opacity: 0.8 }}>
                                        **** {acc.accountNumber.slice(-4)}
                                    </div>
                                )}
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{acc.balance.toLocaleString('en-IN')}</div>
                                    <button className="btn btn-icon" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={() => acc.id && handleDeleteAccount(acc.id)}>
                                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {accounts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>account_balance</span>
                            <p className="text-muted">No bank accounts added</p>
                        </div>
                    )}
                </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>cloud_upload</span>
                        Backup & Restore
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)', marginBottom: 'var(--md-sys-spacing-lg)', flexWrap: 'wrap' }}>
                        <button className="btn btn-filled">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>backup</span>
                            Create Backup
                        </button>
                        <button className="btn btn-outlined">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>restore</span>
                            Restore
                        </button>
                        <button className="btn btn-outlined">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>download</span>
                            Export All
                        </button>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Auto Backup</label>
                        <select className="form-input form-select" defaultValue={settings?.backupFrequency} style={{ maxWidth: '200px' }}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--md-sys-spacing-md)', padding: 'var(--md-sys-spacing-md)', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-success)' }}>schedule</span>
                        <span className="text-body-medium">Last backup: {settings?.lastBackup ? new Date(settings.lastBackup).toLocaleDateString('en-IN') : 'Never'}</span>
                    </div>
                </div>
            )}

            {/* Add Bank Modal */}
            {showAddBank && (
                <div className="modal-overlay" onClick={() => setShowAddBank(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Bank Account</h2>
                            <button className="btn btn-icon" onClick={() => setShowAddBank(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddBank}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label form-label-required">Account Name</label>
                                    <input type="text" className="form-input" value={bankForm.name} onChange={e => setBankForm({ ...bankForm, name: e.target.value })} placeholder="e.g. Business Account" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label form-label-required">Bank Name</label>
                                    <input type="text" className="form-input" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. HDFC Bank" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Account Number</label>
                                    <input type="text" className="form-input" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IFSC Code</label>
                                    <input type="text" className="form-input" value={bankForm.ifscCode} onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Opening Balance</label>
                                    <input type="number" className="form-input" value={bankForm.balance} onChange={e => setBankForm({ ...bankForm, balance: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outlined" onClick={() => setShowAddBank(false)}>Cancel</button>
                                <button type="submit" className="btn btn-filled">
                                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>add</span>
                                    Add Bank
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
