import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Expense, ExpenseCategory, Account } from '../types';

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const [formData, setFormData] = useState({
        categoryId: 0,
        accountId: 0,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        isRecurring: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [expensesData, categoriesData, accountsData] = await Promise.all([
            db.expenses.toArray(),
            db.expenseCategories.toArray(),
            db.accounts.toArray()
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
        setAccounts(accountsData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.expenses.add({
            ...formData,
            date: new Date(formData.date),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        setShowModal(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setFormData({
            categoryId: 0,
            accountId: 0,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: '',
            isRecurring: false
        });
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this expense?')) {
            await db.expenses.delete(id);
            loadData();
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const expenseMonth = new Date(e.date).toISOString().slice(0, 7);
        return expenseMonth === selectedMonth;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown';
    const getAccountName = (id: number) => accounts.find(a => a.id === id)?.name || 'Unknown';

    // Category wise breakdown
    const categoryBreakdown = categories.map(cat => ({
        ...cat,
        total: filteredExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Expenses</h1>
                    <p className="text-body-medium text-muted">Track and manage business expenses</p>
                </div>
                <button className="btn btn-filled" onClick={() => { resetForm(); setShowModal(true); }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                    Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--md-sys-spacing-lg)', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div className="card card-gradient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-error)', fontSize: '24px' }}>payments</span>
                        </div>
                        <div>
                            <div className="text-label-medium text-muted">This Month</div>
                            <div className="text-headline-medium text-error">₹{totalExpenses.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <input
                        type="month"
                        className="form-input"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>

                {/* Top Categories */}
                <div className="card">
                    <h3 className="text-title-medium" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>pie_chart</span>
                        Top Categories
                    </h3>
                    {categoryBreakdown.slice(0, 3).map(cat => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="text-label-medium">{cat.name}</span>
                            <span className="text-label-medium">₹{cat.total.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expenses List */}
            {loading ? (
                <div className="card"><div className="skeleton" style={{ height: '200px' }} /></div>
            ) : filteredExpenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-md)', display: 'block' }}>payments</span>
                    <h3 className="text-title-large">No expenses this month</h3>
                    <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                        Record your first expense
                    </p>
                    <button className="btn btn-filled" onClick={() => setShowModal(true)}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
                        Add Expense
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Account</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                <tr key={expense.id}>
                                    <td>{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <span className="badge badge-primary">{getCategoryName(expense.categoryId)}</span>
                                    </td>
                                    <td>{expense.description}</td>
                                    <td>{getAccountName(expense.accountId)}</td>
                                    <td className="text-error">₹{expense.amount.toLocaleString('en-IN')}</td>
                                    <td>
                                        <button className="btn btn-icon" onClick={() => expense.id && handleDelete(expense.id)}>
                                            <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-error)' }}>delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FAB */}
            <button className="fab" title="Add Expense" onClick={() => { resetForm(); setShowModal(true); }}>
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Expense</h2>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-sys-spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Category</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                                            required
                                        >
                                            <option value={0}>Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Account</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.accountId}
                                            onChange={e => setFormData({ ...formData, accountId: Number(e.target.value) })}
                                            required
                                        >
                                            <option value={0}>Select Account</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Description</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-filled" disabled={!formData.categoryId || !formData.accountId || !formData.amount}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>save</span>
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
