/**
 * Savori AI Insights Engine
 * Generates real-time insights based on user spending patterns
 */

import { Timestamp } from 'firebase/firestore';
import { ExpenseCategory, Expense } from '@/types';
import { notificationService } from '@/lib/engagement/notifications';

// ============ TYPES ============

export type InsightType =
    | 'spending_spike'        // Nagły wzrost wydatków
    | 'recurring_detected'    // Wykryto cykliczny wydatek
    | 'overpaying'           // Przepłacasz vs średnia
    | 'budget_warning'       // Zbliżasz się do limitu
    | 'savings_opportunity'  // Możliwość oszczędności
    | 'unusual_merchant'     // Nowy/nietypowy sklep
    | 'pattern_change'       // Zmiana wzorca
    | 'achievement'          // Osiągnięcie
    | 'tip'                  // Porada
    | 'weekly_summary'       // Podsumowanie tygodnia
    | 'monthly_report'       // Raport miesięczny
    | 'streak_alert'         // Alert o streak
    | 'goal_progress';       // Postęp celu

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AIInsight {
    id: string;
    userId: string;
    type: InsightType;
    priority: InsightPriority;

    // Content
    title: string;
    message: string;
    emoji: string;

    // Action
    actionType?: 'navigate' | 'confirm' | 'dismiss';
    actionUrl?: string;
    actionLabel?: string;

    // Context
    relatedExpenseIds?: string[];
    relatedCategory?: ExpenseCategory;
    relatedMerchant?: string;

    // Metrics
    potentialSavings?: number;
    confidence: number;

    // Status
    status: 'new' | 'seen' | 'acted' | 'dismissed';
    createdAt: Date;
    seenAt?: Date;
    actedAt?: Date;
}

export interface UserSpendingProfile {
    avgDailySpending: number;
    avgWeeklySpending: number;
    avgMonthlySpending: number;
    topCategories: Array<{
        category: ExpenseCategory;
        total: number;
        percentage: number;
    }>;
}

// ============ INSIGHT TEMPLATES ============

const INSIGHT_TEMPLATES: Record<InsightType, { emoji: string; titleTemplate: string }> = {
    spending_spike: { emoji: '📈', titleTemplate: 'Wydatki wyższe niż zwykle' },
    recurring_detected: { emoji: '🔄', titleTemplate: 'Wykryto cykliczny wydatek' },
    overpaying: { emoji: '💸', titleTemplate: 'Możesz przepłacać' },
    budget_warning: { emoji: '⚠️', titleTemplate: 'Zbliżasz się do limitu' },
    savings_opportunity: { emoji: '💰', titleTemplate: 'Możliwość oszczędności' },
    unusual_merchant: { emoji: '🆕', titleTemplate: 'Nowy sklep' },
    pattern_change: { emoji: '📊', titleTemplate: 'Zmiana wzorca wydatków' },
    achievement: { emoji: '🏆', titleTemplate: 'Osiągnięcie odblokowane!' },
    tip: { emoji: '💡', titleTemplate: 'Porada' },
    weekly_summary: { emoji: '📅', titleTemplate: 'Podsumowanie tygodnia' },
    monthly_report: { emoji: '📊', titleTemplate: 'Raport miesięczny' },
    streak_alert: { emoji: '🔥', titleTemplate: 'Twój streak!' },
    goal_progress: { emoji: '🎯', titleTemplate: 'Postęp celu' },
};

// ============ CATEGORY BENCHMARKS (średnie rynkowe w PLN/miesiąc) ============

const CATEGORY_BENCHMARKS: Record<ExpenseCategory, { avg: number; median: number }> = {
    groceries: { avg: 120000, median: 100000 },      // 1000-1200 zł
    restaurants: { avg: 50000, median: 35000 },      // 350-500 zł
    transport: { avg: 60000, median: 45000 },        // 450-600 zł
    utilities: { avg: 80000, median: 70000 },        // 700-800 zł
    entertainment: { avg: 30000, median: 20000 },    // 200-300 zł
    shopping: { avg: 40000, median: 25000 },         // 250-400 zł
    health: { avg: 25000, median: 15000 },           // 150-250 zł
    education: { avg: 20000, median: 10000 },        // 100-200 zł
    subscriptions: { avg: 15000, median: 10000 },    // 100-150 zł
    other: { avg: 30000, median: 20000 },            // 200-300 zł
};

// ============ INSIGHTS ENGINE ============

export class InsightsEngine {

    /**
     * Generate all relevant insights for a new expense
     */
    generateInsightsForExpense(
        expense: Expense,
        recentExpenses: Expense[],
        userProfile: UserSpendingProfile | null,
        budgets: Array<{ category: ExpenseCategory; limit: number; spent: number }>
    ): AIInsight[] {
        const partialInsights: Partial<AIInsight>[] = [];
        const now = new Date();

        // 1. Spending Spike Detection
        const spikeInsight = this.detectSpendingSpike(expense, recentExpenses, userProfile);
        if (spikeInsight) partialInsights.push(spikeInsight);

        // 2. Recurring Expense Detection
        const recurringInsight = this.detectRecurringExpense(expense, recentExpenses);
        if (recurringInsight) partialInsights.push(recurringInsight);

        // 3. Overpaying Detection
        const overpayingInsight = this.detectOverpaying(expense);
        if (overpayingInsight) partialInsights.push(overpayingInsight);

        // 4. Budget Warning
        const budgetInsight = this.checkBudgetLimit(expense, budgets);
        if (budgetInsight) partialInsights.push(budgetInsight);

        // 5. Unusual Merchant
        const merchantInsight = this.detectUnusualMerchant(expense, recentExpenses);
        if (merchantInsight) partialInsights.push(merchantInsight);

        // 6. Savings Tips
        const tipInsight = this.generateSavingsTip(expense, recentExpenses);
        if (tipInsight) partialInsights.push(tipInsight);

        // Complete all partial insights with required fields
        return partialInsights.map(insight => ({
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: insight.userId || expense.userId,
            type: insight.type || 'tip',
            priority: insight.priority || 'low',
            title: insight.title || '',
            message: insight.message || '',
            emoji: insight.emoji || '💡',
            confidence: insight.confidence || 0.5,
            status: 'new' as const,
            createdAt: now,
            ...insight,
        } as AIInsight));
    }

    /**
     * Detect if today's spending is unusually high
     */
    private detectSpendingSpike(
        expense: Expense,
        recentExpenses: Expense[],
        userProfile: UserSpendingProfile | null
    ): Partial<AIInsight> | null {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate today's total
        const todayExpenses = recentExpenses.filter(e => {
            const expenseDate = e.date?.toDate ? e.date.toDate() : new Date();
            return expenseDate >= today;
        });

        const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0) + expense.amount;

        // Get average or estimate
        const avgDaily = userProfile?.avgDailySpending || 15000; // default 150 zł

        // Spike if 2x average
        if (todayTotal > avgDaily * 2) {
            const percentage = Math.round((todayTotal / avgDaily) * 100);
            return {
                userId: expense.userId,
                type: 'spending_spike',
                priority: todayTotal > avgDaily * 3 ? 'high' : 'medium',
                emoji: '📈',
                title: 'Dzisiejsze wydatki wyższe niż zwykle',
                message: `Wydałeś już ${this.formatMoney(todayTotal)} - to ${percentage}% Twojej średniej dziennej!`,
                confidence: 0.85,
                potentialSavings: todayTotal - avgDaily,
            };
        }

        return null;
    }

    /**
     * Detect recurring expenses
     */
    private detectRecurringExpense(
        expense: Expense,
        recentExpenses: Expense[]
    ): Partial<AIInsight> | null {
        const merchantName = expense.merchant?.name?.toLowerCase() || '';
        if (!merchantName) return null;

        // Find similar expenses to same merchant
        const similarExpenses = recentExpenses.filter(e =>
            e.merchant?.name?.toLowerCase().includes(merchantName) ||
            merchantName.includes(e.merchant?.name?.toLowerCase() || '')
        );

        if (similarExpenses.length >= 2) {
            // Check if amounts are similar (within 20%)
            const amounts = similarExpenses.map(e => e.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const isAmountSimilar = Math.abs(expense.amount - avgAmount) / avgAmount < 0.2;

            if (isAmountSimilar) {
                // Try to detect frequency
                const dates = similarExpenses
                    .map(e => e.date?.toDate ? e.date.toDate() : new Date())
                    .sort((a, b) => a.getTime() - b.getTime());

                if (dates.length >= 2) {
                    const intervals = [];
                    for (let i = 1; i < dates.length; i++) {
                        intervals.push(dates[i].getTime() - dates[i - 1].getTime());
                    }
                    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                    const dayInterval = Math.round(avgInterval / (1000 * 60 * 60 * 24));

                    let frequency = '';
                    if (dayInterval <= 7) frequency = 'co tydzień';
                    else if (dayInterval <= 15) frequency = 'co 2 tygodnie';
                    else if (dayInterval <= 35) frequency = 'co miesiąc';

                    if (frequency) {
                        return {
                            userId: expense.userId,
                            type: 'recurring_detected',
                            priority: 'low',
                            emoji: '🔄',
                            title: 'Wykryto cykliczny wydatek',
                            message: `${expense.merchant?.name} pojawia się ${frequency} (~${this.formatMoney(avgAmount)})`,
                            confidence: 0.75,
                            actionType: 'confirm',
                            actionLabel: 'Dodaj do budżetu',
                            actionUrl: '/budgets',
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Detect if user is overpaying compared to benchmarks
     */
    private detectOverpaying(expense: Expense): Partial<AIInsight> | null {
        const category = expense.merchant?.category || 'other';
        const benchmark = CATEGORY_BENCHMARKS[category];

        if (!benchmark) return null;

        // Check if single expense is unusually high
        const avgTransaction = benchmark.avg / 10; // Assume ~10 transactions/month per category

        if (expense.amount > avgTransaction * 2) {
            const percentile = Math.min(95, Math.round((expense.amount / avgTransaction) * 50));
            return {
                userId: expense.userId,
                type: 'overpaying',
                priority: 'medium',
                emoji: '💸',
                title: 'Ten zakup jest droższy niż zwykle',
                message: `${this.formatMoney(expense.amount)} w kategorii "${this.getCategoryLabel(category)}" - to więcej niż ${percentile}% podobnych zakupów`,
                confidence: 0.7,
                potentialSavings: expense.amount - avgTransaction,
            };
        }

        return null;
    }

    /**
     * Check if expense pushes category over budget
     */
    private checkBudgetLimit(
        expense: Expense,
        budgets: Array<{ category: ExpenseCategory; limit: number; spent: number }>
    ): Partial<AIInsight> | null {
        const category = expense.merchant?.category || 'other';
        const budget = budgets.find(b => b.category === category);

        if (!budget) return null;

        const newSpent = budget.spent + expense.amount;
        const percentUsed = Math.round((newSpent / budget.limit) * 100);

        if (percentUsed >= 100) {
            return {
                userId: expense.userId,
                type: 'budget_warning',
                priority: 'critical',
                emoji: '🔴',
                title: 'Budżet przekroczony!',
                message: `Wykorzystano ${percentUsed}% budżetu na "${this.getCategoryLabel(category)}"`,
                confidence: 1.0,
                actionType: 'navigate',
                actionUrl: '/budgets',
                actionLabel: 'Zobacz budżet',
            };
        } else if (percentUsed >= 80) {
            return {
                userId: expense.userId,
                type: 'budget_warning',
                priority: 'high',
                emoji: '⚠️',
                title: 'Zbliżasz się do limitu',
                message: `${percentUsed}% budżetu na "${this.getCategoryLabel(category)}" wykorzystane`,
                confidence: 1.0,
            };
        }

        return null;
    }

    /**
     * Detect first-time merchant
     */
    private detectUnusualMerchant(
        expense: Expense,
        recentExpenses: Expense[]
    ): Partial<AIInsight> | null {
        const merchantName = expense.merchant?.name?.toLowerCase() || '';
        if (!merchantName) return null;

        // Check if user has been to this merchant before
        const previousVisits = recentExpenses.filter(e =>
            e.merchant?.name?.toLowerCase() === merchantName
        );

        if (previousVisits.length === 0 && expense.amount > 5000) { // > 50 zł
            return {
                userId: expense.userId,
                type: 'unusual_merchant',
                priority: 'low',
                emoji: '🆕',
                title: 'Pierwszy raz w tym sklepie',
                message: `Pierwszy zakup w "${expense.merchant?.name}". Jak oceniasz?`,
                confidence: 0.9,
                actionType: 'confirm',
                actionLabel: 'Dodaj do ulubionych',
            };
        }

        return null;
    }

    /**
     * Generate contextual savings tips
     */
    private generateSavingsTip(
        expense: Expense,
        recentExpenses: Expense[]
    ): Partial<AIInsight> | null {
        const category = expense.merchant?.category || 'other';
        const tips: Record<ExpenseCategory, string[]> = {
            restaurants: [
                'Gotowanie w domu może zaoszczędzić nawet 500 zł miesięcznie!',
                'Meal prep raz w tygodniu = oszczędność czasu i pieniędzy',
                'Sprawdź promocje lunch menu - często o 30% taniej',
            ],
            groceries: [
                'Lista zakupów zmniejsza impulsywne zakupy o 40%',
                'Porównuj ceny za 1kg - nie daj się nabrać na "promocje"',
                'Zakupy na zapas = mniej wycieczek do sklepu',
            ],
            transport: [
                'Bilet miesięczny zwraca się przy 40+ przejazdach',
                'Carpooling zmniejsza koszty o 50%',
                'Planuj trasę - oszczędzaj paliwo',
            ],
            subscriptions: [
                'Audyt subskrypcji raz w miesiącu - usuń nieużywane',
                'Płatność roczna = często 2 miesiące gratis',
                'Dzielenie kont rodzinnych zmniejsza koszt o 60%',
            ],
            shopping: [
                'Zasada 48h - poczekaj przed zakupem',
                'Wyprzedaże sezonowe = 30-70% taniej',
                'Używane/second-hand to oszczędność i ekologia',
            ],
            entertainment: [
                'Kino we wtorki = tańsze bilety',
                'Darmowe wydarzenia kulturalne w mieście',
                'Biblioteka = bezpłatny dostęp do książek i mediów',
            ],
            health: [
                'Leki generyczne = ta sama skuteczność, niższa cena',
                'Apteki internetowe często tańsze',
                'Profilaktyka tańsza niż leczenie',
            ],
            education: [
                'Kursy online często w promocji',
                'YouTube = darmowa edukacja',
                'Biblioteki cyfrowe mają bezpłatne e-booki',
            ],
            utilities: [
                'Porównaj taryfy prądu - można oszczędzić 200 zł/rok',
                'LED-y zmniejszają rachunek za prąd o 80%',
                'Termostat = oszczędność 10-15% na ogrzewaniu',
            ],
            other: [
                'Śledź wydatki regularnie',
                'Ustal cel oszczędnościowy',
                'Automat oszczędzania = łatwiejsze trzymanie budżetu',
            ],
        };

        const categoryTips = tips[category] || tips.other;

        // Show tip randomly (20% chance per expense)
        if (Math.random() > 0.8) {
            const randomTip = categoryTips[Math.floor(Math.random() * categoryTips.length)];
            return {
                userId: expense.userId,
                type: 'tip',
                priority: 'low',
                emoji: '💡',
                title: 'Porada oszczędnościowa',
                message: randomTip,
                confidence: 0.6,
                relatedCategory: category,
            };
        }

        return null;
    }

    /**
     * Generate weekly summary insight
     */
    generateWeeklySummary(
        userId: string,
        weeklyExpenses: Expense[],
        previousWeekTotal: number
    ): AIInsight {
        const total = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const change = previousWeekTotal > 0
            ? Math.round(((total - previousWeekTotal) / previousWeekTotal) * 100)
            : 0;

        const topCategory = this.getTopCategory(weeklyExpenses);

        let message = `W tym tygodniu wydałeś ${this.formatMoney(total)}.`;
        if (change > 10) {
            message += ` To ${change}% więcej niż w poprzednim tygodniu.`;
        } else if (change < -10) {
            message += ` Świetnie! To ${Math.abs(change)}% mniej niż poprzednio.`;
        }
        if (topCategory) {
            message += ` Najwięcej na: ${topCategory.name}.`;
        }

        return {
            id: `weekly_${Date.now()}`,
            userId,
            type: 'weekly_summary',
            priority: 'medium',
            emoji: '📅',
            title: 'Podsumowanie tygodnia',
            message,
            confidence: 1.0,
            status: 'new',
            createdAt: new Date(),
        };
    }

    // ============ HELPERS ============

    private formatMoney(amount: number): string {
        return `${(amount / 100).toFixed(2).replace('.', ',')} zł`;
    }

    private getCategoryLabel(category: ExpenseCategory): string {
        const labels: Record<ExpenseCategory, string> = {
            groceries: 'Zakupy spożywcze',
            restaurants: 'Jedzenie na mieście',
            transport: 'Transport',
            utilities: 'Opłaty',
            entertainment: 'Rozrywka',
            shopping: 'Zakupy',
            health: 'Zdrowie',
            education: 'Edukacja',
            subscriptions: 'Subskrypcje',
            other: 'Inne',
        };
        return labels[category] || 'Inne';
    }

    private getTopCategory(expenses: Expense[]): { name: string; total: number } | null {
        const byCategory: Record<string, number> = {};

        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) return null;

        return {
            name: this.getCategoryLabel(sorted[0][0] as ExpenseCategory),
            total: sorted[0][1],
        };
    }
    /**
     * Analyze expenses for dashboard display
     */
    analyzeDashboard(
        expenses: Expense[],
        budgets: Array<{ category: ExpenseCategory; limit: number; spent: number }>
    ): AIInsight[] {
        const insights: Partial<AIInsight>[] = [];
        const now = new Date();

        if (expenses.length === 0) return [];

        // Sort expenses desc
        const sorted = [...expenses].sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date as unknown as string);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date as unknown as string);
            return dateB.getTime() - dateA.getTime();
        });

        const recentExpenses = sorted.slice(0, 50);
        const lastExpense = sorted[0];

        // 1. Check budget health (global)
        budgets.forEach(budget => {
            if (budget.spent > budget.limit * 0.8) {
                const percent = Math.round((budget.spent / budget.limit) * 100);
                insights.push({
                    type: 'budget_warning',
                    priority: percent > 100 ? 'critical' : 'high',
                    emoji: percent > 100 ? '🔴' : '⚠️',
                    title: percent > 100 ? 'Budżet przekroczony' : 'Budżet zagrożony',
                    message: `Kategoria ${this.getCategoryLabel(budget.category)}: ${percent}% limitu`,
                    userId: expenses[0].userId,
                });
            }
        });

        // 2. Weekly Summary (if enabled/needed)
        const weeklyInsight = this.generateWeeklySummary(
            expenses[0].userId,
            recentExpenses.filter(e => {
                const d = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
                return d > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }),
            0 // Simplified for now
        );
        if (weeklyInsight) insights.push(weeklyInsight);

        // 3. Tip based on most frequent category
        if (Math.random() > 0.5) { // 50% chance
            const tip = this.generateSavingsTip(lastExpense, recentExpenses);
            if (tip) insights.push(tip);
        }

        // Complete insights
        return insights.map(insight => ({
            id: `dash_insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: insight.userId || 'unknown',
            type: insight.type || 'tip',
            priority: insight.priority || 'low',
            title: insight.title || '',
            message: insight.message || '',
            emoji: insight.emoji || '💡',
            confidence: insight.confidence || 0.8,
            status: 'new' as const,
            createdAt: now,
            ...insight,
        } as AIInsight));
    }
}

// Singleton export
export const insightsEngine = new InsightsEngine();
