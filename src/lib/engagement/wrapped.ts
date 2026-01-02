/**
 * Money Wrapped Service
 * Generates "Spotify Wrapped" style monthly/weekly financial summaries
 */

import { Expense } from '@/types';
import { formatMoney as formatMoneyUtil } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

export interface WrappedSlide {
    id: string;
    type: 'hero' | 'stat' | 'insight' | 'comparison' | 'pattern' | 'prediction' | 'achievement' | 'cta';
    title: string;
    value?: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    color: string;  // Gradient color
    highlight?: boolean;
}

export interface MoneyWrapped {
    period: 'week' | 'month';
    periodLabel: string;
    dateRange: string;
    slides: WrappedSlide[];
    totalSpent: number;
    totalTransactions: number;
    // For sharing
    summary: {
        heroStat: string;
        topCategory: string;
        bestDay: string;
        potentialSavings: number;
    };
}

const CATEGORY_NAMES: Record<string, string> = {
    food: 'Jedzenie',
    transport: 'Transport',
    entertainment: 'Rozrywka',
    shopping: 'Zakupy',
    subscriptions: 'Subskrypcje',
    health: 'Zdrowie',
    bills: 'Rachunki',
    other: 'Inne',
};

const CATEGORY_ICONS: Record<string, string> = {
    food: '🍕',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    subscriptions: '📺',
    health: '💊',
    bills: '📄',
    other: '📦',
};

class WrappedService {
    /**
     * Generate monthly wrapped summary
     */
    generateMonthlyWrapped(expenses: Expense[], targetMonth?: Date): MoneyWrapped {
        const now = targetMonth || new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Filter expenses for the target month
        const monthExpenses = this.filterExpensesByDateRange(expenses, monthStart, monthEnd);

        // Get previous month for comparison
        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));
        const prevMonthExpenses = this.filterExpensesByDateRange(expenses, prevMonthStart, prevMonthEnd);

        return this.generateWrapped(monthExpenses, prevMonthExpenses, 'month', monthStart, monthEnd);
    }

    /**
     * Generate weekly pulse (mini wrapped)
     */
    generateWeeklyPulse(expenses: Expense[], targetWeek?: Date): MoneyWrapped {
        const now = targetWeek || new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const weekExpenses = this.filterExpensesByDateRange(expenses, weekStart, weekEnd);

        const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const prevWeekExpenses = this.filterExpensesByDateRange(expenses, prevWeekStart, prevWeekEnd);

        return this.generateWrapped(weekExpenses, prevWeekExpenses, 'week', weekStart, weekEnd);
    }

    /**
     * Core wrapped generation logic
     */
    private generateWrapped(
        currentExpenses: Expense[],
        previousExpenses: Expense[],
        period: 'week' | 'month',
        startDate: Date,
        endDate: Date
    ): MoneyWrapped {
        const slides: WrappedSlide[] = [];

        // Calculate metrics
        const totalSpent = currentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const prevTotalSpent = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalTransactions = currentExpenses.length;

        // Category breakdown
        const categoryBreakdown = this.getCategoryBreakdown(currentExpenses);
        const topCategory = categoryBreakdown[0];

        // Daily breakdown
        const dailyBreakdown = this.getDailyBreakdown(currentExpenses);
        const bestDay = dailyBreakdown.reduce((best, day) =>
            day.amount < best.amount ? day : best, dailyBreakdown[0] || { day: 'N/A', amount: Infinity });
        const worstDay = dailyBreakdown.reduce((worst, day) =>
            day.amount > worst.amount ? day : worst, dailyBreakdown[0] || { day: 'N/A', amount: 0 });

        // Merchant breakdown
        const merchantBreakdown = this.getMerchantBreakdown(currentExpenses);
        const topMerchant = merchantBreakdown[0];

        // Comparison with previous period
        const spendingDiff = totalSpent - prevTotalSpent;
        const spendingDiffPercent = prevTotalSpent > 0 ? Math.round((spendingDiff / prevTotalSpent) * 100) : 0;

        // ===== BUILD SLIDES =====

        // 1. Hero slide - total spent
        slides.push({
            id: 'hero',
            type: 'hero',
            title: period === 'month' ? 'Twój miesiąc w liczbach' : 'Twój tydzień',
            value: this.formatMoney(totalSpent),
            subtitle: `${totalTransactions} transakcji`,
            color: 'from-purple-600 to-blue-600',
            highlight: true,
        });

        // 2. Comparison with previous period
        if (prevTotalSpent > 0) {
            const isLess = spendingDiff < 0;
            slides.push({
                id: 'comparison',
                type: 'comparison',
                title: isLess ? 'Brawo! Wydałeś mniej' : 'Wydałeś więcej niż poprzednio',
                value: `${isLess ? '' : '+'}${this.formatMoney(spendingDiff)}`,
                subtitle: `${Math.abs(spendingDiffPercent)}% ${isLess ? 'mniej' : 'więcej'}`,
                icon: isLess ? '📉' : '📈',
                color: isLess ? 'from-emerald-600 to-teal-600' : 'from-amber-600 to-orange-600',
            });
        }

        // 3. Top category
        if (topCategory) {
            const categoryPercent = Math.round((topCategory.amount / totalSpent) * 100);
            slides.push({
                id: 'top-category',
                type: 'stat',
                title: 'Twoja główna kategoria',
                value: CATEGORY_NAMES[topCategory.category] || topCategory.category,
                subtitle: `${this.formatMoney(topCategory.amount)} (${categoryPercent}%)`,
                icon: CATEGORY_ICONS[topCategory.category] || '📊',
                color: 'from-rose-600 to-pink-600',
            });
        }

        // 4. Best day (lowest spending)
        if (bestDay && bestDay.amount < Infinity) {
            slides.push({
                id: 'best-day',
                type: 'achievement',
                title: 'Twój najoszczędniejszy dzień',
                value: bestDay.day,
                subtitle: bestDay.amount === 0 ? 'Zero wydatków! 🎉' : `Tylko ${this.formatMoney(bestDay.amount)}`,
                icon: '🏆',
                color: 'from-emerald-600 to-green-600',
                highlight: bestDay.amount === 0,
            });
        }

        // 5. Worst day (highest spending)
        if (worstDay && worstDay.amount > 0) {
            slides.push({
                id: 'worst-day',
                type: 'insight',
                title: 'Dzień z największymi wydatkami',
                value: worstDay.day,
                subtitle: this.formatMoney(worstDay.amount),
                description: 'Może warto zaplanować te dni lepiej?',
                icon: '🔥',
                color: 'from-orange-600 to-red-600',
            });
        }

        // 6. Top merchant
        if (topMerchant) {
            slides.push({
                id: 'top-merchant',
                type: 'stat',
                title: 'Twoje ulubione miejsce',
                value: topMerchant.name,
                subtitle: `${topMerchant.count}x wizyt • ${this.formatMoney(topMerchant.amount)}`,
                icon: '🏪',
                color: 'from-cyan-600 to-blue-600',
            });
        }

        // 7. Pattern insight
        const avgPerTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
        slides.push({
            id: 'pattern',
            type: 'pattern',
            title: 'Średni wydatek',
            value: this.formatMoney(avgPerTransaction),
            subtitle: 'na transakcję',
            description: avgPerTransaction > 5000 ? 'Dużo pojedynczych zakupów?' : 'Częste małe zakupy sumują się!',
            icon: avgPerTransaction > 5000 ? '💎' : '🛒',
            color: 'from-violet-600 to-purple-600',
        });

        // 8. Prediction / CTA slide
        const dailyAvg = totalSpent / (differenceInDays(endDate, startDate) || 1);
        const projectedMonthly = dailyAvg * 30;
        slides.push({
            id: 'prediction',
            type: 'prediction',
            title: period === 'week' ? 'W tym tempie miesięcznie' : 'Następny miesiąc',
            value: this.formatMoney(projectedMonthly),
            subtitle: 'prognoza',
            description: 'Ustaw budżet, aby kontrolować wydatki',
            icon: '🔮',
            color: 'from-indigo-600 to-violet-600',
        });

        // Period label
        const periodLabel = period === 'month'
            ? format(startDate, 'LLLL yyyy', { locale: pl })
            : `Tydzień ${format(startDate, 'd', { locale: pl })}-${format(endDate, 'd LLLL', { locale: pl })}`;

        return {
            period,
            periodLabel: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
            dateRange: `${format(startDate, 'd MMM', { locale: pl })} - ${format(endDate, 'd MMM yyyy', { locale: pl })}`,
            slides,
            totalSpent,
            totalTransactions,
            summary: {
                heroStat: this.formatMoney(totalSpent),
                topCategory: topCategory ? CATEGORY_NAMES[topCategory.category] || topCategory.category : 'Brak danych',
                bestDay: bestDay?.day || 'N/A',
                potentialSavings: Math.round(totalSpent * 0.15), // Assume 15% potential savings
            },
        };
    }

    // ===== HELPER METHODS =====

    private filterExpensesByDateRange(expenses: Expense[], start: Date, end: Date): Expense[] {
        return expenses.filter(e => {
            const date = e.date?.toDate?.() || new Date(e.date as unknown as string);
            return date >= start && date <= end;
        });
    }

    private getCategoryBreakdown(expenses: Expense[]): { category: string; amount: number }[] {
        const breakdown = expenses.reduce((acc, e) => {
            const cat = e.merchant?.category || 'other';
            acc[cat] = (acc[cat] || 0) + (e.amount || 0);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(breakdown)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }

    private getDailyBreakdown(expenses: Expense[]): { day: string; amount: number }[] {
        const breakdown = expenses.reduce((acc, e) => {
            const date = e.date?.toDate?.() || new Date(e.date as unknown as string);
            const dayKey = format(date, 'EEEE', { locale: pl });
            const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
            acc[dayLabel] = (acc[dayLabel] || 0) + (e.amount || 0);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(breakdown)
            .map(([day, amount]) => ({ day, amount }))
            .sort((a, b) => a.amount - b.amount);
    }

    private getMerchantBreakdown(expenses: Expense[]): { name: string; amount: number; count: number }[] {
        const breakdown = expenses.reduce((acc, e) => {
            const name = e.merchant?.name || 'Nieznany';
            if (!acc[name]) {
                acc[name] = { amount: 0, count: 0 };
            }
            acc[name].amount += e.amount || 0;
            acc[name].count += 1;
            return acc;
        }, {} as Record<string, { amount: number; count: number }>);

        return Object.entries(breakdown)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount);
    }

    private formatMoney(amount: number): string {
        return formatMoneyUtil(amount);
    }
}

export const wrappedService = new WrappedService();
