import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type { Account, Transaction } from '../types';

export default function CashBank() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'account' | 'transaction'>('account');
    const [loading, setLoading] = useState(true);

    const [accountForm, setAccountForm] = useState({
        name: '',
        type: 'bank' as 'cash' | 'bank',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        balance: 0
    });

    const [transactionForm, setTransactionForm] = useState({
        type: 'cash_in' as 'cash_in' | 'cash_out' | 'bank_deposit' | 'bank_withdrawal' | 'transfer',
        toAccountId: 0,
        fromAccountId: 0,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [accountsData, transactionsData] = await Promise.all([
            db.accounts.toArray(),
            db.transactions.orderBy('date').reverse().limit(50).toArray()
        ]);
        setAccounts(accountsData);
        setTransactions(transactionsData);
        setLoading(false);
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.accounts.add({
            ...accountForm,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        setShowModal(false);
        loadData();
    };

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Add transaction
        await db.transactions.add({
            ...transactionForm,
            date: new Date(transactionForm.date),
            createdAt: new Date()
        });

        // Update account balances
        if (transactionForm.type === 'cash_in' || transactionForm.type === 'bank_deposit') {
            const acc = accounts.find(a => a.id === transactionForm.toAccountId);
            if (acc?.id) {
                await db.accounts.update(acc.id, { balance: acc.balance + transactionForm.amount });
            }
        } else if (transactionForm.type === 'cash_out' || transactionForm.type === 'bank_withdrawal') {
            const acc = accounts.find(a => a.id === transactionForm.fromAccountId);
            if (acc?.id) {
                await db.accounts.update(acc.id, { balance: acc.balance - transactionForm.amount });
            }
        } else if (transactionForm.type === 'transfer') {
            const fromAcc = accounts.find(a => a.id === transactionForm.fromAccountId);
            const toAcc = accounts.find(a => a.id === transactionForm.toAccountId);
            if (fromAcc?.id) await db.accounts.update(fromAcc.id, { balance: fromAcc.balance - transactionForm.amount });
            if (toAcc?.id) await db.accounts.update(toAcc.id, { balance: toAcc.balance + transactionForm.amount });
        }

        setShowModal(false);
        loadData();
    };

    const totalCash = accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
    const totalBank = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);

    const getAccountName = (id?: number) => accounts.find(a => a.id === id)?.name || '-';

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div>
                    <h1 className="text-headline-medium">Cash & Bank</h1>
                    <p className="text-body-medium text-muted">Manage cash and bank accounts</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-sm)' }}>
                    <button className="btn btn-outlined" onClick={() => { setModalType('account'); setShowModal(true); }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add_card</span>
                        Add Account
                    </button>
                    <button className="btn btn-filled" onClick={() => { setModalType('transaction'); setShowModal(true); }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>swap_horiz</span>
                        New Entry
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--md-sys-spacing-lg)', marginBottom: 'var(--md-sys-spacing-xl)' }}>
                <div className="card card-gradient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--md-sys-color-success)' }}>payments</span>
                        </div>
                        <div>
                            <div className="text-label-medium text-muted">Cash in Hand</div>
                            <div className="text-headline-medium text-success">₹{totalCash.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>

                <div className="card card-gradient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(123, 223, 242, 0.2), rgba(123, 223, 242, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--md-sys-color-primary)' }}>account_balance</span>
                        </div>
                        <div>
                            <div className="text-label-medium text-muted">Bank Balance</div>
                            <div className="text-headline-medium text-primary">₹{totalBank.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>

                <div className="card card-gradient">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '28px', color: '#8b5cf6' }}>account_balance_wallet</span>
                        </div>
                        <div>
                            <div className="text-label-medium text-muted">Total Balance</div>
                            <div className="text-headline-medium">₹{(totalCash + totalBank).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accounts List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--md-sys-spacing-lg)', marginBottom: 'var(--md-sys-spacing-xl)' }}>
                {accounts.map(account => (
                    <div key={account.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: account.type === 'cash' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #7bdff2, #0d4a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-rounded" style={{ fontSize: '22px', color: '#fff' }}>
                                        {account.type === 'cash' ? 'payments' : 'account_balance'}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-title-medium">{account.name}</div>
                                    <div className="text-label-medium text-muted">{account.type === 'cash' ? 'Cash' : account.bankName}</div>
                                </div>
                            </div>
                            <span className={`badge ${account.type === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                                {account.type.toUpperCase()}
                            </span>
                        </div>
                        <div className={`text-headline-medium ${account.balance >= 0 ? 'text-success' : 'text-error'}`}>
                            ₹{account.balance.toLocaleString('en-IN')}
                        </div>
                        {account.accountNumber && (
                            <div className="text-label-medium text-muted" style={{ marginTop: '8px' }}>
                                A/C: ****{account.accountNumber.slice(-4)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)' }}>history</span>
                    Recent Transactions
                </h3>
                {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-xl)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--md-sys-color-outline)' }}>swap_horiz</span>
                        <p className="text-muted">No transactions yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {transactions.slice(0, 10).map(txn => (
                            <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-rounded" style={{
                                        color: txn.type.includes('in') || txn.type.includes('deposit') ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'
                                    }}>
                                        {txn.type.includes('in') || txn.type.includes('deposit') ? 'arrow_downward' : 'arrow_upward'}
                                    </span>
                                    <div>
                                        <div className="text-label-large">{txn.description || txn.type.replace('_', ' ').toUpperCase()}</div>
                                        <div className="text-label-medium text-muted">{new Date(txn.date).toLocaleDateString('en-IN')}</div>
                                    </div>
                                </div>
                                <span className={txn.type.includes('in') || txn.type.includes('deposit') ? 'text-success' : 'text-error'}>
                                    {txn.type.includes('in') || txn.type.includes('deposit') ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button className="fab" title="New Entry" onClick={() => { setModalType('transaction'); setShowModal(true); }}>
                <span className="material-symbols-rounded" style={{ fontSize: '28px' }}>add</span>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{modalType === 'account' ? 'Add Account' : 'New Entry'}</h2>
                            <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        {modalType === 'account' ? (
                            <form onSubmit={handleAccountSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Account Name</label>
                                        <input type="text" className="form-input" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-input form-select" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value as 'cash' | 'bank' })}>
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank</option>
                                        </select>
                                    </div>
                                    {accountForm.type === 'bank' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Bank Name</label>
                                                <input type="text" className="form-input" value={accountForm.bankName} onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Account Number</label>
                                                <input type="text" className="form-input" value={accountForm.accountNumber} onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">IFSC Code</label>
                                                <input type="text" className="form-input" value={accountForm.ifscCode} onChange={e => setAccountForm({ ...accountForm, ifscCode: e.target.value })} />
                                            </div>
                                        </>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Opening Balance</label>
                                        <input type="number" className="form-input" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-filled">Save Account</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleTransactionSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Transaction Type</label>
                                        <select className="form-input form-select" value={transactionForm.type} onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value as 'cash_in' | 'cash_out' | 'bank_deposit' | 'bank_withdrawal' | 'transfer' })}>
                                            <option value="cash_in">Cash In</option>
                                            <option value="cash_out">Cash Out</option>
                                            <option value="bank_deposit">Bank Deposit</option>
                                            <option value="bank_withdrawal">Bank Withdrawal</option>
                                            <option value="transfer">Transfer</option>
                                        </select>
                                    </div>
                                    {(transactionForm.type === 'cash_in' || transactionForm.type === 'bank_deposit') && (
                                        <div className="form-group">
                                            <label className="form-label">To Account</label>
                                            <select className="form-input form-select" value={transactionForm.toAccountId} onChange={e => setTransactionForm({ ...transactionForm, toAccountId: Number(e.target.value) })}>
                                                <option value={0}>Select Account</option>
                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {(transactionForm.type === 'cash_out' || transactionForm.type === 'bank_withdrawal') && (
                                        <div className="form-group">
                                            <label className="form-label">From Account</label>
                                            <select className="form-input form-select" value={transactionForm.fromAccountId} onChange={e => setTransactionForm({ ...transactionForm, fromAccountId: Number(e.target.value) })}>
                                                <option value={0}>Select Account</option>
                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {transactionForm.type === 'transfer' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">From Account</label>
                                                <select className="form-input form-select" value={transactionForm.fromAccountId} onChange={e => setTransactionForm({ ...transactionForm, fromAccountId: Number(e.target.value) })}>
                                                    <option value={0}>Select Account</option>
                                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">To Account</label>
                                                <select className="form-input form-select" value={transactionForm.toAccountId} onChange={e => setTransactionForm({ ...transactionForm, toAccountId: Number(e.target.value) })}>
                                                    <option value={0}>Select Account</option>
                                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label form-label-required">Amount</label>
                                        <input type="number" className="form-input" value={transactionForm.amount} onChange={e => setTransactionForm({ ...transactionForm, amount: Number(e.target.value) })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input type="date" className="form-input" value={transactionForm.date} onChange={e => setTransactionForm({ ...transactionForm, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <input type="text" className="form-input" value={transactionForm.description} onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })} placeholder="Enter description" />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outlined" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-filled">Save Entry</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
