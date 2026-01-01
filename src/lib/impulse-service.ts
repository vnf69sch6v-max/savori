import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ImpulseLock } from '@/types';

export const impulseService = {
    /**
     * Create a new Impulse Lock
     */
    async createLock(userId: string, amount: number, durationHours: number, reason?: string): Promise<string> {
        try {
            const now = new Date();
            const unlocksAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

            const newLock: Omit<ImpulseLock, 'id'> = {
                userId,
                amount,
                reason: reason || 'Impuls',
                lockedAt: Timestamp.fromDate(now),
                unlocksAt: Timestamp.fromDate(unlocksAt),
                status: 'locked',
            };

            const docRef = await addDoc(collection(db, 'users', userId, 'impulse_locks'), newLock);
            return docRef.id;
        } catch (error) {
            console.error('Error creating impulse lock:', error);
            throw error;
        }
    }
};
