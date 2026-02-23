// Database Types for InSuite Accounts

export interface Company {
    id?: number;
    name: string;
    gstin?: string;
    pan?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
    email?: string;
    logo?: string;
    bankName?: string;
    bankAccount?: string;
    bankIfsc?: string;
    financialYearStart: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PartyType = 'customer' | 'vendor' | 'both';

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

export type AccountType = 'cash' | 'bank';

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

export type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'proforma';

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

export type TransactionType = 'cash_in' | 'cash_out' | 'bank_deposit' | 'bank_withdrawal' | 'transfer';

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

export interface AppSettings {
    id?: number;
    theme: 'light' | 'dark' | 'system';
    colorTheme?: 'frosted' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'rose' | 'monochrome';
    buttonStyle?: 'solid' | 'gradient';
    customColor?: string;
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    lastBackup?: Date;
}

// Dashboard Summary Types
export interface DashboardSummary {
    totalCashBalance: number;
    totalBankBalance: number;
    todaySales: number;
    todayPurchases: number;
    monthlyProfit: number;
    monthlyLoss: number;
    receivables: number;
    payables: number;
    monthlyExpenses: number;
    taxDue: number;
}
