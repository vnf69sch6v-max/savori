import { Timestamp } from 'firebase/firestore';

// ============ USER ============
export interface UserGamification {
    xp: number;
    level: number;
    points: number;
    currentStreak: number;
    longestStreak: number;
    badges: string[];
    achievementsUnlocked: string[];
    totalScans: number;
    totalExpenses: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface KitchenItem {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    category: 'appliance' | 'decoration' | 'companion' | 'food';
    rarity: Rarity;
    effect?: string;
}

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    createdAt: Timestamp;
    subscription: Subscription;
    settings: UserSettings;
    stats: UserStats;
    gamification?: UserGamification;
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
    longestStreak: number;
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
    paymentMethod?: 'card' | 'blik' | 'cash' | 'transfer' | 'other';
    pending?: boolean;      // Transaction pending/processing
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


// ============ NOTIFICATIONS ============
export type NotificationType =
    | 'achievement'
    | 'streak_warning'
    | 'streak_restored'
    | 'budget_alert'
    | 'insight'
    | 'daily_reminder'
    | 'system';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    emoji?: string;
    read: boolean;
    createdAt: Timestamp;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}


// ============ SAVE NOW BUY LATER (SNBL) ============
export interface MerchantBoost {
    merchantId: string;
    percentage: number;
    triggeredAt: Timestamp;
    amount: number;
}

export interface SNBLProduct {
    id: string;
    name: string;
    price: number; // in grosz
    merchantId: string;
    merchantName: string;
    imageUrl: string;
    category: string;
    boosts: { typeLabel: string; value: number }[];
    affiliateUrl?: string;
}

export interface SNBLGoal {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    productImageUrl?: string;
    targetAmount: number;
    currentAmount: number;
    merchantBoosts: MerchantBoost[];
    status: 'saving' | 'ready' | 'purchased';
    createdAt: Timestamp;
    predictedCompletion?: Timestamp;
}

// ============ IMPULSE CONTROL ============
export interface ImpulseLock {
    id: string;
    userId: string;
    amount: number;
    reason: string;
    lockedAt: Timestamp;
    unlocksAt: Timestamp;
    status: 'locked' | 'released' | 'cancelled';
    outcome?: 'purchased' | 'saved';
}

// ============ EVENT SOURCING ============
export interface TransactionEvent {
    id: string;
    type: 'TRANSACTION_INITIATED' | 'TRANSACTION_AUTHORIZED' |
    'TRANSACTION_CLEARED' | 'TRANSACTION_FAILED';
    payload: Record<string, unknown>;
    timestamp: Timestamp;
    version: number;
}
