/**
 * Recurring Expenses Service
 * Manage subscriptions and recurring payments
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { detectSubscription, KnownSubscription } from './known-services';
import { ExpenseCategory } from '@/types';

// ============ TYPES ============

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringExpense {
    id: string;
    name: string;
    amount: number;                    // grosze
    category: ExpenseCategory;
    frequency: RecurringFrequency;
    nextDueDate: Timestamp;
    lastPaidDate?: Timestamp;
    autoDetected: boolean;
    isActive: boolean;
    emoji: string;
    color?: string;
    linkedExpenseIds: string[];        // Related expense document IDs
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CreateRecurringInput {
    name: string;
    amount: number;
    category?: ExpenseCategory;
    frequency?: RecurringFrequency;
    emoji?: string;
    color?: string;
    autoDetected?: boolean;
    notes?: string;
}

// ============ FREQUENCY HELPERS ============

function getNextDueDate(frequency: RecurringFrequency, fromDate: Date = new Date()): Date {
    const next = new Date(fromDate);

    switch (frequency) {
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'quarterly':
            next.setMonth(next.getMonth() + 3);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
    }

    return next;
}

function getFrequencyLabel(frequency: RecurringFrequency): string {
    const labels: Record<RecurringFrequency, string> = {
        weekly: 'tygodniowo',
        monthly: 'miesięcznie',
        quarterly: 'kwartalnie',
        yearly: 'rocznie',
    };
    return labels[frequency];
}

function getMonthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
    switch (frequency) {
        case 'weekly':
            return amount * 4.33;
        case 'monthly':
            return amount;
        case 'quarterly':
            return amount / 3;
        case 'yearly':
            return amount / 12;
    }
}

// ============ SERVICE CLASS ============

class RecurringExpensesService {

    private getCollection(userId: string) {
        return collection(db, 'users', userId, 'recurringExpenses');
    }

    /**
     * Create a new recurring expense
     */
    async create(
        userId: string,
        input: CreateRecurringInput
    ): Promise<{ id: string; isNew: boolean }> {
        // Check if this subscription already exists
        const existing = await this.findByName(userId, input.name);

        if (existing) {
            // Update with new amount if different
            if (existing.amount !== input.amount) {
                await this.update(userId, existing.id, {
                    amount: input.amount,
                    lastPaidDate: Timestamp.now(),
                });
            }
            return { id: existing.id, isNew: false };
        }

        // Detect subscription info
        const detected = detectSubscription(input.name);

        const data: Omit<RecurringExpense, 'id'> = {
            name: detected?.name || input.name,
            amount: input.amount,
            category: input.category || detected?.category as ExpenseCategory || 'subscriptions',
            frequency: input.frequency || detected?.frequency || 'monthly',
            nextDueDate: Timestamp.fromDate(getNextDueDate(input.frequency || detected?.frequency || 'monthly')),
            lastPaidDate: Timestamp.now(),
            autoDetected: input.autoDetected ?? !!detected,
            isActive: true,
            emoji: input.emoji || detected?.emoji || '💳',
            color: input.color || detected?.color,
            linkedExpenseIds: [],
            notes: input.notes || '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(this.getCollection(userId), data);

        return { id: docRef.id, isNew: true };
    }

    /**
     * Find recurring expense by name (fuzzy match)
     */
    async findByName(userId: string, name: string): Promise<RecurringExpense | null> {
        const snapshot = await getDocs(this.getCollection(userId));
        const normalized = name.toLowerCase().trim();

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as Omit<RecurringExpense, 'id'>;
            if (data.name.toLowerCase().includes(normalized) ||
                normalized.includes(data.name.toLowerCase())) {
                return { id: docSnap.id, ...data };
            }
        }

        return null;
    }

    /**
     * Get all recurring expenses for user
     */
    async getAll(userId: string): Promise<RecurringExpense[]> {
        const q = query(
            this.getCollection(userId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as RecurringExpense[];
    }

    /**
     * Subscribe to recurring expenses (real-time)
     */
    subscribe(
        userId: string,
        callback: (expenses: RecurringExpense[]) => void
    ): () => void {
        const q = query(
            this.getCollection(userId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const expenses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RecurringExpense[];
            callback(expenses);
        });
    }

    /**
     * Update recurring expense
     */
    async update(
        userId: string,
        expenseId: string,
        updates: Partial<RecurringExpense>
    ): Promise<void> {
        const docRef = doc(this.getCollection(userId), expenseId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Mark a recurring expense as paid (updates dates)
     */
    async markAsPaid(
        userId: string,
        expenseId: string,
        linkedExpenseId?: string
    ): Promise<void> {
        const docRef = doc(this.getCollection(userId), expenseId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return;

        const data = docSnap.data() as RecurringExpense;
        const linkedIds = linkedExpenseId
            ? [...(data.linkedExpenseIds || []), linkedExpenseId]
            : data.linkedExpenseIds;

        await updateDoc(docRef, {
            lastPaidDate: Timestamp.now(),
            nextDueDate: Timestamp.fromDate(getNextDueDate(data.frequency)),
            linkedExpenseIds: linkedIds,
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Deactivate a recurring expense (soft delete)
     */
    async deactivate(userId: string, expenseId: string): Promise<void> {
        await this.update(userId, expenseId, { isActive: false });
    }

    /**
     * Delete a recurring expense permanently
     */
    async delete(userId: string, expenseId: string): Promise<void> {
        const docRef = doc(this.getCollection(userId), expenseId);
        await deleteDoc(docRef);
    }

    /**
     * Get upcoming payments (due within N days)
     */
    async getUpcoming(userId: string, daysAhead: number = 7): Promise<RecurringExpense[]> {
        const all = await this.getAll(userId);
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return all.filter(expense => {
            const dueDate = expense.nextDueDate.toDate();
            return dueDate >= now && dueDate <= futureDate;
        });
    }

    /**
     * Get monthly total of all active subscriptions
     */
    async getMonthlyTotal(userId: string): Promise<number> {
        const all = await this.getAll(userId);

        return all.reduce((total, expense) => {
            return total + getMonthlyEquivalent(expense.amount, expense.frequency);
        }, 0);
    }

    /**
     * Detect and create recurring expense from a regular expense
     * Returns the detected subscription info if found
     */
    async detectAndCreate(
        userId: string,
        merchantName: string,
        amount: number,
        expenseId: string
    ): Promise<{ subscription: KnownSubscription; isNew: boolean } | null> {
        const detected = detectSubscription(merchantName);

        if (!detected) return null;

        const result = await this.create(userId, {
            name: detected.name,
            amount,
            category: detected.category as ExpenseCategory,
            frequency: detected.frequency,
            emoji: detected.emoji,
            color: detected.color,
            autoDetected: true,
        });

        // Link the expense to the recurring expense
        if (result.id) {
            await this.markAsPaid(userId, result.id, expenseId);
        }

        return { subscription: detected, isNew: result.isNew };
    }
}

// Singleton export
export const recurringExpensesService = new RecurringExpensesService();

// Helper exports
export { getFrequencyLabel, getMonthlyEquivalent, getNextDueDate };
