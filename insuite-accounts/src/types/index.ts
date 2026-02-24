// Database Types for InSuite Accounts — Tally-Like System

// ═══════════════════════════════════════════════════════════
// COMPANY & FINANCIAL YEAR
// ═══════════════════════════════════════════════════════════

export interface Company {
    id?: number;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone?: string;
    email?: string;
    website?: string;
    gstin?: string;
    pan?: string;
    logo?: string; // base64
    baseCurrency: string;
    currencySymbol: string;
    booksBeginningDate: string; // ISO date
    createdAt: Date;
    updatedAt: Date;
}

export interface FinancialYear {
    id?: number;
    companyId: number;
    label: string;        // e.g. "2025-26"
    startDate: string;    // ISO date
    endDate: string;      // ISO date
    isClosed: boolean;
    isFrozen: boolean;
    createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// LEDGER GROUPS & LEDGERS (Proper CR/DR Accounting)
// ═══════════════════════════════════════════════════════════

export type LedgerGroupNature = 'assets' | 'liabilities' | 'income' | 'expense' | 'equity';

export interface LedgerGroup {
    id?: number;
    companyId: number;
    name: string;
    parentId?: number;        // For sub-groups
    nature: LedgerGroupNature;
    isDefault: boolean;       // System-created, cannot be deleted
    affectsGrossProfit: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

// Default group names (used as constants)
export const DEFAULT_LEDGER_GROUPS = [
    { name: 'Capital Account', nature: 'equity' as const, affectsGrossProfit: false, sortOrder: 1 },
    { name: 'Reserves & Surplus', nature: 'equity' as const, affectsGrossProfit: false, sortOrder: 2 },
    { name: 'Current Assets', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 3 },
    { name: 'Fixed Assets', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 4 },
    { name: 'Investments', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 5 },
    { name: 'Current Liabilities', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 6 },
    { name: 'Loans (Liability)', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 7 },
    { name: 'Secured Loans', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 8 },
    { name: 'Unsecured Loans', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 9 },
    { name: 'Sundry Debtors', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 10 },
    { name: 'Sundry Creditors', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 11 },
    { name: 'Bank Accounts', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 12 },
    { name: 'Cash-in-Hand', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 13 },
    { name: 'Bank OD A/c', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 14 },
    { name: 'Deposits (Asset)', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 15 },
    { name: 'Stock-in-Hand', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 16 },
    { name: 'Direct Income', nature: 'income' as const, affectsGrossProfit: true, sortOrder: 17 },
    { name: 'Sales Accounts', nature: 'income' as const, affectsGrossProfit: true, sortOrder: 18 },
    { name: 'Direct Expenses', nature: 'expense' as const, affectsGrossProfit: true, sortOrder: 19 },
    { name: 'Purchase Accounts', nature: 'expense' as const, affectsGrossProfit: true, sortOrder: 20 },
    { name: 'Indirect Income', nature: 'income' as const, affectsGrossProfit: false, sortOrder: 21 },
    { name: 'Indirect Expenses', nature: 'expense' as const, affectsGrossProfit: false, sortOrder: 22 },
    { name: 'Duties & Taxes', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 23 },
    { name: 'Provisions', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 24 },
    { name: 'Suspense A/c', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 25 },
    { name: 'Misc. Expenses (ASSET)', nature: 'assets' as const, affectsGrossProfit: false, sortOrder: 26 },
    { name: 'Branch / Divisions', nature: 'liabilities' as const, affectsGrossProfit: false, sortOrder: 27 },
];

export interface Ledger {
    id?: number;
    companyId: number;
    name: string;
    groupId: number;        // Under which LedgerGroup
    openingBalance: number;
    balanceType: 'Dr' | 'Cr';
    currentBalance: number;
    currentBalanceType: 'Dr' | 'Cr';
    // GST Info
    gstApplicable: boolean;
    gstin?: string;
    gstType?: 'regular' | 'composition' | 'unregistered';
    // Contact Info
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    pan?: string;
    phone?: string;
    email?: string;
    // Bank Info (for Bank Account ledgers)
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    // Credit
    creditLimit?: number;
    creditDays?: number;
    // Meta
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// INVENTORY — Stock Groups, Units, Stock Items
// ═══════════════════════════════════════════════════════════

export interface StockGroup {
    id?: number;
    companyId: number;
    name: string;
    parentId?: number;    // For sub-groups
    isDefault: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export const DEFAULT_STOCK_GROUPS = [
    { name: 'Primary', sortOrder: 1 },
    { name: 'Raw Materials', sortOrder: 2 },
    { name: 'Finished Goods', sortOrder: 3 },
    { name: 'Semi-Finished Goods', sortOrder: 4 },
    { name: 'Consumables', sortOrder: 5 },
    { name: 'Packing Materials', sortOrder: 6 },
    { name: 'Electronics', sortOrder: 7 },
    { name: 'Spare Parts', sortOrder: 8 },
];

export type UnitType = 'simple' | 'compound';

export interface Unit {
    id?: number;
    companyId: number;
    type: UnitType;
    symbol: string;          // e.g. "Nos", "Kg", "Box"
    formalName: string;       // e.g. "Numbers", "Kilograms", "Boxes"
    decimalPlaces: number;    // 0, 2, 3 etc.
    // Compound unit fields
    baseUnitId?: number;      // e.g. Nos
    conversionFactor?: number; // e.g. 10 (1 Box = 10 Nos)
    isDefault: boolean;
    createdAt: Date;
}

export const DEFAULT_UNITS: Omit<Unit, 'id' | 'companyId' | 'createdAt'>[] = [
    { type: 'simple', symbol: 'Nos', formalName: 'Numbers', decimalPlaces: 0, isDefault: true },
    { type: 'simple', symbol: 'Kg', formalName: 'Kilograms', decimalPlaces: 3, isDefault: true },
    { type: 'simple', symbol: 'Ltr', formalName: 'Litres', decimalPlaces: 3, isDefault: true },
    { type: 'simple', symbol: 'Mtr', formalName: 'Metres', decimalPlaces: 2, isDefault: true },
    { type: 'simple', symbol: 'Pcs', formalName: 'Pieces', decimalPlaces: 0, isDefault: true },
    { type: 'simple', symbol: 'Set', formalName: 'Sets', decimalPlaces: 0, isDefault: true },
    { type: 'simple', symbol: 'Pair', formalName: 'Pairs', decimalPlaces: 0, isDefault: true },
    { type: 'simple', symbol: 'Gm', formalName: 'Grams', decimalPlaces: 3, isDefault: true },
    { type: 'simple', symbol: 'Sqft', formalName: 'Square Feet', decimalPlaces: 2, isDefault: true },
];

export interface StockItem {
    id?: number;
    companyId: number;
    name: string;
    groupId: number;         // Under which StockGroup
    unitId: number;          // Unit of measurement
    openingQuantity: number;
    openingRate: number;
    openingValue: number;    // qty * rate
    currentStock: number;
    // Tax
    gstRate: number;         // 0, 5, 12, 18, 28
    hsnCode?: string;
    // Pricing
    salePrice: number;
    purchasePrice: number;
    mrp?: number;
    // Alerts
    minimumStock?: number;
    reorderLevel?: number;
    // Barcode
    barcode?: string;
    // Description
    description?: string;
    partNumber?: string;
    // Meta
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// VOUCHER SYSTEM (Tally-like)
// ═══════════════════════════════════════════════════════════

export type VoucherType =
    | 'sales'
    | 'purchase'
    | 'payment'
    | 'receipt'
    | 'contra'
    | 'journal'
    | 'debit_note'
    | 'credit_note';

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
    sales: 'Sales',
    purchase: 'Purchase',
    payment: 'Payment',
    receipt: 'Receipt',
    contra: 'Contra',
    journal: 'Journal',
    debit_note: 'Debit Note',
    credit_note: 'Credit Note',
};

export interface Voucher {
    id?: number;
    companyId: number;
    fyId: number;
    voucherType: VoucherType;
    voucherNumber: string;
    date: string;          // ISO date
    partyLedgerId?: number;
    narration?: string;
    referenceNumber?: string;
    // Totals
    totalDebit: number;
    totalCredit: number;
    amount: number;
    // GST
    isGstVoucher: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    // Items (for sales/purchase)
    items: VoucherItem[];
    // Entries (Dr/Cr lines)
    entries: VoucherEntry[];
    // Status
    isLocked: boolean;
    isCancelled: boolean;
    // Audit
    createdBy?: number;    // userId
    modifiedBy?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface VoucherEntry {
    ledgerId: number;
    ledgerName?: string;   // Denormalized for display
    type: 'Dr' | 'Cr';
    amount: number;
}

export interface VoucherItem {
    stockItemId?: number;
    stockItemName?: string;
    description?: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    rate: number;
    discount: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

// ═══════════════════════════════════════════════════════════
// USER & ROLES
// ═══════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'accountant' | 'data_entry' | 'viewer';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Admin',
    accountant: 'Accountant',
    data_entry: 'Data Entry Operator',
    viewer: 'Viewer',
};

export interface UserPermissions {
    canCreateCompany: boolean;
    canDeleteCompany: boolean;
    canCreateVoucher: boolean;
    canEditVoucher: boolean;
    canDeleteVoucher: boolean;
    canViewReports: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
    canBackupRestore: boolean;
    canLockEntries: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
    admin: {
        canCreateCompany: true, canDeleteCompany: true, canCreateVoucher: true,
        canEditVoucher: true, canDeleteVoucher: true, canViewReports: true,
        canExportData: true, canManageUsers: true, canBackupRestore: true, canLockEntries: true,
    },
    accountant: {
        canCreateCompany: false, canDeleteCompany: false, canCreateVoucher: true,
        canEditVoucher: true, canDeleteVoucher: false, canViewReports: true,
        canExportData: true, canManageUsers: false, canBackupRestore: false, canLockEntries: false,
    },
    data_entry: {
        canCreateCompany: false, canDeleteCompany: false, canCreateVoucher: true,
        canEditVoucher: false, canDeleteVoucher: false, canViewReports: false,
        canExportData: false, canManageUsers: false, canBackupRestore: false, canLockEntries: false,
    },
    viewer: {
        canCreateCompany: false, canDeleteCompany: false, canCreateVoucher: false,
        canEditVoucher: false, canDeleteVoucher: false, canViewReports: true,
        canExportData: false, canManageUsers: false, canBackupRestore: false, canLockEntries: false,
    },
};

export interface User {
    id?: number;
    companyId: number;
    name: string;
    username: string;
    passwordHash: string;  // SHA-256 hashed
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// AUDIT & BACKUP
// ═══════════════════════════════════════════════════════════

export type AuditAction = 'create' | 'update' | 'delete' | 'lock' | 'unlock' | 'login' | 'logout';

export interface AuditLog {
    id?: number;
    companyId: number;
    userId?: number;
    userName?: string;
    action: AuditAction;
    entityType: string;    // 'voucher', 'ledger', 'stock_item', etc.
    entityId?: number;
    entityName?: string;
    oldValue?: string;     // JSON
    newValue?: string;     // JSON
    description: string;
    timestamp: Date;
}

export interface BackupLog {
    id?: number;
    companyId: number;
    fyId?: number;
    fileName: string;
    fileSize: number;
    isEncrypted: boolean;
    backupType: 'manual' | 'auto';
    timestamp: Date;
}

// ═══════════════════════════════════════════════════════════
// APP SETTINGS
// ═══════════════════════════════════════════════════════════

export interface AppSettings {
    id?: number;
    theme: 'light' | 'dark' | 'system';
    colorTheme?: 'frosted' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'rose' | 'monochrome';
    buttonStyle?: 'solid' | 'gradient';
    customColor?: string;
    viewMode: 'normal' | 'classic';  // Classic = Tally gateway
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    lastBackup?: Date;
    activeCompanyId?: number;
    activeFyId?: number;
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

export interface DashboardSummary {
    totalCashBalance: number;
    totalBankBalance: number;
    todaySales: number;
    todayPurchases: number;
    monthlyProfit: number;
    monthlyLoss: number;
    monthlySales: number;
    monthlyPurchases: number;
    receivables: number;
    payables: number;
    monthlyExpenses: number;
    taxDue: number;
    gstPayable: number;
}

// ═══════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY (kept for migration)
// ═══════════════════════════════════════════════════════════

export type PartyType = 'customer' | 'vendor' | 'both';
export type AccountType = 'cash' | 'bank';
export type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'proforma';
export type TransactionType = 'cash_in' | 'cash_out' | 'bank_deposit' | 'bank_withdrawal' | 'transfer';

export interface Party {
    id?: number;
    name: string;
    type: PartyType;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    openingBalance: number;
    balanceType: 'dr' | 'cr';
    createdAt: Date;
    updatedAt: Date;
}

export interface Account {
    id?: number;
    name: string;
    type: AccountType;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    balance: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id?: number;
    name: string;
    hsn?: string;
    unit: string;
    salePrice: number;
    purchasePrice: number;
    gstRate: number;
    stock: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Invoice {
    id?: number;
    invoiceNumber: string;
    invoiceType: InvoiceType;
    partyId: number;
    invoiceDate: Date;
    dueDate?: Date;
    items: InvoiceItem[];
    subtotal: number;
    discountType: 'percent' | 'amount';
    discountValue: number;
    discountAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
    roundOff: number;
    notes?: string;
    isPaid: boolean;
    paidAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    productId?: number;
    description: string;
    hsn?: string;
    quantity: number;
    unit: string;
    rate: number;
    discountPercent: number;
    discountAmount: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export interface Purchase {
    id?: number;
    billNumber: string;
    partyId: number;
    billDate: Date;
    dueDate?: Date;
    items: PurchaseItem[];
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
    isPaid: boolean;
    paidAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PurchaseItem {
    productId?: number;
    description: string;
    hsn?: string;
    quantity: number;
    unit: string;
    rate: number;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export interface ExpenseCategory {
    id?: number;
    name: string;
    icon?: string;
    color?: string;
}

export interface Expense {
    id?: number;
    categoryId: number;
    accountId: number;
    amount: number;
    date: Date;
    description: string;
    billImage?: string;
    isRecurring: boolean;
    recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id?: number;
    type: TransactionType;
    fromAccountId?: number;
    toAccountId?: number;
    partyId?: number;
    invoiceId?: number;
    purchaseId?: number;
    expenseId?: number;
    amount: number;
    date: Date;
    description: string;
    reference?: string;
    createdAt: Date;
}
