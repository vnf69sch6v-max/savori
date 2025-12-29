import { Timestamp } from 'firebase/firestore';

// ============ USER ============
export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    createdAt: Timestamp;
    subscription: Subscription;
    settings: UserSettings;
    stats: UserStats;
    onboardingComplete?: boolean;
}

export interface Subscription {
    plan: 'free' | 'pro' | 'premium';
    stripeCustomerId?: string;
    validUntil?: Timestamp;
}

export interface UserSettings {
    currency: 'PLN' | 'EUR' | 'USD';
    language: 'pl' | 'en';
    darkMode: boolean;
    notifications: {
        daily: boolean;
        weekly: boolean;
        goals: boolean;
    };
}

export interface UserStats {
    totalSaved: number;       // w groszach
    totalExpenses: number;    // w groszach
    goalsCompleted: number;
    currentStreak: number;    // dni z rzędu
}

// ============ EXPENSES ============
export type ExpenseCategory =
    | 'groceries'
    | 'restaurants'
    | 'transport'
    | 'utilities'
    | 'entertainment'
    | 'shopping'
    | 'health'
    | 'education'
    | 'subscriptions'
    | 'other';

export interface Merchant {
    name: string;
    nip?: string;
    address?: string;
    category: ExpenseCategory;
}

export interface ExpenseItem {
    name: string;
    quantity: number;
    unitPrice: number;      // w groszach
    totalPrice: number;     // w groszach
    category?: string;
    vatRate?: number;       // 0, 5, 8, 23
}

export interface ExpenseMetadata {
    source: 'scan' | 'manual' | 'import';
    receiptUrl?: string;
    aiConfidence?: number;  // 0-1
    verified: boolean;
}

export interface SavingsRuleApplied {
    ruleId: string;
    amountSaved: number;    // w groszach
}

export interface Expense {
    id: string;
    userId: string;
    createdAt: Timestamp;
    date: Timestamp;
    merchant: Merchant;
    amount: number;         // w groszach
    currency: string;       // ISO 4217
    items?: ExpenseItem[];
    tags: string[];
    notes?: string;
    metadata: ExpenseMetadata;
    savingsRuleApplied?: SavingsRuleApplied;
}

// ============ GOALS ============
export type SavingRuleType = 'roundup' | 'percentage' | 'fixed' | 'trigger';

export interface TriggerCondition {
    type: 'category' | 'merchant' | 'amount';
    value: string;
    action: 'save_percent' | 'save_fixed';
    actionValue: number;
}

export interface SavingRule {
    id: string;
    type: SavingRuleType;
    enabled: boolean;

    // Dla roundup
    roundTo?: 1 | 5 | 10;

    // Dla percentage
    percentage?: number;

    // Dla fixed
    fixedAmount?: number;
    frequency?: 'daily' | 'weekly' | 'monthly';

    // Dla trigger
    triggerCondition?: TriggerCondition;
}

export interface Contribution {
    id: string;
    amount: number;         // w groszach
    date: Timestamp;
    source: 'manual' | 'rule' | 'bonus';
    ruleId?: string;
}

export interface SavingGoal {
    id: string;
    userId: string;
    createdAt: Timestamp;

    name: string;
    description?: string;
    emoji: string;
    imageUrl?: string;

    targetAmount: number;   // w groszach
    currentAmount: number;  // w groszach
    currency: string;

    deadline?: Timestamp;
    priority: 'low' | 'medium' | 'high';

    status: 'active' | 'completed' | 'paused' | 'cancelled';

    autoSaveRules: SavingRule[];
    contributions: Contribution[];

    predictedCompletion?: Timestamp;
    confidence?: number;
}

// ============ REPORTS ============
export interface CategoryStats {
    amount: number;
    count: number;
    percentChange: number;
}

export interface MerchantStats {
    name: string;
    amount: number;
    count: number;
}

export interface ProductStats {
    name: string;
    totalSpent: number;
    avgPrice: number;
    count: number;
}

export interface ReportTrends {
    avgDailyExpense: number;
    savingsRate: number;
    bestDay: string;
    worstDay: string;
}

export interface Report {
    period: string;         // '2024-W01', '2024-01', '2024-Q1', '2024'
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    totals: {
        expenses: number;
        saved: number;
        income?: number;
    };

    byCategory: Record<ExpenseCategory, CategoryStats>;
    topMerchants: MerchantStats[];
    topProducts: ProductStats[];
    trends: ReportTrends;
    aiInsights: string[];

    generatedAt: Timestamp;
}

// ============ UI STATE ============
export interface ExpenseFormData {
    merchant: string;
    amount: string;
    category: ExpenseCategory;
    date: Date;
    notes?: string;
    tags?: string[];
}

export interface GoalFormData {
    name: string;
    emoji: string;
    targetAmount: string;
    deadline?: Date;
    priority: 'low' | 'medium' | 'high';
}

// ============ BUDGETS ============
export interface CategoryBudget {
    limit: number;          // w groszach
    spent: number;          // w groszach - cache
    alertThreshold: number; // 0.8 = alert przy 80%
}

export interface Budget {
    id: string;
    userId: string;
    month: string;          // Format: "2024-12"

    // Globalne
    totalLimit: number;     // Całkowity limit (grosze)
    totalSpent: number;     // Wydane (grosze) - cache

    // Per kategoria
    categoryLimits: Partial<Record<ExpenseCategory, CategoryBudget>>;

    // Alerty
    alertsEnabled: boolean;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface BudgetFormData {
    totalLimit: string;
    categoryLimits: {
        category: ExpenseCategory;
        limit: string;
        alertThreshold: number;
    }[];
}

