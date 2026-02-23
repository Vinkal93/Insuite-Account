import Dexie, { type EntityTable } from 'dexie';
import type {
    Company,
    Party,
    Account,
    Product,
    Invoice,
    Purchase,
    ExpenseCategory,
    Expense,
    Transaction,
    AppSettings
} from '../types';

// Database class
class InSuiteDatabase extends Dexie {
    company!: EntityTable<Company, 'id'>;
    parties!: EntityTable<Party, 'id'>;
    accounts!: EntityTable<Account, 'id'>;
    products!: EntityTable<Product, 'id'>;
    invoices!: EntityTable<Invoice, 'id'>;
    purchases!: EntityTable<Purchase, 'id'>;
    expenseCategories!: EntityTable<ExpenseCategory, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    transactions!: EntityTable<Transaction, 'id'>;
    settings!: EntityTable<AppSettings, 'id'>;

    constructor() {
        super('InSuiteAccounts');

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
    }
}

// Create database instance
export const db = new InSuiteDatabase();

// Initialize default data
export async function initializeDatabase() {
    // Check if settings exist
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
        await db.settings.add({
            theme: 'light',
            currency: 'INR',
            currencySymbol: '₹',
            dateFormat: 'DD/MM/YYYY',
            autoBackup: true,
            backupFrequency: 'weekly'
        });
    }

    // Check if default accounts exist
    const accountsCount = await db.accounts.count();
    if (accountsCount === 0) {
        await db.accounts.bulkAdd([
            {
                name: 'Cash',
                type: 'cash',
                balance: 0,
                isDefault: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Bank Account',
                type: 'bank',
                bankName: 'Your Bank',
                balance: 0,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    }

    // Check if expense categories exist
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
            { name: 'Miscellaneous', icon: '📦', color: '#90A4AE' }
        ]);
    }
}

// Helper functions
export async function getSettings(): Promise<AppSettings | undefined> {
    return db.settings.toCollection().first();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const existing = await getSettings();
    if (existing?.id) {
        await db.settings.update(existing.id, settings);
    }
}

export async function getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get account balances
    const accounts = await db.accounts.toArray();
    const totalCashBalance = accounts
        .filter(a => a.type === 'cash')
        .reduce((sum, a) => sum + a.balance, 0);
    const totalBankBalance = accounts
        .filter(a => a.type === 'bank')
        .reduce((sum, a) => sum + a.balance, 0);

    // Get today's sales
    const todayInvoices = await db.invoices
        .where('invoiceDate')
        .aboveOrEqual(today)
        .toArray();
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Get today's purchases
    const todayPurchases = await db.purchases
        .where('billDate')
        .aboveOrEqual(today)
        .toArray();
    const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

    // Get monthly data
    const monthlyInvoices = await db.invoices
        .where('invoiceDate')
        .aboveOrEqual(monthStart)
        .toArray();
    const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const monthlyPurchasesList = await db.purchases
        .where('billDate')
        .aboveOrEqual(monthStart)
        .toArray();
    const monthlyPurchases = monthlyPurchasesList.reduce((sum, p) => sum + p.grandTotal, 0);

    const monthlyExpensesList = await db.expenses
        .where('date')
        .aboveOrEqual(monthStart)
        .toArray();
    const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);

    // Calculate profit/loss
    const profit = monthlySales - monthlyPurchases - monthlyExpenses;

    // Get receivables (unpaid invoices)
    const unpaidInvoices = await db.invoices.where('isPaid').equals(0).toArray();
    const receivables = unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0);

    // Get payables (unpaid purchases)
    const unpaidPurchases = await db.purchases.where('isPaid').equals(0).toArray();
    const payables = unpaidPurchases.reduce((sum, p) => sum + (p.grandTotal - p.paidAmount), 0);

    // Calculate tax due
    const taxDue = monthlyInvoices.reduce((sum, inv) => sum + inv.totalTax, 0);

    return {
        totalCashBalance,
        totalBankBalance,
        todaySales,
        todayPurchases: todayPurchasesTotal,
        monthlyProfit: profit > 0 ? profit : 0,
        monthlyLoss: profit < 0 ? Math.abs(profit) : 0,
        receivables,
        payables,
        monthlyExpenses,
        taxDue
    };
}

export default db;
