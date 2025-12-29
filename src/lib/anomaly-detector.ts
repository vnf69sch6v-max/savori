import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from '@/types';
import { subDays, startOfMonth } from 'date-fns';

export interface AnomalyResult {
    isAnomaly: boolean;
    type: 'high_amount' | 'new_category' | 'new_merchant' | 'unusual_frequency' | null;
    severity: 'low' | 'medium' | 'high';
    reason: string;
    comparison?: {
        current: number;
        average: number;
        multiplier: number;
    };
}

/**
 * Detect anomalies in a new expense
 */
export async function detectAnomaly(
    userId: string,
    newExpense: {
        amount: number;
        merchant: string;
        category: string;
        date: Date;
    }
): Promise<AnomalyResult> {
    try {
        // Fetch recent expenses for analysis
        const expensesRef = collection(db, 'users', userId, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'), limit(200));
        const snapshot = await getDocs(q);
        const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];

        if (expenses.length < 5) {
            // Not enough data to detect anomalies
            return { isAnomaly: false, type: null, severity: 'low', reason: '' };
        }

        // Check 1: High amount for category
        const categoryExpenses = expenses.filter(
            e => e.merchant?.category === newExpense.category
        );

        if (categoryExpenses.length > 0) {
            const categoryAvg = categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / categoryExpenses.length;
            const multiplier = newExpense.amount / categoryAvg;

            if (multiplier >= 5) {
                return {
                    isAnomaly: true,
                    type: 'high_amount',
                    severity: 'high',
                    reason: `Ten wydatek jest ${multiplier.toFixed(1)}× wyższy niż twoje średnie zakupy w tej kategorii`,
                    comparison: {
                        current: newExpense.amount,
                        average: categoryAvg,
                        multiplier,
                    },
                };
            } else if (multiplier >= 3) {
                return {
                    isAnomaly: true,
                    type: 'high_amount',
                    severity: 'medium',
                    reason: `Ten wydatek jest ${multiplier.toFixed(1)}× wyższy od średniej w tej kategorii`,
                    comparison: {
                        current: newExpense.amount,
                        average: categoryAvg,
                        multiplier,
                    },
                };
            }
        }

        // Check 2: New merchant with high amount
        const merchantExpenses = expenses.filter(
            e => e.merchant?.name?.toLowerCase() === newExpense.merchant.toLowerCase()
        );

        if (merchantExpenses.length === 0) {
            // First purchase at this merchant
            const overallAvg = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;

            if (newExpense.amount > overallAvg * 3) {
                return {
                    isAnomaly: true,
                    type: 'new_merchant',
                    severity: 'medium',
                    reason: `Pierwszy zakup w "${newExpense.merchant}" na wysoką kwotę`,
                    comparison: {
                        current: newExpense.amount,
                        average: overallAvg,
                        multiplier: newExpense.amount / overallAvg,
                    },
                };
            }
        }

        // Check 3: Category not used in 30+ days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentCategoryExpenses = categoryExpenses.filter(e => {
            const date = e.date?.toDate?.();
            return date && date > thirtyDaysAgo;
        });

        if (categoryExpenses.length > 0 && recentCategoryExpenses.length === 0) {
            return {
                isAnomaly: true,
                type: 'new_category',
                severity: 'low',
                reason: `Pierwszy wydatek w kategorii "${newExpense.category}" od ponad 30 dni`,
            };
        }

        // Check 4: Unusual frequency (multiple high expenses same day)
        const today = newExpense.date.toISOString().split('T')[0];
        const todayExpenses = expenses.filter(e => {
            const date = e.date?.toDate?.();
            return date && date.toISOString().split('T')[0] === today;
        });

        const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0) + newExpense.amount;
        const dailyAvg = expenses.reduce((sum, e) => sum + e.amount, 0) / 30; // Rough monthly daily avg

        if (todayTotal > dailyAvg * 5 && todayExpenses.length >= 3) {
            return {
                isAnomaly: true,
                type: 'unusual_frequency',
                severity: 'medium',
                reason: `Dzisiejsze wydatki (${(todayTotal / 100).toFixed(2)} zł) są 5× wyższe od średniej dziennej`,
                comparison: {
                    current: todayTotal,
                    average: dailyAvg,
                    multiplier: todayTotal / dailyAvg,
                },
            };
        }

        // No anomaly detected
        return { isAnomaly: false, type: null, severity: 'low', reason: '' };

    } catch (error) {
        console.error('Anomaly detection error:', error);
        return { isAnomaly: false, type: null, severity: 'low', reason: '' };
    }
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: AnomalyResult['severity']): string {
    switch (severity) {
        case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: AnomalyResult['severity']): string {
    switch (severity) {
        case 'high': return '🚨';
        case 'medium': return '⚠️';
        case 'low': return 'ℹ️';
    }
}
