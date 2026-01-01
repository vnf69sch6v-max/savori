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
    limit as firestoreLimit,
    increment,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, ExpenseCategory, Merchant, ExpenseMetadata, Budget, CategoryBudget } from '@/types';
import { eventBus } from './event-bus';
import { cache, getMonthRange, getWeekRange } from './service-base';
import { detectAnomaly, AnomalyResult } from './anomaly-detector';
import { engagementService } from '@/lib/engagement/xp-system';
import { insightsEngine } from '@/lib/ai/insights-engine';
import { notificationService } from '@/lib/engagement/notifications';
import { recurringExpensesService } from '@/lib/subscriptions/recurring-service';
import { AuditService } from './audit-service';

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
            ...(notes !== undefined && { notes }),
            metadata: {
                source,
                verified: source === 'manual',
                ...(source === 'scan' && { aiConfidence: 0.9 }),
            } as ExpenseMetadata,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(this.expensesRef(userId), expenseData);

        // 3. Parallelize post-creation operations
        const tasks = [];
        const actionKey = source === 'scan' ? 'scan_receipt' : 'add_expense_manual';

        // Task A: Award XP (Critical for engagement, but shouldn't block main flow if it fails)
        tasks.push(
            engagementService.awardXP(userId, actionKey)
                .then(({ xp }) => {
                    // Emit points awarded event
                    eventBus.emit('points:awarded', {
                        points: xp,
                        reason: source === 'scan' ? 'Skanowanie paragonu' : 'Dodanie wydatku',
                        userId,
                    });
                    return xp;
                })
                .catch(err => console.error('Error awarding XP:', err))
        );

        // Task B: Emit standard expense added event
        tasks.push(
            eventBus.emit('expense:added', {
                expense: { id: docRef.id, amount, category: merchant.category, merchant: merchant.name },
                userId,
            })
        );

        // Task C: Handle Anomaly Event if detected
        if (anomaly.isAnomaly) {
            tasks.push(
                eventBus.emit('ai:anomaly_detected', {
                    expenseId: docRef.id,
                    severity: anomaly.severity,
                    reason: anomaly.reason,
                    userId,
                })
            );
        }

        // Task D: AI Insights & Notifications (Heavy Operation)
        tasks.push(
            (async () => {
                try {
                    const [recentExpenses, budgetsSnap] = await Promise.all([
                        this.getByPeriod(userId, 'month'),
                        getDocs(collection(db, 'users', userId, 'budgets'))
                    ]);

                    const budgets = budgetsSnap.docs.map(d => {
                        const b = d.data() as Budget;
                        const limits = b.categoryLimits ? Object.entries(b.categoryLimits).map(([cat, l]: [string, CategoryBudget]) => ({
                            category: cat as ExpenseCategory,
                            limit: l.limit,
                            spent: l.spent || 0
                        })) : [];
                        return limits;
                    }).flat();

                    const fullExpense: Expense = { ...expenseData, id: docRef.id, createdAt: Timestamp.now() } as Expense;

                    const insights = insightsEngine.generateInsightsForExpense(
                        fullExpense,
                        recentExpenses,
                        null,
                        budgets
                    );

                    // Send parallel notifications
                    await Promise.all(insights.map(async insight => {
                        if (insight.priority === 'critical' || insight.priority === 'high') {
                            await notificationService.send(userId, {
                                type: insight.type === 'budget_warning' ? 'budget_alert' : 'insight',
                                title: insight.title,
                                message: insight.message,
                                emoji: insight.emoji,
                                actionUrl: insight.actionUrl
                            });
                        }
                    }));
                } catch (e) {
                    console.error('Error in AI pipeline:', e);
                }
            })()
        );

        // Task E: Subscription Detection
        tasks.push(
            (async () => {
                try {
                    const subscriptionResult = await recurringExpensesService.detectAndCreate(
                        userId,
                        merchant.name,
                        amount,
                        docRef.id
                    );

                    if (subscriptionResult?.isNew) {
                        await notificationService.send(userId, {
                            type: 'insight',
                            title: `${subscriptionResult.subscription.emoji} Wykryto subskrypcję`,
                            message: `Dodano ${subscriptionResult.subscription.name} do stałych opłat`,
                            emoji: subscriptionResult.subscription.emoji,
                            actionUrl: '/subscriptions'
                        });
                    }
                } catch (e) {
                    console.error('Error in subscription detection:', e);
                }
            })()
        );

        // Task F: Audit Log (Immutable)
        tasks.push(
            AuditService.logAction(userId, 'EXPENSE_CREATE', 'expense', docRef.id, {
                amount,
                merchant: merchant.name,
                category: merchant.category,
                source
            })
        );

        // Task G: Atomic Budget Aggregation (CRITICAL FOR READ OPTIMIZATION)
        tasks.push(
            (async () => {
                const dateObj = date || new Date();
                const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                const budgetRef = doc(db, 'users', userId, 'budgets', monthKey);

                // Ensure budget doc exists (upsert)
                await setDoc(budgetRef, {
                    totalSpent: increment(amount),
                    updatedAt: Timestamp.now()
                }, { merge: true });
            })()
        );

        // Execute all side effects and await them to ensure they complete in Serverless env
        // (Previously we didn't await, which caused Vercel to kill the process before completion)
        await Promise.allSettled(tasks);

        // 4. Invalidate cache immediately
        cache.invalidate(`expenses:${userId}`);
        cache.invalidate(`stats:${userId}`);

        // Return early, let the background tasks finish
        return { expenseId: docRef.id, anomaly: anomaly.isAnomaly ? anomaly : null, xp: 0 }; // XP is 0 because it's calculated async now, UI should handle this or rely on event
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
        limitCount = 20
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
        // Get expense first to know amount and date for budget adjustment
        const expenseRef = doc(db, 'users', userId, 'expenses', expenseId);
        const expenseSnap = await getDoc(expenseRef);

        if (!expenseSnap.exists()) return;

        const expenseData = expenseSnap.data() as Expense;

        // Audit FIRST
        await AuditService.logAction(userId, 'EXPENSE_DELETE', 'expense', expenseId);

        await deleteDoc(expenseRef);

        // Adjust Budget Aggregation
        try {
            const dateObj = expenseData.date.toDate();
            const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const budgetRef = doc(db, 'users', userId, 'budgets', monthKey);

            await updateDoc(budgetRef, {
                totalSpent: increment(-expenseData.amount),
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Failed to update budget aggregation on delete', error);
        }

        await eventBus.emit('expense:deleted', { expenseId, userId });
        cache.invalidate(`expenses:${userId}`);
        cache.invalidate(`stats:${userId}`);
    }

    /**
     * Update an expense
     */
    async update(userId: string, expenseId: string, changes: Partial<Expense>): Promise<void> {
        // Audit FIRST
        await AuditService.logAction(userId, 'EXPENSE_UPDATE', 'expense', expenseId, changes);

        const ref = doc(db, 'users', userId, 'expenses', expenseId);

        // Budget Aggregation Update
        if (changes.amount !== undefined || changes.date !== undefined) {
            try {
                const snapshot = await getDoc(ref);
                if (snapshot.exists()) {
                    const oldData = snapshot.data() as Expense;

                    // 1. Revert old amount
                    const oldDate = oldData.date.toDate();
                    const oldMonthKey = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}`;
                    const oldBudgetRef = doc(db, 'users', userId, 'budgets', oldMonthKey);

                    await updateDoc(oldBudgetRef, {
                        totalSpent: increment(-oldData.amount),
                        updatedAt: Timestamp.now()
                    });

                    // 2. Add new amount (or old amount if not changed) to new date (or old date)
                    const newAmount = changes.amount !== undefined ? changes.amount : oldData.amount;
                    const newDate = changes.date ? (changes.date as Timestamp).toDate() : oldDate;
                    const newMonthKey = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
                    const newBudgetRef = doc(db, 'users', userId, 'budgets', newMonthKey);

                    // Use setDoc with merge to ensure doc exists if moving to a new month not yet created
                    await setDoc(newBudgetRef, {
                        totalSpent: increment(newAmount),
                        updatedAt: Timestamp.now()
                    }, { merge: true });
                }
            } catch (error) {
                console.error('Failed to update budget aggregation on update', error);
            }
        }

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
