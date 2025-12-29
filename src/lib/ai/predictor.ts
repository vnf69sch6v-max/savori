/**
 * Savori Advanced Spending Predictor
 * ML-like predictions based on user spending patterns
 */

import { Expense, ExpenseCategory } from '@/types';

// ============ TYPES ============

export interface SpendingPrediction {
    type: 'daily' | 'weekly' | 'monthly' | 'category';
    period: string;
    predicted: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    breakdown?: CategoryBreakdown[];
}

export interface CategoryBreakdown {
    category: ExpenseCategory;
    predicted: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
}

export interface NextExpensePrediction {
    merchant?: string;
    category: ExpenseCategory;
    estimatedAmount: number;
    probability: number;
    expectedDate: Date;
    reason: string;
}

export interface SpendingPattern {
    type: 'recurring' | 'seasonal' | 'trend' | 'impulse';
    description: string;
    amount: number;
    frequency?: string;
    confidence: number;
}

// ============ PREDICTOR ============

export class SpendingPredictor {

    /**
     * Predict spending for rest of month
     */
    predictMonthlySpending(
        expenses: Expense[],
        budgets?: Array<{ category: ExpenseCategory; limit: number }>
    ): SpendingPrediction {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();
        const daysPassed = now.getDate();
        const daysRemaining = daysInMonth - daysPassed;

        // Current month expenses
        const monthExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= startOfMonth;
        });

        const currentSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const dailyAvg = daysPassed > 0 ? currentSpent / daysPassed : 0;

        // Project to end of month
        const projected = currentSpent + (dailyAvg * daysRemaining);

        // Get previous month for comparison
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const prevMonthExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= prevMonthStart && date <= prevMonthEnd;
        });
        const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate trend
        const changePercent = prevMonthTotal > 0
            ? Math.round(((projected - prevMonthTotal) / prevMonthTotal) * 100)
            : 0;

        const trend: 'up' | 'down' | 'stable' =
            changePercent > 5 ? 'up' :
                changePercent < -5 ? 'down' : 'stable';

        // Category breakdown
        const breakdown = this.getCategoryBreakdown(monthExpenses, daysRemaining / daysPassed);

        // Confidence based on data quality
        const confidence = Math.min(0.95, 0.5 + (daysPassed / daysInMonth) * 0.45);

        return {
            type: 'monthly',
            period: `${now.toLocaleString('pl', { month: 'long' })} ${now.getFullYear()}`,
            predicted: Math.round(projected),
            confidence,
            trend,
            changePercent,
            breakdown,
        };
    }

    /**
     * Predict weekly spending
     */
    predictWeeklySpending(expenses: Expense[]): SpendingPrediction {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const dayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
        const daysRemaining = 7 - dayOfWeek;

        // This week's expenses
        const weekExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= startOfWeek;
        });

        const currentSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
        const dailyAvg = dayOfWeek > 0 ? currentSpent / dayOfWeek : 0;
        const projected = currentSpent + (dailyAvg * daysRemaining);

        // Previous week comparison
        const prevWeekStart = new Date(startOfWeek);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(startOfWeek);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

        const prevWeekExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= prevWeekStart && date <= prevWeekEnd;
        });
        const prevWeekTotal = prevWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

        const changePercent = prevWeekTotal > 0
            ? Math.round(((projected - prevWeekTotal) / prevWeekTotal) * 100)
            : 0;

        const trend: 'up' | 'down' | 'stable' =
            changePercent > 10 ? 'up' :
                changePercent < -10 ? 'down' : 'stable';

        return {
            type: 'weekly',
            period: `Tydzień ${this.getWeekNumber(now)}`,
            predicted: Math.round(projected),
            confidence: 0.7 + (dayOfWeek / 7) * 0.2,
            trend,
            changePercent,
        };
    }

    /**
     * Predict today's spending based on patterns
     */
    predictDailySpending(expenses: Expense[]): SpendingPrediction {
        const now = new Date();
        const dayOfWeek = now.getDay();

        // Get historical data for this day of week
        const sameDayExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date.getDay() === dayOfWeek;
        });

        // Calculate average for this day
        const dailyTotals: Record<string, number> = {};
        sameDayExpenses.forEach(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            const key = date.toISOString().split('T')[0];
            dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
        });

        const totals = Object.values(dailyTotals);
        const avgDaily = totals.length > 0
            ? totals.reduce((a, b) => a + b, 0) / totals.length
            : 15000; // default 150 zł

        // Today's actual spending
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= todayStart;
        });
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Predict remaining
        const hourOfDay = now.getHours();
        const hoursRemaining = 24 - hourOfDay;
        const hourlyRate = todaySpent / Math.max(1, hourOfDay);
        const projected = todaySpent + (hourlyRate * hoursRemaining * 0.3); // Reduce rate for evening

        const dayName = now.toLocaleDateString('pl', { weekday: 'long' });

        return {
            type: 'daily',
            period: `Dziś (${dayName})`,
            predicted: Math.round(Math.max(projected, todaySpent)),
            confidence: 0.6,
            trend: projected > avgDaily ? 'up' : projected < avgDaily * 0.8 ? 'down' : 'stable',
            changePercent: Math.round(((projected - avgDaily) / avgDaily) * 100),
        };
    }

    /**
     * Predict next likely expense
     */
    predictNextExpense(expenses: Expense[]): NextExpensePrediction | null {
        if (expenses.length < 5) return null;

        // Find recurring patterns
        const merchantCounts: Record<string, { count: number; avgAmount: number; lastDate: Date }> = {};

        expenses.forEach(e => {
            const merchant = e.merchant?.name || 'Unknown';
            if (!merchantCounts[merchant]) {
                merchantCounts[merchant] = { count: 0, avgAmount: 0, lastDate: new Date(0) };
            }
            merchantCounts[merchant].count++;
            merchantCounts[merchant].avgAmount =
                (merchantCounts[merchant].avgAmount * (merchantCounts[merchant].count - 1) + e.amount) /
                merchantCounts[merchant].count;

            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            if (date > merchantCounts[merchant].lastDate) {
                merchantCounts[merchant].lastDate = date;
            }
        });

        // Find most frequent recurring merchant
        const sorted = Object.entries(merchantCounts)
            .filter(([_, data]) => data.count >= 2)
            .sort((a, b) => b[1].count - a[1].count);

        if (sorted.length === 0) return null;

        const [topMerchant, data] = sorted[0];

        // Estimate next date (simple: avg interval)
        const merchantExpenses = expenses
            .filter(e => e.merchant?.name === topMerchant)
            .map(e => e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string))
            .sort((a, b) => a.getTime() - b.getTime());

        let avgInterval = 7 * 24 * 60 * 60 * 1000; // default 7 days
        if (merchantExpenses.length >= 2) {
            const intervals = [];
            for (let i = 1; i < merchantExpenses.length; i++) {
                intervals.push(merchantExpenses[i].getTime() - merchantExpenses[i - 1].getTime());
            }
            avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }

        const expectedDate = new Date(data.lastDate.getTime() + avgInterval);

        // Find category from last expense
        const lastExpense = expenses.find(e => e.merchant?.name === topMerchant);
        const category = lastExpense?.merchant?.category || 'other';

        return {
            merchant: topMerchant,
            category,
            estimatedAmount: Math.round(data.avgAmount),
            probability: Math.min(0.9, 0.4 + (data.count / 10) * 0.5),
            expectedDate,
            reason: `Odwiedzasz ${topMerchant} regularnie (${data.count}x)`,
        };
    }

    /**
     * Detect spending patterns
     */
    detectPatterns(expenses: Expense[]): SpendingPattern[] {
        const patterns: SpendingPattern[] = [];

        // 1. Weekend vs Weekday pattern
        const weekendExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date.getDay() === 0 || date.getDay() === 6;
        });
        const weekdayExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date.getDay() >= 1 && date.getDay() <= 5;
        });

        const weekendTotal = weekendExpenses.reduce((sum, e) => sum + e.amount, 0);
        const weekdayTotal = weekdayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const weekendAvg = weekendExpenses.length > 0 ? weekendTotal / weekendExpenses.length : 0;
        const weekdayAvg = weekdayExpenses.length > 0 ? weekdayTotal / weekdayExpenses.length : 0;

        if (weekendAvg > weekdayAvg * 1.5) {
            patterns.push({
                type: 'trend',
                description: 'Weekendy są droższe niż dni robocze',
                amount: weekendAvg - weekdayAvg,
                confidence: 0.8,
            });
        }

        // 2. Evening impulse pattern
        const eveningExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date.getHours() >= 20 || date.getHours() <= 2;
        });

        if (eveningExpenses.length >= 3) {
            const eveningCats = eveningExpenses.filter(e =>
                e.merchant?.category === 'restaurants' ||
                e.merchant?.category === 'entertainment'
            );
            if (eveningCats.length >= 2) {
                patterns.push({
                    type: 'impulse',
                    description: 'Wieczorne wydatki impulsowe (po 20:00)',
                    amount: eveningCats.reduce((sum, e) => sum + e.amount, 0) / eveningCats.length,
                    confidence: 0.7,
                });
            }
        }

        // 3. Category dominance
        const byCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);
        const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

        if (topCat && topCat[1] / totalSpent > 0.4) {
            patterns.push({
                type: 'trend',
                description: `${this.getCategoryLabel(topCat[0] as ExpenseCategory)} dominuje w wydatkach (${Math.round(topCat[1] / totalSpent * 100)}%)`,
                amount: topCat[1],
                confidence: 0.9,
            });
        }

        return patterns;
    }

    /**
     * Calculate savings potential
     */
    calculateSavingsPotential(
        expenses: Expense[],
        benchmarks: Record<ExpenseCategory, { avg: number }>
    ): { category: ExpenseCategory; potential: number; suggestion: string }[] {
        const byCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;

        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        const potential: { category: ExpenseCategory; potential: number; suggestion: string }[] = [];

        Object.entries(byCategory).forEach(([cat, spent]) => {
            const benchmark = benchmarks[cat as ExpenseCategory];
            if (benchmark && spent > benchmark.avg) {
                const diff = spent - benchmark.avg;
                potential.push({
                    category: cat as ExpenseCategory,
                    potential: diff,
                    suggestion: `Możesz zaoszczędzić ${this.formatMoney(diff)} na ${this.getCategoryLabel(cat as ExpenseCategory)}`,
                });
            }
        });

        return potential.sort((a, b) => b.potential - a.potential);
    }

    // ============ HELPERS ============

    private getCategoryBreakdown(expenses: Expense[], multiplier: number): CategoryBreakdown[] {
        const byCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;

        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
        const projected = total * (1 + multiplier);

        return Object.entries(byCategory).map(([cat, amount]) => ({
            category: cat as ExpenseCategory,
            predicted: Math.round(amount * (1 + multiplier)),
            percentage: Math.round((amount / total) * 100),
            trend: 'stable' as const,
        }));
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

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
}

// Singleton export
export const spendingPredictor = new SpendingPredictor();
