/**
 * Savori Advanced Spending Predictor v2.0
 * Statistical predictions using regression, volatility, and seasonality
 */

import { Expense, ExpenseCategory } from '@/types';
import {
    calculateStats,
    linearRegression,
    weightedMovingAverage,
    generateLinearWeights,
    calculateVolatility,
    calculateConfidenceInterval,
    detectDayOfWeekSeasonality,
    categorizeSpendingType,
    TimeSeriesPoint,
} from '@/lib/math/statistics';

// ============ TYPES ============

export interface SpendingPrediction {
    type: 'daily' | 'weekly' | 'monthly' | 'category';
    period: string;
    predicted: number;
    predictedRange: [number, number];  // Confidence interval
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    breakdown?: CategoryBreakdown[];
    methodology: string;  // Explain how prediction was made
}

export interface CategoryBreakdown {
    category: ExpenseCategory;
    predicted: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    isFixed: boolean;  // Fixed vs Variable spending
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

// ============ HELPER: Date conversion ============

function toDate(dateValue: unknown): Date {
    if (!dateValue) return new Date();
    if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof (dateValue as { toDate: () => Date }).toDate === 'function') {
        return (dateValue as { toDate: () => Date }).toDate();
    }
    return new Date(dateValue as string | number);
}

// ============ PREDICTOR v2.0 ============

export class SpendingPredictor {

    /**
     * Predict spending for rest of month using:
     * 1. Fixed costs (recurring, low volatility expenses)
     * 2. Variable costs (using WMA and day-of-week seasonality)
     * 3. Trend adjustment from linear regression
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
        const monthExpenses = expenses.filter(e => toDate(e.date) >= startOfMonth);
        const currentSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        if (expenses.length < 5 || daysPassed < 3) {
            // Fallback: simple projection for insufficient data
            const dailyAvg = daysPassed > 0 ? currentSpent / daysPassed : 0;
            const projected = currentSpent + (dailyAvg * daysRemaining);

            return {
                type: 'monthly',
                period: `${now.toLocaleString('pl', { month: 'long' })} ${now.getFullYear()}`,
                predicted: Math.round(projected),
                predictedRange: [Math.round(projected * 0.8), Math.round(projected * 1.2)],
                confidence: 0.4,
                trend: 'stable',
                changePercent: 0,
                methodology: 'Prosta prognoza (mało danych)',
            };
        }

        // ===== STEP 1: Separate Fixed vs Variable =====
        const { fixedTotal, variableExpenses } = this.separateFixedVariable(expenses, startOfMonth);

        // ===== STEP 2: Calculate Variable Projection with WMA =====
        const dailyVariableTotals = this.getDailyTotals(variableExpenses, startOfMonth, now);
        const recentDays = dailyVariableTotals.slice(-Math.min(7, dailyVariableTotals.length));

        const wmaDaily = recentDays.length > 0
            ? weightedMovingAverage(recentDays, generateLinearWeights(recentDays.length))
            : 0;

        // ===== STEP 3: Day-of-Week Seasonality =====
        const seasonality = detectDayOfWeekSeasonality(
            expenses.map(e => ({ date: toDate(e.date), amount: e.amount }))
        );

        // Calculate seasonality-adjusted remaining days
        let seasonalRemainingMultiplier = 0;
        for (let d = 1; d <= daysRemaining; d++) {
            const futureDate = new Date(now);
            futureDate.setDate(now.getDate() + d);
            seasonalRemainingMultiplier += seasonality[futureDate.getDay()] || 1;
        }

        // ===== STEP 4: Linear Regression Trend =====
        const monthlyTotals = this.getMonthlyTotals(expenses, 6);
        const regression = linearRegression(monthlyTotals);
        const trendAdjustment = regression.trend === 'up' ? 1.05 :
            regression.trend === 'down' ? 0.95 : 1;

        // ===== FINAL PROJECTION =====
        const variableProjection = wmaDaily * seasonalRemainingMultiplier * trendAdjustment;
        const totalProjected = currentSpent + variableProjection;

        // ===== CONFIDENCE BASED ON VOLATILITY =====
        const volatility = calculateVolatility(recentDays);
        const dataQualityBonus = Math.min(0.3, (daysPassed / daysInMonth) * 0.3);
        const confidence = Math.max(0.3, Math.min(0.95,
            0.5 + dataQualityBonus + regression.rSquared * 0.2 - volatility * 0.2
        ));

        const [lower, upper] = calculateConfidenceInterval(totalProjected, volatility, 0.95);

        // ===== COMPARISON WITH PREVIOUS MONTH =====
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const prevMonthExpenses = expenses.filter(e => {
            const date = toDate(e.date);
            return date >= prevMonthStart && date <= prevMonthEnd;
        });
        const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const changePercent = prevMonthTotal > 0
            ? Math.round(((totalProjected - prevMonthTotal) / prevMonthTotal) * 100)
            : 0;

        // Category breakdown
        const breakdown = this.getCategoryBreakdown(monthExpenses, daysRemaining / daysPassed);

        return {
            type: 'monthly',
            period: `${now.toLocaleString('pl', { month: 'long' })} ${now.getFullYear()}`,
            predicted: Math.round(totalProjected),
            predictedRange: [Math.round(lower), Math.round(upper)],
            confidence,
            trend: regression.trend,
            changePercent,
            breakdown,
            methodology: `WMA + sezonowość + regresja (R²=${(regression.rSquared * 100).toFixed(0)}%)`,
        };
    }

    /**
     * Predict weekly spending with day-of-week patterns
     */
    predictWeeklySpending(expenses: Expense[]): SpendingPrediction {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const dayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
        const daysRemaining = 7 - dayOfWeek;

        const weekExpenses = expenses.filter(e => toDate(e.date) >= startOfWeek);
        const currentSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Get historical weekly data
        const weeklyTotals = this.getWeeklyTotals(expenses, 8);
        const stats = calculateStats(weeklyTotals);
        const volatility = calculateVolatility(weeklyTotals);

        // Day-of-week projection
        const seasonality = detectDayOfWeekSeasonality(
            expenses.map(e => ({ date: toDate(e.date), amount: e.amount }))
        );

        let remainingProjection = 0;
        for (let d = 1; d <= daysRemaining; d++) {
            const futureDate = new Date(now);
            futureDate.setDate(now.getDate() + d);
            remainingProjection += (stats.mean / 7) * (seasonality[futureDate.getDay()] || 1);
        }

        const projected = currentSpent + remainingProjection;
        const [lower, upper] = calculateConfidenceInterval(projected, volatility, 0.95);

        // Compare to previous week
        const prevWeekStart = new Date(startOfWeek);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(startOfWeek);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

        const prevWeekExpenses = expenses.filter(e => {
            const date = toDate(e.date);
            return date >= prevWeekStart && date <= prevWeekEnd;
        });
        const prevWeekTotal = prevWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

        const changePercent = prevWeekTotal > 0
            ? Math.round(((projected - prevWeekTotal) / prevWeekTotal) * 100)
            : 0;

        const confidence = 0.6 + (dayOfWeek / 7) * 0.25 - volatility * 0.15;

        return {
            type: 'weekly',
            period: `Tydzień ${this.getWeekNumber(now)}`,
            predicted: Math.round(projected),
            predictedRange: [Math.round(lower), Math.round(upper)],
            confidence: Math.max(0.4, Math.min(0.9, confidence)),
            trend: changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable',
            changePercent,
            methodology: 'Sezonowość dnia tygodnia',
        };
    }

    /**
     * Predict today's spending based on day-of-week patterns
     */
    predictDailySpending(expenses: Expense[]): SpendingPrediction {
        const now = new Date();
        const dayOfWeek = now.getDay();

        // Get historical data for this day of week
        const sameDayExpenses = expenses.filter(e => toDate(e.date).getDay() === dayOfWeek);
        const dailyTotals: Record<string, number> = {};

        sameDayExpenses.forEach(e => {
            const date = toDate(e.date);
            const key = date.toISOString().split('T')[0];
            dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
        });

        const totals = Object.values(dailyTotals);
        const stats = calculateStats(totals);
        const volatility = calculateVolatility(totals);

        // Today's actual spending
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayExpenses = expenses.filter(e => toDate(e.date) >= todayStart);
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Use WMA for prediction if we have history
        const predicted = totals.length >= 3
            ? weightedMovingAverage(totals.slice(-5), generateLinearWeights(Math.min(5, totals.length)))
            : stats.mean || 15000;

        const [lower, upper] = calculateConfidenceInterval(predicted, volatility, 0.95);

        const dayName = now.toLocaleDateString('pl', { weekday: 'long' });
        const confidence = totals.length >= 5 ? 0.7 - volatility * 0.2 : 0.5;

        return {
            type: 'daily',
            period: `Dziś (${dayName})`,
            predicted: Math.round(Math.max(predicted, todaySpent)),
            predictedRange: [Math.round(lower), Math.round(upper)],
            confidence: Math.max(0.4, Math.min(0.85, confidence)),
            trend: todaySpent > predicted ? 'up' : todaySpent < predicted * 0.8 ? 'down' : 'stable',
            changePercent: Math.round(((todaySpent - stats.mean) / (stats.mean || 1)) * 100),
            methodology: `Średnia ważona dla ${dayName}`,
        };
    }

    /**
     * Predict next likely expense based on recurring patterns
     */
    predictNextExpense(expenses: Expense[]): NextExpensePrediction | null {
        if (expenses.length < 5) return null;

        // Find recurring patterns
        const merchantCounts: Record<string, {
            count: number;
            amounts: number[];
            dates: Date[];
            category: ExpenseCategory;
        }> = {};

        expenses.forEach(e => {
            const merchant = e.merchant?.name || 'Unknown';
            if (!merchantCounts[merchant]) {
                merchantCounts[merchant] = {
                    count: 0,
                    amounts: [],
                    dates: [],
                    category: e.merchant?.category || 'other',
                };
            }
            merchantCounts[merchant].count++;
            merchantCounts[merchant].amounts.push(e.amount);
            merchantCounts[merchant].dates.push(toDate(e.date));
        });

        // Find most frequent recurring merchant
        const sorted = Object.entries(merchantCounts)
            .filter(([_, data]) => data.count >= 2)
            .map(([merchant, data]) => {
                const spendingType = categorizeSpendingType(data.amounts, data.dates);
                return { merchant, ...data, spendingType };
            })
            .filter(d => d.spendingType === 'fixed' || d.spendingType === 'mixed')
            .sort((a, b) => b.count - a.count);

        if (sorted.length === 0) return null;

        const top = sorted[0];
        const sortedDates = [...top.dates].sort((a, b) => a.getTime() - b.getTime());

        // Calculate average interval
        let avgInterval = 7 * 24 * 60 * 60 * 1000; // default 7 days
        if (sortedDates.length >= 2) {
            const intervals: number[] = [];
            for (let i = 1; i < sortedDates.length; i++) {
                intervals.push(sortedDates[i].getTime() - sortedDates[i - 1].getTime());
            }
            avgInterval = weightedMovingAverage(intervals, generateLinearWeights(intervals.length));
        }

        const lastDate = sortedDates[sortedDates.length - 1];
        const expectedDate = new Date(lastDate.getTime() + avgInterval);

        const avgAmount = calculateStats(top.amounts).mean;

        return {
            merchant: top.merchant,
            category: top.category,
            estimatedAmount: Math.round(avgAmount),
            probability: Math.min(0.9, 0.4 + (top.count / 10) * 0.5),
            expectedDate,
            reason: `Cykliczny wydatek (${top.count}x, ~${Math.round(avgInterval / (24 * 60 * 60 * 1000))} dni)`,
        };
    }

    /**
     * Detect spending patterns using statistical analysis
     */
    detectPatterns(expenses: Expense[]): SpendingPattern[] {
        const patterns: SpendingPattern[] = [];

        // 1. Weekend vs Weekday pattern
        const weekendExpenses = expenses.filter(e => {
            const day = toDate(e.date).getDay();
            return day === 0 || day === 6;
        });
        const weekdayExpenses = expenses.filter(e => {
            const day = toDate(e.date).getDay();
            return day >= 1 && day <= 5;
        });

        const weekendStats = calculateStats(weekendExpenses.map(e => e.amount));
        const weekdayStats = calculateStats(weekdayExpenses.map(e => e.amount));

        if (weekendStats.mean > weekdayStats.mean * 1.5 && weekendExpenses.length >= 5) {
            patterns.push({
                type: 'seasonal',
                description: 'Weekendy są droższe niż dni robocze',
                amount: weekendStats.mean - weekdayStats.mean,
                frequency: 'co tydzień',
                confidence: 0.8,
            });
        }

        // 2. Evening impulse pattern
        const eveningExpenses = expenses.filter(e => {
            const hour = toDate(e.date).getHours();
            return hour >= 20 || hour <= 2;
        });

        if (eveningExpenses.length >= 3) {
            const eveningCats = eveningExpenses.filter(e =>
                e.merchant?.category === 'restaurants' ||
                e.merchant?.category === 'entertainment'
            );
            if (eveningCats.length >= 2) {
                const avgAmount = calculateStats(eveningCats.map(e => e.amount)).mean;
                patterns.push({
                    type: 'impulse',
                    description: 'Wieczorne wydatki impulsowe (po 20:00)',
                    amount: avgAmount,
                    confidence: 0.7,
                });
            }
        }

        // 3. Trend detection via regression
        const monthlyTotals = this.getMonthlyTotals(expenses, 6);
        if (monthlyTotals.length >= 3) {
            const regression = linearRegression(monthlyTotals);
            if (regression.rSquared > 0.5 && regression.trend !== 'stable') {
                const slopePerMonth = regression.slope;
                patterns.push({
                    type: 'trend',
                    description: regression.trend === 'up'
                        ? `Wydatki rosną o ~${this.formatMoney(Math.abs(slopePerMonth * 30))}/mies`
                        : `Wydatki maleją o ~${this.formatMoney(Math.abs(slopePerMonth * 30))}/mies`,
                    amount: Math.abs(slopePerMonth * 30),
                    confidence: regression.confidence,
                });
            }
        }

        return patterns;
    }

    // ============ HELPERS ============

    private separateFixedVariable(
        expenses: Expense[],
        startOfMonth: Date
    ): { fixedTotal: number; variableExpenses: Expense[] } {
        // Group by merchant
        const byMerchant: Record<string, Expense[]> = {};
        expenses.forEach(e => {
            const key = e.merchant?.name || 'Unknown';
            if (!byMerchant[key]) byMerchant[key] = [];
            byMerchant[key].push(e);
        });

        let fixedTotal = 0;
        const variableExpenses: Expense[] = [];

        Object.entries(byMerchant).forEach(([_, merchantExpenses]) => {
            if (merchantExpenses.length >= 2) {
                const amounts = merchantExpenses.map(e => e.amount);
                const dates = merchantExpenses.map(e => toDate(e.date));
                const type = categorizeSpendingType(amounts, dates);

                if (type === 'fixed') {
                    // Add only this month's fixed expense
                    const thisMonth = merchantExpenses.filter(e => toDate(e.date) >= startOfMonth);
                    fixedTotal += thisMonth.reduce((sum, e) => sum + e.amount, 0);
                } else {
                    variableExpenses.push(...merchantExpenses.filter(e => toDate(e.date) >= startOfMonth));
                }
            } else {
                variableExpenses.push(...merchantExpenses.filter(e => toDate(e.date) >= startOfMonth));
            }
        });

        return { fixedTotal, variableExpenses };
    }

    private getDailyTotals(expenses: Expense[], startDate: Date, endDate: Date): number[] {
        const dailyMap: Record<string, number> = {};

        expenses.forEach(e => {
            const date = toDate(e.date);
            if (date >= startDate && date <= endDate) {
                const key = date.toISOString().split('T')[0];
                dailyMap[key] = (dailyMap[key] || 0) + e.amount;
            }
        });

        // Fill missing days with 0
        const result: number[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const key = current.toISOString().split('T')[0];
            result.push(dailyMap[key] || 0);
            current.setDate(current.getDate() + 1);
        }

        return result;
    }

    private getWeeklyTotals(expenses: Expense[], weeksBack: number): number[] {
        const now = new Date();
        const weeklyTotals: number[] = [];

        for (let w = 0; w < weeksBack; w++) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - (w * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekEnd.getDate() - 7);

            const weekTotal = expenses
                .filter(e => {
                    const date = toDate(e.date);
                    return date >= weekStart && date <= weekEnd;
                })
                .reduce((sum, e) => sum + e.amount, 0);

            weeklyTotals.unshift(weekTotal); // Add to beginning
        }

        return weeklyTotals.filter(t => t > 0);
    }

    private getMonthlyTotals(expenses: Expense[], monthsBack: number): TimeSeriesPoint[] {
        const now = new Date();
        const result: TimeSeriesPoint[] = [];

        for (let m = monthsBack - 1; m >= 0; m--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);

            const monthTotal = expenses
                .filter(e => {
                    const date = toDate(e.date);
                    return date >= monthStart && date <= monthEnd;
                })
                .reduce((sum, e) => sum + e.amount, 0);

            if (monthTotal > 0) {
                result.push({
                    timestamp: monthStart.getTime(),
                    value: monthTotal,
                });
            }
        }

        return result;
    }

    private getCategoryBreakdown(expenses: Expense[], multiplier: number): CategoryBreakdown[] {
        const byCategory: Record<ExpenseCategory, { total: number; expenses: Expense[] }> = {} as Record<ExpenseCategory, { total: number; expenses: Expense[] }>;

        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = { total: 0, expenses: [] };
            byCategory[cat].total += e.amount;
            byCategory[cat].expenses.push(e);
        });

        const grandTotal = Object.values(byCategory).reduce((sum, c) => sum + c.total, 0);

        return Object.entries(byCategory).map(([cat, data]) => {
            const amounts = data.expenses.map(e => e.amount);
            const dates = data.expenses.map(e => toDate(e.date));
            const isFixed = data.expenses.length >= 2 && categorizeSpendingType(amounts, dates) === 'fixed';

            return {
                category: cat as ExpenseCategory,
                predicted: Math.round(data.total * (1 + multiplier)),
                percentage: Math.round((data.total / grandTotal) * 100),
                trend: 'stable' as const,
                isFixed,
            };
        }).sort((a, b) => b.predicted - a.predicted);
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    private formatMoney(amount: number): string {
        return `${(amount / 100).toFixed(2).replace('.', ',')} zł`;
    }
}

// Singleton export
export const spendingPredictor = new SpendingPredictor();
