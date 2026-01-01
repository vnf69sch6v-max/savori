import { collection, query, orderBy, limit, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import { Expense, Budget } from '@/types';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from 'date-fns';

export interface SpendingPrediction {
    currentSpent: number;
    predictedTotal: number;
    budgetLimit: number | null;
    daysRemaining: number;
    daysElapsed: number;
    dailyAverage: number;
    predictedDailyBudget: number;
    willExceedBudget: boolean;
    excessAmount: number;
    confidence: number;
    breakdown: {
        category: string;
        spent: number;
        predicted: number;
        trend: 'up' | 'down' | 'stable';
    }[];
}

/**
 * Predict spending for the rest of the month
 */
export async function predictMonthlySpending(userId: string): Promise<SpendingPrediction> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const daysElapsed = differenceInDays(now, monthStart) + 1;
    const daysRemaining = daysInMonth - daysElapsed;

    // Fetch expenses from last 3 months
    const threeMonthsAgo = startOfMonth(subMonths(now, 3));
    const expensesRef = collection(db, 'users', userId, 'expenses');
    const budgetsRef = collection(db, 'users', userId, 'budgets');

    // Parallelize independent queries
    const [expensesSnap, budgetsSnap] = await Promise.all([
        getDocs(query(expensesRef, orderBy('date', 'desc'), where('date', '>=', Timestamp.fromDate(threeMonthsAgo)), limit(1000))),
        getDocs(budgetsRef)
    ]);

    const allExpenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
    const budgets = budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Budget[];

    // Current month expenses
    const thisMonthExpenses = allExpenses.filter(e => {
        const date = e.date?.toDate?.();
        return date && date >= monthStart;
    });

    const currentSpent = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Last month expenses (for comparison)
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastMonthExpenses = allExpenses.filter(e => {
        const date = e.date?.toDate?.();
        return date && date >= lastMonthStart && date <= lastMonthEnd;
    });

    // Calculate daily average (weighted: recent days count more)
    const dailySpending: Record<number, number> = {};
    thisMonthExpenses.forEach(e => {
        const date = e.date?.toDate?.();
        if (date) {
            const day = date.getDate();
            dailySpending[day] = (dailySpending[day] || 0) + (e.amount || 0);
        }
    });

    // Simple prediction: extrapolate from current spending
    const dailyAverage = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
    const predictedTotal = currentSpent + (dailyAverage * daysRemaining);

    // Get budget
    const currentBudget = budgets.find(b => b.month === format(now, 'yyyy-MM'));
    const budgetLimit = currentBudget?.totalLimit || null;

    // Calculate recommended daily budget
    const predictedDailyBudget = budgetLimit && daysRemaining > 0
        ? (budgetLimit - currentSpent) / daysRemaining
        : dailyAverage;

    // Check if will exceed
    const willExceedBudget = budgetLimit !== null && predictedTotal > budgetLimit;
    const excessAmount = willExceedBudget ? predictedTotal - budgetLimit! : 0;

    // Category breakdown with trends
    const categorySpending: Record<string, { spent: number; lastMonth: number }> = {};

    thisMonthExpenses.forEach(e => {
        const cat = e.merchant?.category || 'other';
        if (!categorySpending[cat]) categorySpending[cat] = { spent: 0, lastMonth: 0 };
        categorySpending[cat].spent += e.amount || 0;
    });

    lastMonthExpenses.forEach(e => {
        const cat = e.merchant?.category || 'other';
        if (!categorySpending[cat]) categorySpending[cat] = { spent: 0, lastMonth: 0 };
        categorySpending[cat].lastMonth += e.amount || 0;
    });

    const breakdown = Object.entries(categorySpending)
        .map(([category, data]) => {
            const projectedTotal = daysElapsed > 0
                ? (data.spent / daysElapsed) * daysInMonth
                : 0;
            const trend = data.lastMonth > 0
                ? projectedTotal > data.lastMonth * 1.1
                    ? 'up'
                    : projectedTotal < data.lastMonth * 0.9
                        ? 'down'
                        : 'stable'
                : 'stable';

            return {
                category,
                spent: data.spent,
                predicted: projectedTotal,
                trend: trend as 'up' | 'down' | 'stable',
            };
        })
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

    // Confidence based on data available
    const confidence = Math.min(100, (daysElapsed / daysInMonth) * 100 + 20);

    return {
        currentSpent,
        predictedTotal,
        budgetLimit,
        daysRemaining,
        daysElapsed,
        dailyAverage,
        predictedDailyBudget,
        willExceedBudget,
        excessAmount,
        confidence,
        breakdown,
    };
}

/**
 * Get prediction status color
 */
export function getPredictionStatus(prediction: SpendingPrediction): {
    color: string;
    status: 'safe' | 'warning' | 'danger';
    message: string;
} {
    if (!prediction.budgetLimit) {
        return {
            color: 'text-blue-400',
            status: 'safe',
            message: 'Ustaw budżet, aby śledzić prognozę',
        };
    }

    const utilizationPercent = (prediction.predictedTotal / prediction.budgetLimit) * 100;

    if (utilizationPercent > 100) {
        return {
            color: 'text-red-400',
            status: 'danger',
            message: `Prognoza przekroczenia o ${(prediction.excessAmount / 100).toFixed(0)} zł`,
        };
    } else if (utilizationPercent > 85) {
        return {
            color: 'text-amber-400',
            status: 'warning',
            message: 'Zbliżasz się do limitu budżetu',
        };
    } else {
        return {
            color: 'text-emerald-400',
            status: 'safe',
            message: 'Jesteś na dobrej drodze',
        };
    }
}
