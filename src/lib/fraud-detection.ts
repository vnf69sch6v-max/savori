import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from '@/types';

// Cache for fraud detection to reduce reads
let fraudCache: { userId: string; expenses: Expense[]; timestamp: number } = {
    userId: '',
    expenses: [],
    timestamp: 0
};
const CACHE_TTL = 1 * 60 * 1000; // 1 minute

export interface FraudCheckResult {
    isDuplicate: boolean;
    confidence: number;
    reason?: string;
    similarReceiptId?: string;
    shouldProceed: boolean;
}

/**
 * Generate a simple hash from receipt data for exact duplicate detection
 */
export function generateReceiptHash(data: {
    merchantName: string;
    amount: number;
    date: Date;
    itemsCount?: number;
}): string {
    const normalized = [
        data.merchantName.toLowerCase().trim(),
        data.amount.toString(),
        data.date.toISOString().split('T')[0],
        data.itemsCount?.toString() || '0',
    ].join('|');

    // Simple hash function (for production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

/**
 * Check for potential duplicate receipts
 */
export async function checkForDuplicate(
    userId: string,
    receiptData: {
        merchantName: string;
        amount: number;
        date: Date;
        itemsCount?: number;
    }
): Promise<FraudCheckResult> {
    try {
        // Generate hash for this receipt
        const hash = generateReceiptHash(receiptData);

        const now = Date.now();
        let recentExpenses: Expense[];

        // Use cached expenses if available
        if (fraudCache.userId === userId && (now - fraudCache.timestamp) < CACHE_TTL) {
            recentExpenses = fraudCache.expenses;
        } else {
            // Get recent expenses - REDUCED from 50 to 30
            const expensesRef = collection(db, 'users', userId, 'expenses');
            const q = query(expensesRef, orderBy('date', 'desc'), limit(30));
            const snapshot = await getDocs(q);
            recentExpenses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];

            // Cache the result
            fraudCache = { userId, expenses: recentExpenses, timestamp: now };
        }

        // Check 1: Exact hash match (same store, amount, date, items)
        for (const expense of recentExpenses) {
            const expenseHash = generateReceiptHash({
                merchantName: expense.merchant?.name || '',
                amount: expense.amount,
                date: expense.date?.toDate?.() || new Date(),
                itemsCount: expense.items?.length,
            });

            if (expenseHash === hash) {
                return {
                    isDuplicate: true,
                    confidence: 100,
                    reason: 'Identyczny paragon już istnieje w systemie',
                    similarReceiptId: expense.id,
                    shouldProceed: false,
                };
            }
        }

        // Check 2: Same store + similar amount + same day
        const receiptDateStr = receiptData.date.toISOString().split('T')[0];

        for (const expense of recentExpenses) {
            const expenseDate = expense.date?.toDate?.() || new Date();
            const expenseDateStr = expenseDate.toISOString().split('T')[0];

            const sameMerchant = expense.merchant?.name?.toLowerCase().trim() ===
                receiptData.merchantName.toLowerCase().trim();
            const sameDay = expenseDateStr === receiptDateStr;
            const amountDiff = Math.abs(expense.amount - receiptData.amount);
            const amountSimilarity = amountDiff / Math.max(expense.amount, receiptData.amount);

            // Same store, same day, very similar amount
            if (sameMerchant && sameDay && amountSimilarity < 0.05) {
                return {
                    isDuplicate: true,
                    confidence: 95,
                    reason: `Podobny paragon z ${expense.merchant?.name} na kwotę ${(expense.amount / 100).toFixed(2)} zł już istnieje`,
                    similarReceiptId: expense.id,
                    shouldProceed: false,
                };
            }

            // Same store, same day, similar amount - warn but allow
            if (sameMerchant && sameDay && amountSimilarity < 0.2) {
                return {
                    isDuplicate: false,
                    confidence: 70,
                    reason: `Znaleziono podobny paragon z tego samego dnia`,
                    similarReceiptId: expense.id,
                    shouldProceed: true, // Allow but warn
                };
            }
        }

        // Check 3: Same store + exact amount + within 1 hour (scanned twice)
        for (const expense of recentExpenses) {
            const expenseDate = expense.date?.toDate?.() || new Date();
            const timeDiff = Math.abs(receiptData.date.getTime() - expenseDate.getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            const sameMerchant = expense.merchant?.name?.toLowerCase().trim() ===
                receiptData.merchantName.toLowerCase().trim();
            const sameAmount = expense.amount === receiptData.amount;

            if (sameMerchant && sameAmount && hoursDiff < 1) {
                return {
                    isDuplicate: true,
                    confidence: 90,
                    reason: 'Wykryto potencjalny zduplikowany skan paragonu',
                    similarReceiptId: expense.id,
                    shouldProceed: false,
                };
            }
        }

        // No duplicate found
        return {
            isDuplicate: false,
            confidence: 0,
            shouldProceed: true,
        };

    } catch (error) {
        console.error('Fraud check error:', error);
        // On error, allow the transaction but log it
        return {
            isDuplicate: false,
            confidence: 0,
            reason: 'Nie udało się sprawdzić duplikatów',
            shouldProceed: true,
        };
    }
}

/**
 * Fuzzy string matching for merchant names
 */
export function merchantNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 1;

    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) return 0.9;

    // Simple Levenshtein-like distance
    const longer = n1.length > n2.length ? n1 : n2;
    const shorter = n1.length > n2.length ? n2 : n1;

    if (longer.length === 0) return 1;

    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
}
