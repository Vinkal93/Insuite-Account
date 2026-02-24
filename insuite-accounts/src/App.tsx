import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { ConfirmProvider } from './components/ConfirmModal';
import { ToastProvider } from './components/Toast';
import { ShortcutHelpOverlay, useKeyboardShortcuts } from './components/KeyboardShortcuts';
import { CommandPalette } from './components/CommandPalette';
import { initializeDatabase } from './db/database';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import CashBank from './pages/CashBank';
import Reports from './pages/Reports';
import GST from './pages/GST';
import Settings from './pages/Settings';
import CompanySetup from './pages/CompanySetup';
import LedgerGroups from './pages/LedgerGroups';
import Ledgers from './pages/Ledgers';
import StockGroups from './pages/StockGroups';
import Units from './pages/Units';
import StockItems from './pages/StockItems';
import './index.css';

function ShortcutHandler() {
    useKeyboardShortcuts();
    return null;
}

function CompanyGate({ children }: { children: React.ReactNode }) {
    const { activeCompany, loading } = useCompany();
    if (loading) return null;
    if (!activeCompany) return <Navigate to="/company-setup" replace />;
    return <>{children}</>;
}

function App() {
    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        initializeDatabase().then(() => setDbReady(true));
    }, []);

    if (!dbReady) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                height: '100vh', background: 'linear-gradient(135deg, #080e10 0%, #0d4a4f 50%, #1a5c5a 100%)',
                color: '#ffffff', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(123,223,242,0.15) 0%, transparent 70%)',
                    top: '30%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 3s ease-in-out infinite'
                }} />
                <div style={{
                    width: '72px', height: '72px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                    borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '24px',
                    boxShadow: '0 8px 40px rgba(139, 92, 246, 0.5)', animation: 'pulse 2s ease-in-out infinite',
                    position: 'relative', zIndex: 1
                }}>IS</div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>InSuite Accounts</h1>
                <p style={{ opacity: 0.5, fontSize: '0.875rem', position: 'relative', zIndex: 1 }}>Loading your business data...</p>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <CompanyProvider>
                <ConfirmProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <ShortcutHandler />
                            <ShortcutHelpOverlay />
                            <CommandPalette />
                            <Routes>
                                <Route path="/" element={<MainLayout />}>
                                    <Route index element={<CompanyGate><Dashboard /></CompanyGate>} />
                                    <Route path="ledger-groups" element={<CompanyGate><LedgerGroups /></CompanyGate>} />
                                    <Route path="ledgers" element={<CompanyGate><Ledgers /></CompanyGate>} />
                                    <Route path="stock-groups" element={<CompanyGate><StockGroups /></CompanyGate>} />
                                    <Route path="units" element={<CompanyGate><Units /></CompanyGate>} />
                                    <Route path="stock-items" element={<CompanyGate><StockItems /></CompanyGate>} />
                                    <Route path="parties" element={<CompanyGate><Parties /></CompanyGate>} />
                                    <Route path="products" element={<CompanyGate><Products /></CompanyGate>} />
                                    <Route path="sales" element={<CompanyGate><Sales /></CompanyGate>} />
                                    <Route path="purchases" element={<CompanyGate><Purchases /></CompanyGate>} />
                                    <Route path="expenses" element={<CompanyGate><Expenses /></CompanyGate>} />
                                    <Route path="cash-bank" element={<CompanyGate><CashBank /></CompanyGate>} />
                                    <Route path="reports" element={<CompanyGate><Reports /></CompanyGate>} />
                                    <Route path="gst" element={<CompanyGate><GST /></CompanyGate>} />
                                    <Route path="settings" element={<Settings />} />
                                    <Route path="company-setup" element={<CompanySetup />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </ToastProvider>
                </ConfirmProvider>
            </CompanyProvider>
        </ThemeProvider>
    );
}

export default App;
