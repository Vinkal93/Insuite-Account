import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../db/database';
import type { DashboardSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

function useAnimatedCounter(end: number, duration: number = 1200) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(end * easeOut));
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);
    return count;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
}

function StatCard({ title, value, icon, variant = 'primary', subtitle, trend }: {
    title: string; value: number; icon: string;
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'tertiary';
    subtitle?: string; trend?: { value: number; positive: boolean };
}) {
    const animatedValue = useAnimatedCounter(value);
    return (
        <div className="card card-gradient stat-card stagger-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className={`stat-card-icon ${variant}`}>
                    <span className="material-symbols-rounded">{icon}</span>
                </div>
                {trend && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        padding: '3px 8px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 600,
                        background: trend.positive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                        color: trend.positive ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'
                    }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>
                            {trend.positive ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend.value}%
                    </div>
                )}
            </div>
            <span className="text-label-medium text-muted" style={{ marginTop: '4px' }}>{title}</span>
            <span className="card-value" style={{
                color: variant === 'error' ? 'var(--md-sys-color-error)' : variant === 'success' ? 'var(--md-sys-color-success)' : undefined,
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)'
            }}>
                ₹{animatedValue.toLocaleString('en-IN')}
            </span>
            {subtitle && <span className="text-label-medium text-muted" style={{ opacity: 0.7 }}>{subtitle}</span>}
        </div>
    );
}

function QuickAction({ icon, label, to, color }: { icon: string; label: string; to: string; color: string }) {
    return (
        <Link to={to} className="stagger-item" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '16px 12px', borderRadius: '16px',
            background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
            border: `1px solid ${color}20`, textDecoration: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flex: '1 1 80px', minWidth: '80px', maxWidth: '120px',
        }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <span className="material-symbols-rounded" style={{ fontSize: '1.4rem', color }}>{icon}</span>
            </div>
            <span className="text-label-medium" style={{ color: 'var(--md-sys-color-on-surface)', textAlign: 'center' }}>{label}</span>
        </Link>
    );
}

const weeklyData = [
    { day: 'Mon', sales: 12500, purchases: 8000 },
    { day: 'Tue', sales: 18000, purchases: 5500 },
    { day: 'Wed', sales: 15000, purchases: 12000 },
    { day: 'Thu', sales: 22000, purchases: 9000 },
    { day: 'Fri', sales: 28000, purchases: 11000 },
    { day: 'Sat', sales: 35000, purchases: 15000 },
    { day: 'Sun', sales: 8000, purchases: 3000 },
];

const monthlyTrend = [
    { month: 'Aug', amount: 180000 },
    { month: 'Sep', amount: 220000 },
    { month: 'Oct', amount: 195000 },
    { month: 'Nov', amount: 280000 },
    { month: 'Dec', amount: 320000 },
    { month: 'Jan', amount: 275000 },
];

const expenseBreakdown = [
    { name: 'Rent', value: 25000, color: '#7bdff2' },
    { name: 'Salary', value: 45000, color: '#8b5cf6' },
    { name: 'Utilities', value: 8000, color: '#10b981' },
    { name: 'Marketing', value: 12000, color: '#f59e0b' },
    { name: 'Other', value: 10000, color: '#f2b5d4' },
];

export default function Dashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const greeting = getGreeting();

    useEffect(() => {
        async function loadSummary() {
            try {
                const data = await getDashboardSummary();
                setSummary(data);
            } catch (error) {
                console.error('Failed to load dashboard summary:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSummary();
    }, []);

    const displaySummary = summary || {
        totalCashBalance: 125000, totalBankBalance: 450000,
        todaySales: 25000, todayPurchases: 12000,
        monthlyProfit: 185000, monthlyLoss: 0,
        receivables: 175000, payables: 82000,
        monthlyExpenses: 100000, taxDue: 28500,
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="skeleton" style={{ width: '200px', height: '24px' }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Greeting Header */}
            <div style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                <h1 className="text-headline-large" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {greeting.emoji} {greeting.text}!
                </h1>
                <p className="text-body-medium text-muted">{today}</p>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-grid">
                <StatCard title="Total Balance" value={displaySummary.totalCashBalance + displaySummary.totalBankBalance} icon="account_balance_wallet" variant="primary" subtitle="Cash + Bank" />
                <StatCard title="Today's Sales" value={displaySummary.todaySales} icon="trending_up" variant="success" trend={{ value: 12, positive: true }} />
                <StatCard title="Monthly Profit" value={displaySummary.monthlyProfit} icon="payments" variant="success" />
                <StatCard title="To Receive" value={displaySummary.receivables} icon="call_received" variant="warning" subtitle="Outstanding" />
                <StatCard title="To Pay" value={displaySummary.payables} icon="call_made" variant="error" subtitle="Outstanding" />
                <StatCard title="GST Payable" value={displaySummary.taxDue} icon="receipt" variant="tertiary" subtitle="This quarter" />
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-warning)', fontSize: '20px' }}>bolt</span>
                    Quick Actions
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <QuickAction icon="receipt_long" label="New Sale" to="/sales" color="#10b981" />
                    <QuickAction icon="shopping_cart" label="Purchase" to="/purchases" color="#3b82f6" />
                    <QuickAction icon="person_add" label="Add Party" to="/parties" color="#8b5cf6" />
                    <QuickAction icon="payments" label="Expense" to="/expenses" color="#f43f5e" />
                    <QuickAction icon="account_balance" label="Cash Entry" to="/cash-bank" color="#f59e0b" />
                    <QuickAction icon="analytics" label="Reports" to="/reports" color="#ec4899" />
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--md-sys-spacing-md)', marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)', fontSize: '20px' }}>bar_chart</span>
                        Weekly Overview
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={weeklyData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--md-sys-color-on-surface-variant)" fontSize={11} />
                            <YAxis stroke="var(--md-sys-color-on-surface-variant)" fontSize={11} tickFormatter={(v) => `₹${v / 1000}K`} />
                            <Tooltip formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, '']}
                                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '12px', boxShadow: 'var(--md-sys-elevation-2)' }} />
                            <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="purchases" name="Purchases" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-error)', fontSize: '20px' }}>pie_chart</span>
                        Expenses
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                {expenseBreakdown.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toLocaleString('en-IN')}`} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                        {expenseBreakdown.map(item => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                <span className="text-label-medium">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            <div className="card" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-success)', fontSize: '20px' }}>show_chart</span>
                    Revenue Trend
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyTrend}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7bdff2" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7bdff2" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--md-sys-color-on-surface-variant)" fontSize={11} />
                        <YAxis stroke="var(--md-sys-color-on-surface-variant)" fontSize={11} tickFormatter={(v) => `₹${v / 1000}K`} />
                        <Tooltip formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Area type="monotone" dataKey="amount" stroke="#7bdff2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Cash & Bank Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--md-sys-spacing-md)' }}>
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-success)', fontSize: '20px' }}>payments</span>
                        Cash Summary
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '14px' }}>
                        <div>
                            <div className="text-label-medium text-muted">Cash in Hand</div>
                            <div className="text-headline-medium text-success">₹{displaySummary.totalCashBalance.toLocaleString('en-IN')}</div>
                        </div>
                        <Link to="/cash-bank" className="btn btn-outlined" style={{ fontSize: '0.75rem', padding: '6px 14px', minHeight: '36px' }}>View →</Link>
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-title-large" style={{ marginBottom: 'var(--md-sys-spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded" style={{ color: 'var(--md-sys-color-primary)', fontSize: '20px' }}>account_balance</span>
                        Bank Summary
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '14px' }}>
                        <div>
                            <div className="text-label-medium text-muted">Bank Balance</div>
                            <div className="text-headline-medium text-primary">₹{displaySummary.totalBankBalance.toLocaleString('en-IN')}</div>
                        </div>
                        <Link to="/cash-bank" className="btn btn-outlined" style={{ fontSize: '0.75rem', padding: '6px 14px', minHeight: '36px' }}>View →</Link>
                    </div>
                </div>
            </div>

            <Link to="/sales" className="fab" title="New Sale">
                <span className="material-symbols-rounded" style={{ fontSize: '26px' }}>add</span>
            </Link>
        </div>
    );
}
