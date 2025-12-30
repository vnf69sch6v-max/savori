/**
 * Savori Subscription Service
 * Manage user subscription plans
 */

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subscription } from '@/types';

// ============ PLAN FEATURES ============

export interface PlanFeatures {
    id: 'free' | 'pro' | 'premium';
    name: string;
    price: number; // PLN per month
    features: string[];
    limits: {
        monthlyScans: number;
        aiInsights: boolean;
        exportFormats: ('csv' | 'pdf')[];
        socialFeatures: boolean;
        prioritySupport: boolean;
    };
}

export const SUBSCRIPTION_PLANS: PlanFeatures[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
            'Do 10 skanów miesięcznie',
            'Podstawowe statystyki',
            'Eksport CSV',
            'Wyzwania solo',
        ],
        limits: {
            monthlyScans: 10,
            aiInsights: false,
            exportFormats: ['csv'],
            socialFeatures: false,
            prioritySupport: false,
        },
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 19.99,
        features: [
            'Nielimitowane skany',
            'AI Insights',
            'Eksport CSV & PDF',
            'Znajomi & ranking',
            'Wszystkie wyzwania',
        ],
        limits: {
            monthlyScans: Infinity,
            aiInsights: true,
            exportFormats: ['csv', 'pdf'],
            socialFeatures: true,
            prioritySupport: false,
        },
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 39.99,
        features: [
            'Wszystko z Pro',
            'Priorytetowe wsparcie',
            'Wczesny dostęp do nowości',
            'Ekskluzywne odznaki',
            'Group challenges',
        ],
        limits: {
            monthlyScans: Infinity,
            aiInsights: true,
            exportFormats: ['csv', 'pdf'],
            socialFeatures: true,
            prioritySupport: true,
        },
    },
];

// ============ SUBSCRIPTION SERVICE ============

class SubscriptionService {

    /**
     * Get plan features
     */
    getPlan(planId: 'free' | 'pro' | 'premium'): PlanFeatures | undefined {
        return SUBSCRIPTION_PLANS.find(p => p.id === planId);
    }

    /**
     * Check if user has access to a feature
     */
    hasFeature(
        subscription: Subscription | undefined,
        feature: keyof PlanFeatures['limits']
    ): boolean {
        const planId = subscription?.plan || 'free';
        const plan = this.getPlan(planId);
        if (!plan) return false;

        const value = plan.limits[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        if (Array.isArray(value)) return value.length > 0;
        return false;
    }

    /**
     * Check monthly scan limit
     */
    canScanMore(subscription: Subscription | undefined, currentScans: number): boolean {
        const planId = subscription?.plan || 'free';
        const plan = this.getPlan(planId);
        if (!plan) return false;
        return currentScans < plan.limits.monthlyScans;
    }

    /**
     * Upgrade subscription (test mode - no payment)
     */
    async upgradeSubscription(
        userId: string,
        newPlan: 'free' | 'pro' | 'premium'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const userRef = doc(db, 'users', userId);

            // In production, this would integrate with Stripe
            // For now, we simulate an upgrade
            const validUntil = new Date();
            validUntil.setMonth(validUntil.getMonth() + 1);

            await updateDoc(userRef, {
                'subscription.plan': newPlan,
                'subscription.validUntil': Timestamp.fromDate(validUntil),
                'subscription.stripeCustomerId': `test_customer_${userId.substring(0, 8)}`,
            });

            return { success: true };
        } catch (error) {
            console.error('Subscription upgrade error:', error);
            return { success: false, error: 'Błąd aktualizacji subskrypcji' };
        }
    }

    /**
     * Downgrade to free
     */
    async downgradeToFree(userId: string): Promise<boolean> {
        try {
            const userRef = doc(db, 'users', userId);

            await updateDoc(userRef, {
                'subscription.plan': 'free',
                'subscription.validUntil': null,
            });

            return true;
        } catch (error) {
            console.error('Downgrade error:', error);
            return false;
        }
    }

    /**
     * Check if subscription is still valid
     */
    isSubscriptionValid(subscription: Subscription | undefined): boolean {
        if (!subscription) return false;
        if (subscription.plan === 'free') return true;
        if (!subscription.validUntil) return false;

        const validUntil = subscription.validUntil.toDate();
        return validUntil > new Date();
    }
}

// Singleton export
export const subscriptionService = new SubscriptionService();
