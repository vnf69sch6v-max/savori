import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { SNBLProduct, SNBLGoal, MerchantBoost } from '@/types';

export const snblService = {
    /**
     * Create a new SNBL Goal from a product
     */
    async createGoal(userId: string, product: SNBLProduct): Promise<string> {
        try {
            // Calculate initial boost if applicable (e.g. cashback on start)
            // For now, let's say the boost comes when you complete it, 
            // BUT maybe a small "sign up bonus" boost is nice gamification.
            const boosts: MerchantBoost[] = [];

            // Check for cashback boost
            const cashbackOffer = product.boosts.find(b => b.typeLabel.toLowerCase().includes('cashback'));

            // Optional: Add a "Locked" boost wrapper if needed, but for MVP standard goal

            const newGoal: Omit<SNBLGoal, 'id'> = {
                userId,
                productId: product.id,
                productName: product.name,
                productImageUrl: product.imageUrl,
                targetAmount: product.price,
                currentAmount: 0,
                merchantBoosts: boosts, // Boosts tracked separately or applied as contributions? 
                // Let's keep boosts metadata here, and apply value in currentAmount if "paid"
                status: 'saving',
                createdAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(db, 'users', userId, 'snbl_goals'), newGoal);
            return docRef.id;
        } catch (error) {
            console.error('Error creating SNBL goal:', error);
            throw error;
        }
    }
};
