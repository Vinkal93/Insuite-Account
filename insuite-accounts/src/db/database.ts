import Dexie, { type EntityTable } from 'dexie';
import type {
    Company, FinancialYear, LedgerGroup, Ledger,
    StockGroup, Unit, StockItem, Voucher,
    User, AuditLog, BackupLog, AppSettings,
    // Legacy
    Party, Account, Product, Invoice, Purchase,
    ExpenseCategory, Expense, Transaction
} from '../types';
import {
    DEFAULT_LEDGER_GROUPS, DEFAULT_STOCK_GROUPS, DEFAULT_UNITS
} from '../types';

// ═══════════════════════════════════════════════════════════
// DATABASE CLASS
// ═══════════════════════════════════════════════════════════

class InSuiteDatabase extends Dexie {
    // New tables
    companies!: EntityTable<Company, 'id'>;
    financialYears!: EntityTable<FinancialYear, 'id'>;
    ledgerGroups!: EntityTable<LedgerGroup, 'id'>;
    ledgers!: EntityTable<Ledger, 'id'>;
    stockGroups!: EntityTable<StockGroup, 'id'>;
    units!: EntityTable<Unit, 'id'>;
    stockItems!: EntityTable<StockItem, 'id'>;
    vouchers!: EntityTable<Voucher, 'id'>;
    users!: EntityTable<User, 'id'>;
    auditLogs!: EntityTable<AuditLog, 'id'>;
    backupLogs!: EntityTable<BackupLog, 'id'>;
    settings!: EntityTable<AppSettings, 'id'>;

    // Legacy tables (kept for backward compat)
    company!: EntityTable<Company, 'id'>;
    parties!: EntityTable<Party, 'id'>;
    accounts!: EntityTable<Account, 'id'>;
    products!: EntityTable<Product, 'id'>;
    invoices!: EntityTable<Invoice, 'id'>;
    purchases!: EntityTable<Purchase, 'id'>;
    expenseCategories!: EntityTable<ExpenseCategory, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    transactions!: EntityTable<Transaction, 'id'>;

    constructor() {
        super('InSuiteAccounts');

        // Version 1: Legacy schema
        this.version(1).stores({
            company: '++id, name, gstin',
            parties: '++id, name, type, gstin, phone',
            accounts: '++id, name, type, isDefault',
            products: '++id, name, hsn',
            invoices: '++id, invoiceNumber, partyId, invoiceDate, invoiceType, isPaid',
            purchases: '++id, billNumber, partyId, billDate, isPaid',
            expenseCategories: '++id, name',
            expenses: '++id, categoryId, accountId, date',
            transactions: '++id, type, date, partyId, invoiceId, purchaseId',
            settings: '++id'
        });

        // Version 2: New schema — Multi-company, CR/DR, Inventory
        this.version(2).stores({
            // Legacy tables (kept)
            company: '++id, name, gstin',
            parties: '++id, name, type, gstin, phone',
            accounts: '++id, name, type, isDefault',
            products: '++id, name, hsn',
            invoices: '++id, invoiceNumber, partyId, invoiceDate, invoiceType, isPaid',
            purchases: '++id, billNumber, partyId, billDate, isPaid',
            expenseCategories: '++id, name',
            expenses: '++id, categoryId, accountId, date',
            transactions: '++id, type, date, partyId, invoiceId, purchaseId',
            settings: '++id',

            // New tables
            companies: '++id, name, gstin, pan',
            financialYears: '++id, companyId, label, startDate, endDate, isClosed',
            ledgerGroups: '++id, companyId, name, parentId, nature, isDefault, sortOrder',
            ledgers: '++id, companyId, name, groupId, isActive, gstin',
            stockGroups: '++id, companyId, name, parentId, isDefault',
            units: '++id, companyId, symbol, type, isDefault',
            stockItems: '++id, companyId, name, groupId, unitId, barcode, hsnCode, isActive',
            vouchers: '++id, companyId, fyId, voucherType, voucherNumber, date, partyLedgerId, isLocked',
            users: '++id, companyId, username, role, isActive',
            auditLogs: '++id, companyId, userId, action, entityType, entityId, timestamp',
            backupLogs: '++id, companyId, timestamp',
        });

        // Version 3: Add companyId index to legacy tables for export/query
        this.version(3).stores({
            // Legacy tables WITH companyId index
            company: '++id, name, gstin',
            parties: '++id, companyId, name, type, gstin, phone',
            accounts: '++id, name, type, isDefault',
            products: '++id, companyId, name, hsn',
            invoices: '++id, companyId, invoiceNumber, partyId, invoiceDate, invoiceType, isPaid',
            purchases: '++id, companyId, billNumber, partyId, billDate, isPaid',
            expenseCategories: '++id, name',
            expenses: '++id, companyId, categoryId, accountId, date',
            transactions: '++id, companyId, type, date, partyId, invoiceId, purchaseId',
            settings: '++id',

            // New tables (unchanged)
            companies: '++id, name, gstin, pan',
            financialYears: '++id, companyId, label, startDate, endDate, isClosed',
            ledgerGroups: '++id, companyId, name, parentId, nature, isDefault, sortOrder',
            ledgers: '++id, companyId, name, groupId, isActive, gstin',
            stockGroups: '++id, companyId, name, parentId, isDefault',
            units: '++id, companyId, symbol, type, isDefault',
            stockItems: '++id, companyId, name, groupId, unitId, barcode, hsnCode, isActive',
            vouchers: '++id, companyId, fyId, voucherType, voucherNumber, date, partyLedgerId, isLocked',
            users: '++id, companyId, username, role, isActive',
            auditLogs: '++id, companyId, userId, action, entityType, entityId, timestamp',
            backupLogs: '++id, companyId, timestamp',
        });
    }
}

// Create database instance
export const db = new InSuiteDatabase();

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

export async function initializeDatabase() {
    // Initialize settings if not present
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
        await db.settings.add({
            theme: 'light',
            viewMode: 'normal',
            currency: 'INR',
            currencySymbol: '₹',
            dateFormat: 'DD/MM/YYYY',
            autoBackup: true,
            backupFrequency: 'weekly'
        });
    }

    // Legacy: Initialize default accounts if needed
    const accountsCount = await db.accounts.count();
    if (accountsCount === 0) {
        await db.accounts.bulkAdd([
            { name: 'Cash', type: 'cash', balance: 0, isDefault: true, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Bank Account', type: 'bank', bankName: 'Your Bank', balance: 0, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ]);
    }

    // Legacy: Initialize expense categories
    const categoriesCount = await db.expenseCategories.count();
    if (categoriesCount === 0) {
        await db.expenseCategories.bulkAdd([
            { name: 'Rent', icon: '🏠', color: '#E57373' },
            { name: 'Electricity', icon: '⚡', color: '#FFB74D' },
            { name: 'Internet', icon: '🌐', color: '#64B5F6' },
            { name: 'Salary', icon: '💰', color: '#81C784' },
            { name: 'Transport', icon: '🚗', color: '#BA68C8' },
            { name: 'Office Supplies', icon: '📎', color: '#4DB6AC' },
            { name: 'Marketing', icon: '📢', color: '#FF8A65' },
            { name: 'Miscellaneous', icon: '📦', color: '#90A4AE' },
        ]);
    }
}

// ═══════════════════════════════════════════════════════════
// COMPANY MANAGEMENT
// ═══════════════════════════════════════════════════════════

export async function createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    const companyId = await db.companies.add({
        ...companyData,
        createdAt: now,
        updatedAt: now,
    } as Company) as number;

    // Create default FY
    const fyStartDate = companyData.booksBeginningDate;
    const startYear = new Date(fyStartDate).getFullYear();
    const startMonth = new Date(fyStartDate).getMonth();
    const fyEndYear = startMonth >= 3 ? startYear + 1 : startYear;
    const fyLabel = startMonth >= 3
        ? `${startYear}-${(fyEndYear % 100).toString().padStart(2, '0')}`
        : `${startYear - 1}-${(startYear % 100).toString().padStart(2, '0')}`;

    await db.financialYears.add({
        companyId: companyId,
        label: fyLabel,
        startDate: startMonth >= 3
            ? `${startYear}-04-01`
            : `${startYear - 1}-04-01`,
        endDate: startMonth >= 3
            ? `${fyEndYear}-03-31`
            : `${startYear}-03-31`,
        isClosed: false,
        isFrozen: false,
        createdAt: now,
    });

    // Seed default ledger groups
    await seedDefaultLedgerGroups(companyId!);

    // Seed default stock groups
    await seedDefaultStockGroups(companyId!);

    // Seed default units
    await seedDefaultUnits(companyId!);

    // Create default Cash-in-Hand and Profit & Loss ledgers
    const cashGroup = await db.ledgerGroups
        .where({ companyId: companyId!, name: 'Cash-in-Hand' })
        .first();
    if (cashGroup?.id) {
        await db.ledgers.add({
            companyId: companyId!,
            name: 'Cash',
            groupId: cashGroup.id,
            openingBalance: 0,
            balanceType: 'Dr',
            currentBalance: 0,
            currentBalanceType: 'Dr',
            gstApplicable: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Create Profit & Loss A/c ledger
    const directIncomeGroup = await db.ledgerGroups
        .where({ companyId, name: 'Direct Income' })
        .first();
    if (directIncomeGroup?.id) {
        await db.ledgers.add({
            companyId: companyId!,
            name: 'Sales Account',
            groupId: directIncomeGroup.id,
            openingBalance: 0,
            balanceType: 'Cr',
            currentBalance: 0,
            currentBalanceType: 'Cr',
            gstApplicable: true,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    const purchaseGroup = await db.ledgerGroups
        .where({ companyId, name: 'Purchase Accounts' })
        .first();
    if (purchaseGroup?.id) {
        await db.ledgers.add({
            companyId: companyId!,
            name: 'Purchase Account',
            groupId: purchaseGroup.id,
            openingBalance: 0,
            balanceType: 'Dr',
            currentBalance: 0,
            currentBalanceType: 'Dr',
            gstApplicable: true,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Update settings with active company
    const settings = await getSettings();
    if (settings?.id) {
        await db.settings.update(settings.id, { activeCompanyId: companyId });
    }

    return companyId!;
}

export async function deleteCompany(companyId: number) {
    await db.transaction('rw',
        [db.companies, db.financialYears, db.ledgerGroups, db.ledgers,
        db.stockGroups, db.units, db.stockItems, db.vouchers,
        db.users, db.auditLogs, db.backupLogs],
        async () => {
            await db.financialYears.where({ companyId }).delete();
            await db.ledgerGroups.where({ companyId }).delete();
            await db.ledgers.where({ companyId }).delete();
            await db.stockGroups.where({ companyId }).delete();
            await db.units.where({ companyId }).delete();
            await db.stockItems.where({ companyId }).delete();
            await db.vouchers.where({ companyId }).delete();
            await db.users.where({ companyId }).delete();
            await db.auditLogs.where({ companyId }).delete();
            await db.backupLogs.where({ companyId }).delete();
            await db.companies.delete(companyId);
        }
    );
}

// ═══════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════

async function seedDefaultLedgerGroups(companyId: number) {
    const now = new Date();
    const groups = DEFAULT_LEDGER_GROUPS.map(g => ({
        companyId,
        name: g.name,
        nature: g.nature,
        affectsGrossProfit: g.affectsGrossProfit,
        isDefault: true,
        sortOrder: g.sortOrder,
        createdAt: now,
        updatedAt: now,
    }));
    await db.ledgerGroups.bulkAdd(groups as LedgerGroup[]);
}

async function seedDefaultStockGroups(companyId: number) {
    const now = new Date();
    const groups = DEFAULT_STOCK_GROUPS.map(g => ({
        companyId,
        name: g.name,
        isDefault: true,
        sortOrder: g.sortOrder,
        createdAt: now,
        updatedAt: now,
    }));
    await db.stockGroups.bulkAdd(groups as StockGroup[]);
}

async function seedDefaultUnits(companyId: number) {
    const now = new Date();
    const unitEntries = DEFAULT_UNITS.map(u => ({
        ...u,
        companyId,
        createdAt: now,
    }));
    await db.units.bulkAdd(unitEntries as Unit[]);
}

// ═══════════════════════════════════════════════════════════
// SETTINGS HELPERS
// ═══════════════════════════════════════════════════════════

export async function getSettings(): Promise<AppSettings | undefined> {
    return db.settings.toCollection().first();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const existing = await getSettings();
    if (existing?.id) {
        await db.settings.update(existing.id, settings);
    }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

export async function getDashboardSummary(companyId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // If new system has vouchers for this company
    if (companyId) {
        const allVouchers = await db.vouchers
            .where({ companyId })
            .toArray();

        const monthlyVouchers = allVouchers.filter(v => new Date(v.date) >= monthStart);
        const todayStr = today.toISOString().split('T')[0];
        const todayVouchers = allVouchers.filter(v => v.date === todayStr);

        const todaySales = todayVouchers.filter(v => v.voucherType === 'sales')
            .reduce((sum, v) => sum + v.amount, 0);
        const todayPurchases = todayVouchers.filter(v => v.voucherType === 'purchase')
            .reduce((sum, v) => sum + v.amount, 0);

        const monthlySales = monthlyVouchers.filter(v => v.voucherType === 'sales')
            .reduce((sum, v) => sum + v.amount, 0);
        const monthlyPurchases = monthlyVouchers.filter(v => v.voucherType === 'purchase')
            .reduce((sum, v) => sum + v.amount, 0);
        const monthlyExpenses = monthlyVouchers.filter(v => v.voucherType === 'payment')
            .reduce((sum, v) => sum + v.amount, 0);

        // Receivables: Sundry Debtors balance
        const debtorGroup = await db.ledgerGroups
            .where({ companyId, name: 'Sundry Debtors' })
            .first();
        let receivables = 0;
        if (debtorGroup?.id) {
            const debtorLedgers = await db.ledgers
                .where({ companyId, groupId: debtorGroup.id })
                .toArray();
            receivables = debtorLedgers.reduce((sum, l) =>
                sum + (l.currentBalanceType === 'Dr' ? l.currentBalance : -l.currentBalance), 0);
        }

        // Payables: Sundry Creditors balance
        const creditorGroup = await db.ledgerGroups
            .where({ companyId, name: 'Sundry Creditors' })
            .first();
        let payables = 0;
        if (creditorGroup?.id) {
            const creditorLedgers = await db.ledgers
                .where({ companyId, groupId: creditorGroup.id })
                .toArray();
            payables = creditorLedgers.reduce((sum, l) =>
                sum + (l.currentBalanceType === 'Cr' ? l.currentBalance : -l.currentBalance), 0);
        }

        // Cash & Bank
        const cashGroup = await db.ledgerGroups
            .where({ companyId, name: 'Cash-in-Hand' })
            .first();
        let totalCashBalance = 0;
        if (cashGroup?.id) {
            const cashLedgers = await db.ledgers
                .where({ companyId, groupId: cashGroup.id })
                .toArray();
            totalCashBalance = cashLedgers.reduce((sum, l) => sum + l.currentBalance, 0);
        }

        const bankGroup = await db.ledgerGroups
            .where({ companyId, name: 'Bank Accounts' })
            .first();
        let totalBankBalance = 0;
        if (bankGroup?.id) {
            const bankLedgers = await db.ledgers
                .where({ companyId, groupId: bankGroup.id })
                .toArray();
            totalBankBalance = bankLedgers.reduce((sum, l) => sum + l.currentBalance, 0);
        }

        const profit = monthlySales - monthlyPurchases - monthlyExpenses;
        const taxDue = monthlyVouchers.reduce((sum, v) => sum + v.totalTax, 0);

        return {
            totalCashBalance,
            totalBankBalance,
            todaySales,
            todayPurchases,
            monthlyProfit: profit > 0 ? profit : 0,
            monthlyLoss: profit < 0 ? Math.abs(profit) : 0,
            monthlySales,
            monthlyPurchases,
            receivables,
            payables,
            monthlyExpenses,
            taxDue,
            gstPayable: taxDue,
        };
    }

    // Legacy fallback
    const accounts = await db.accounts.toArray();
    const totalCashBalance = accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
    const totalBankBalance = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);

    const todayInvoices = await db.invoices.where('invoiceDate').aboveOrEqual(today).toArray();
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const todayPurchasesList = await db.purchases.where('billDate').aboveOrEqual(today).toArray();
    const todayPurchasesTotal = todayPurchasesList.reduce((sum, p) => sum + p.grandTotal, 0);

    const monthlyInvoices = await db.invoices.where('invoiceDate').aboveOrEqual(monthStart).toArray();
    const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const monthlyPurchasesList = await db.purchases.where('billDate').aboveOrEqual(monthStart).toArray();
    const monthlyPurchases = monthlyPurchasesList.reduce((sum, p) => sum + p.grandTotal, 0);
    const monthlyExpensesList = await db.expenses.where('date').aboveOrEqual(monthStart).toArray();
    const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);

    const profit = monthlySales - monthlyPurchases - monthlyExpenses;
    const unpaidInvoices = await db.invoices.where('isPaid').equals(0).toArray();
    const receivables = unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0);
    const unpaidPurchases = await db.purchases.where('isPaid').equals(0).toArray();
    const payables = unpaidPurchases.reduce((sum, p) => sum + (p.grandTotal - p.paidAmount), 0);
    const taxDue = monthlyInvoices.reduce((sum, inv) => sum + inv.totalTax, 0);

    return {
        totalCashBalance,
        totalBankBalance,
        todaySales,
        todayPurchases: todayPurchasesTotal,
        monthlyProfit: profit > 0 ? profit : 0,
        monthlyLoss: profit < 0 ? Math.abs(profit) : 0,
        monthlySales,
        monthlyPurchases,
        receivables,
        payables,
        monthlyExpenses,
        taxDue,
        gstPayable: taxDue,
    };
}

export default db;
