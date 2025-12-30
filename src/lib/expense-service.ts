/**
 * Savori Expense Service
 * Unified service for expense management with event integration
 */

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
    limit as firestoreLimit
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, ExpenseCategory, Merchant, ExpenseMetadata } from '@/types';
import { eventBus } from './event-bus';
import { cache, getMonthRange, getWeekRange } from './service-base';
import { detectAnomaly, AnomalyResult } from './anomaly-detector';
import { engagementService } from '@/lib/engagement/xp-system';
import { insightsEngine } from '@/lib/ai/insights-engine';
import { notificationService } from '@/lib/engagement/notifications';
import { Budget } from '@/types';

export interface CreateExpenseInput {
    userId: string;
    amount: number;
    merchant: {
        name: string;
        category: ExpenseCategory;
        nip?: string;
        address?: string;
    };
    date?: Date;
    items?: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    source: 'scan' | 'manual' | 'import';
    notes?: string;
    tags?: string[];
}

export interface ExpenseStats {
    totalSpent: number;
    count: number;
    avgExpense: number;
    byCategory: Record<string, { amount: number; count: number }>;
    byMerchant: Array<{ name: string; amount: number; count: number }>;
    dailyAverage: number;
}

class ExpenseService {
    private expensesRef(userId: string) {
        return collection(db, 'users', userId, 'expenses');
    }

    /**
     * Create a new expense with full event integration
     */
    async create(input: CreateExpenseInput): Promise<{
        expenseId: string;
        anomaly: AnomalyResult | null;
        xp: number;
    }> {
        const { userId, amount, merchant, date, items, source, notes, tags } = input;

        // 1. Check for anomalies before saving
        const anomaly = await detectAnomaly(userId, {
            amount,
            merchant: merchant.name,
            category: merchant.category,
            date: date || new Date(),
        });

        // 2. Create expense document
        const expenseData: Omit<Expense, 'id'> = {
            userId,
            amount,
            currency: 'PLN',
            merchant: merchant as Merchant,
            date: Timestamp.fromDate(date || new Date()),
            items: items || [],
            tags: tags || [],
            notes,
            metadata: {
                source,
                verified: source === 'manual',
                aiConfidence: source === 'scan' ? 0.9 : undefined,
            } as ExpenseMetadata,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(this.expensesRef(userId), expenseData);

        // 3. Award XP
        const actionKey = source === 'scan' ? 'scan_receipt' : 'add_expense_manual';
        const { xp } = await engagementService.awardXP(userId, actionKey);

        // 4. Emit events
        await eventBus.emit('expense:added', {
            expense: { id: docRef.id, amount, category: merchant.category, merchant: merchant.name },
            userId,
        });

        await eventBus.emit('points:awarded', {
            points: xp,
            reason: source === 'scan' ? 'Skanowanie paragonu' : 'Dodanie wydatku',
            userId,
        });

        if (anomaly.isAnomaly) {
            await eventBus.emit('ai:anomaly_detected', {
                expenseId: docRef.id,
                severity: anomaly.severity,
                reason: anomaly.reason,
                userId,
            });
        }

        // 7. Generate AI Insights & Notifications
        try {
            // Fetch necessary data
            const recentExpenses = await this.getByPeriod(userId, 'month');
            const budgetsSnap = await getDocs(collection(db, 'users', userId, 'budgets'));
            const budgets = budgetsSnap.docs.map(d => {
                const b = d.data() as Budget;
                const limits = b.categoryLimits ? Object.entries(b.categoryLimits).map(([cat, l]: [string, any]) => ({
                    category: cat as ExpenseCategory,
                    limit: l.limit,
                    spent: l.spent || 0
                })) : [];
                return limits;
            }).flat();

            const fullExpense: Expense = { ...expenseData, id: docRef.id, createdAt: Timestamp.now() } as Expense;

            // Generate insights
            const insights = insightsEngine.generateInsightsForExpense(
                fullExpense,
                recentExpenses,
                null, // Profile can be null, engine handles it
                budgets
            );

            // Send notifications for important insights
            for (const insight of insights) {
                if (insight.priority === 'critical' || insight.priority === 'high') {
                    await notificationService.send(userId, {
                        type: insight.type === 'budget_warning' ? 'budget_alert' : 'insight',
                        title: insight.title,
                        message: insight.message,
                        emoji: insight.emoji,
                        actionUrl: insight.actionUrl
                    });
                }
            }
        } catch (e) {
            console.error('Error in AI pipeline:', e);
        }

        // 7. Invalidate cache
        cache.invalidate(`expenses:${userId}`);
        cache.invalidate(`stats:${userId}`);

        return { expenseId: docRef.id, anomaly: anomaly.isAnomaly ? anomaly : null, xp };
    }

    /**
     * Get expenses for a time period
     */
    async getByPeriod(
        userId: string,
        period: 'day' | 'week' | 'month' | 'all' = 'month',
        customRange?: { start: Date; end: Date }
    ): Promise<Expense[]> {
        const cacheKey = `expenses:${userId}:${period}:${customRange?.start?.toISOString() || 'current'}`;
        const cached = cache.get<Expense[]>(cacheKey);
        if (cached) return cached;

        let range: { start: Date; end: Date };

        if (customRange) {
            range = customRange;
        } else if (period === 'month') {
            range = getMonthRange();
        } else if (period === 'week') {
            range = getWeekRange();
        } else {
            range = { start: new Date(0), end: new Date() };
        }

        const q = query(
            this.expensesRef(userId),
            where('date', '>=', Timestamp.fromDate(range.start)),
            where('date', '<=', Timestamp.fromDate(range.end)),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];

        cache.set(cacheKey, expenses, 2 * 60 * 1000); // 2 min cache
        return expenses;
    }

    /**
     * Calculate expense statistics
     */
    async getStats(userId: string, period: 'week' | 'month' = 'month'): Promise<ExpenseStats> {
        const cacheKey = `stats:${userId}:${period}`;
        const cached = cache.get<ExpenseStats>(cacheKey);
        if (cached) return cached;

        const expenses = await this.getByPeriod(userId, period);

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const count = expenses.length;
        const avgExpense = count > 0 ? totalSpent / count : 0;

        // By category
        const byCategory: Record<string, { amount: number; count: number }> = {};
        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = { amount: 0, count: 0 };
            byCategory[cat].amount += e.amount;
            byCategory[cat].count++;
        });

        // By merchant
        const merchantMap: Record<string, { amount: number; count: number }> = {};
        expenses.forEach(e => {
            const name = e.merchant?.name || 'Nieznany';
            if (!merchantMap[name]) merchantMap[name] = { amount: 0, count: 0 };
            merchantMap[name].amount += e.amount;
            merchantMap[name].count++;
        });

        const byMerchant = Object.entries(merchantMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // Daily average
        const range = period === 'month' ? getMonthRange() : getWeekRange();
        const days = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
        const dailyAverage = days > 0 ? totalSpent / days : 0;

        const stats: ExpenseStats = {
            totalSpent,
            count,
            avgExpense,
            byCategory,
            byMerchant,
            dailyAverage,
        };

        cache.set(cacheKey, stats, 5 * 60 * 1000); // 5 min cache
        return stats;
    }

    /**
     * Subscribe to real-time expense updates
     */
    subscribe(
        userId: string,
        callback: (expenses: Expense[]) => void,
        limitCount = 50
    ): () => void {
        const q = query(
            this.expensesRef(userId),
            orderBy('date', 'desc'),
            firestoreLimit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
            callback(expenses);

            // Update cache
            cache.set(`expenses:${userId}:recent`, expenses, 60 * 1000);
        });
    }

    /**
     * Delete an expense
     */
    async delete(userId: string, expenseId: string): Promise<void> {
        await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));

        await eventBus.emit('expense:deleted', { expenseId, userId });
        cache.invalidate(`expenses:${userId}`);
        cache.invalidate(`stats:${userId}`);
    }

    /**
     * Update an expense
     */
    async update(userId: string, expenseId: string, changes: Partial<Expense>): Promise<void> {
        const ref = doc(db, 'users', userId, 'expenses', expenseId);

        await updateDoc(ref, {
            ...changes,
            updatedAt: Timestamp.now(),
        });

        await eventBus.emit('expense:updated', { expenseId, changes, userId });
        cache.invalidate(`expenses:${userId}`);
        cache.invalidate(`stats:${userId}`);
    }
}

// Singleton instance
export const expenseService = new ExpenseService();
