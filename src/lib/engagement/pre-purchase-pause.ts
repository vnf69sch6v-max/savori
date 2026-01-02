/**
 * Pre-Purchase Pause Service
 * Implements 24h "cooling off" period for large purchases
 * Helps users avoid impulsive spending
 */

import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    Timestamp,
    updateDoc
} from 'firebase/firestore';

export interface PendingPurchase {
    id: string;
    userId: string;
    amount: number;          // In grosz
    description: string;
    category?: string;
    merchantName?: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;    // When the pause ends
    status: 'pending' | 'approved' | 'cancelled';
    reminderSent: boolean;
}

export interface PauseStats {
    totalPaused: number;
    totalCancelled: number;
    moneySaved: number;
    cancelRate: number;
}

// Minimum amount to trigger pause (in grosz) - 200 PLN
const PAUSE_THRESHOLD = 20000;
// Pause duration in hours
const PAUSE_DURATION_HOURS = 24;

class PrePurchasePauseService {
    /**
     * Check if amount should trigger pause
     */
    shouldTriggerPause(amount: number): boolean {
        return amount >= PAUSE_THRESHOLD;
    }

    /**
     * Get threshold in display format
     */
    getThreshold(): number {
        return PAUSE_THRESHOLD;
    }

    /**
     * Create a pending purchase
     */
    async createPendingPurchase(
        userId: string,
        amount: number,
        description: string,
        category?: string,
        merchantName?: string
    ): Promise<PendingPurchase> {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + PAUSE_DURATION_HOURS * 60 * 60 * 1000);

        const pendingRef = doc(collection(db, 'users', userId, 'pendingPurchases'));

        const pendingPurchase: Omit<PendingPurchase, 'id'> = {
            userId,
            amount,
            description,
            category,
            merchantName,
            createdAt: Timestamp.fromDate(now),
            expiresAt: Timestamp.fromDate(expiresAt),
            status: 'pending',
            reminderSent: false,
        };

        await setDoc(pendingRef, pendingPurchase);

        return {
            id: pendingRef.id,
            ...pendingPurchase,
        };
    }

    /**
     * Get all pending purchases for a user
     */
    async getPendingPurchases(userId: string): Promise<PendingPurchase[]> {
        const pendingRef = collection(db, 'users', userId, 'pendingPurchases');
        const q = query(pendingRef, where('status', '==', 'pending'));

        const snapshot = await getDocs(q);
        const now = Timestamp.now();

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as PendingPurchase))
            .filter(p => p.expiresAt.toMillis() > now.toMillis() || p.status === 'pending');
    }

    /**
     * Get expired pending purchases (ready for decision)
     */
    async getExpiredPurchases(userId: string): Promise<PendingPurchase[]> {
        const pendingRef = collection(db, 'users', userId, 'pendingPurchases');
        const q = query(pendingRef, where('status', '==', 'pending'));

        const snapshot = await getDocs(q);
        const now = Timestamp.now();

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as PendingPurchase))
            .filter(p => p.expiresAt.toMillis() <= now.toMillis());
    }

    /**
     * Approve a pending purchase (user confirms they still want it)
     */
    async approvePurchase(userId: string, purchaseId: string): Promise<void> {
        const docRef = doc(db, 'users', userId, 'pendingPurchases', purchaseId);
        await updateDoc(docRef, {
            status: 'approved',
        });
    }

    /**
     * Cancel a pending purchase (user decided not to buy)
     */
    async cancelPurchase(userId: string, purchaseId: string): Promise<void> {
        const docRef = doc(db, 'users', userId, 'pendingPurchases', purchaseId);
        await updateDoc(docRef, {
            status: 'cancelled',
        });
    }

    /**
     * Delete a pending purchase
     */
    async deletePurchase(userId: string, purchaseId: string): Promise<void> {
        const docRef = doc(db, 'users', userId, 'pendingPurchases', purchaseId);
        await deleteDoc(docRef);
    }

    /**
     * Get pause statistics for user
     */
    async getPauseStats(userId: string): Promise<PauseStats> {
        const pendingRef = collection(db, 'users', userId, 'pendingPurchases');
        const snapshot = await getDocs(pendingRef);

        const purchases = snapshot.docs.map(doc => doc.data() as Omit<PendingPurchase, 'id'>);

        const totalPaused = purchases.length;
        const cancelled = purchases.filter(p => p.status === 'cancelled');
        const totalCancelled = cancelled.length;
        const moneySaved = cancelled.reduce((sum, p) => sum + p.amount, 0);
        const cancelRate = totalPaused > 0 ? Math.round((totalCancelled / totalPaused) * 100) : 0;

        return {
            totalPaused,
            totalCancelled,
            moneySaved,
            cancelRate,
        };
    }

    /**
     * Get time remaining for a pending purchase
     */
    getTimeRemaining(purchase: PendingPurchase): { hours: number; minutes: number; expired: boolean } {
        const now = Date.now();
        const expiresAt = purchase.expiresAt.toMillis();
        const diff = expiresAt - now;

        if (diff <= 0) {
            return { hours: 0, minutes: 0, expired: true };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, expired: false };
    }

    /**
     * Format time remaining for display
     */
    formatTimeRemaining(purchase: PendingPurchase): string {
        const { hours, minutes, expired } = this.getTimeRemaining(purchase);

        if (expired) {
            return 'Gotowe do decyzji';
        }

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }

        return `${minutes} min`;
    }
}

export const prePurchasePauseService = new PrePurchasePauseService();
