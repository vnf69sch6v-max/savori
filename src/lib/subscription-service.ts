/**
 * Savori Subscription Service
 * Manage user subscription plans and feature gating
 */

import { doc, updateDoc, Timestamp, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subscription } from '@/types';

// ============ FEATURE DEFINITIONS ============

export type FeatureId =
    | 'scan'
    | 'voice'
    | 'aiInsights'
    | 'exportPdf'
    | 'exportCsv'
    | 'social'
    | 'challenges'
    | 'groupChallenges'
    | 'prioritySupport'
    | 'unlimitedBudgets'
    | 'unlimitedGoals';

export interface PlanFeatures {
    id: 'free' | 'pro' | 'premium';
    name: string;
    subtitle: string;
    price: number;
    yearlyPrice: number;
    isHighlighted?: boolean;
    highlightBadge?: string;
    features: string[];
    limits: {
        monthlyScans: number;
        budgets: number;
        goals: number;
        voice: boolean;
        aiInsights: boolean;
        exportPdf: boolean;
        social: boolean;
        groupChallenges: boolean;
        prioritySupport: boolean;
    };
}

// ============ PLAN DEFINITIONS ============

export const SUBSCRIPTION_PLANS: PlanFeatures[] = [
    {
        id: 'free',
        name: 'Free',
        subtitle: 'Idealny na start',
        price: 0,
        yearlyPrice: 0,
        features: [
            '1 cel oszczędnościowy',
            '10 skanów/miesiąc',
            'Podstawowe statystyki',
            'Śledzenie wydatków',
        ],
        limits: {
            monthlyScans: 10,
            budgets: 1,
            goals: 1,
            voice: true,
            aiInsights: false,
            exportPdf: false,
            social: false,
            groupChallenges: false,
            prioritySupport: false,
        },
    },
    {
        id: 'pro',
        name: 'Pro',
        subtitle: 'Dla regularnych oszczędzaczy',
        price: 25,
        yearlyPrice: 199,  // ~16.60/mies
        features: [
            'Wszystko z Free',
            '5 celów oszczędnościowych',
            '50 skanów/miesiąc',
            'Automatyczne reguły',
            'Tygodniowe raporty',
        ],
        limits: {
            monthlyScans: 50,
            budgets: 5,
            goals: 5,
            voice: true,
            aiInsights: false,
            exportPdf: false,
            social: true,
            groupChallenges: false,
            prioritySupport: false,
        },
    },
    {
        id: 'premium',
        name: 'Ultimate',
        subtitle: 'Pełna kontrola finansów',
        price: 30,
        yearlyPrice: 249,  // ~20.75/mies
        isHighlighted: true,
        highlightBadge: 'Tylko 5 zł więcej!',
        features: [
            'Wszystko z Pro',
            'Nieograniczone cele',
            'Nieograniczone skany',
            'AI Financial Coach',
            'Predykcje wydatków',
            'Eksport danych',
            'Priority support',
        ],
        limits: {
            monthlyScans: Infinity,
            budgets: Infinity,
            goals: Infinity,
            voice: true,
            aiInsights: true,
            exportPdf: true,
            social: true,
            groupChallenges: true,
            prioritySupport: true,
        },
    },
];

// ============ SUBSCRIPTION SERVICE ============

class SubscriptionService {
    /**
     * Get plan by ID
     */
    getPlan(planId: 'free' | 'pro' | 'premium'): PlanFeatures | undefined {
        return SUBSCRIPTION_PLANS.find(p => p.id === planId);
    }

    /**
     * Check if user can use a specific feature
     */
    canUseFeature(
        subscription: Subscription | undefined,
        feature: keyof PlanFeatures['limits']
    ): boolean {
        const planId = subscription?.plan || 'free';
        const plan = this.getPlan(planId);
        if (!plan) return false;

        const value = plan.limits[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        return false;
    }

    /**
     * Get limit for a numeric feature
     */
    getLimit(
        subscription: Subscription | undefined,
        feature: 'monthlyScans' | 'budgets' | 'goals'
    ): number {
        const planId = subscription?.plan || 'free';
        const plan = this.getPlan(planId);
        return plan?.limits[feature] || 0;
    }

    /**
     * Check if user can scan more receipts this month
     */
    async canScanMore(userId: string, subscription: Subscription | undefined): Promise<boolean> {
        const limit = this.getLimit(subscription, 'monthlyScans');
        if (limit === Infinity) return true;

        const usage = await this.getMonthlyUsage(userId);
        return usage.scans < limit;
    }

    /**
     * Get monthly usage for a user
     */
    async getMonthlyUsage(userId: string): Promise<{ scans: number; month: string }> {
        const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
        const usageRef = doc(db, 'users', userId, 'usage', monthKey);

        try {
            const snap = await getDoc(usageRef);
            if (snap.exists()) {
                return { scans: snap.data().scans || 0, month: monthKey };
            }
        } catch (e) {
            console.error('Error getting usage:', e);
        }

        return { scans: 0, month: monthKey };
    }

    /**
     * Increment scan count for current month
     */
    async incrementScanCount(userId: string): Promise<void> {
        const monthKey = new Date().toISOString().slice(0, 7);
        const usageRef = doc(db, 'users', userId, 'usage', monthKey);

        await setDoc(usageRef, {
            scans: increment(1),
            updatedAt: Timestamp.now(),
        }, { merge: true });
    }

    /**
     * Get remaining scans for free users
     */
    async getRemainingScans(userId: string, subscription: Subscription | undefined): Promise<number> {
        const limit = this.getLimit(subscription, 'monthlyScans');
        if (limit === Infinity) return Infinity;

        const usage = await this.getMonthlyUsage(userId);
        return Math.max(0, limit - usage.scans);
    }

    /**
     * Upgrade subscription
     */
    async upgradeSubscription(
        userId: string,
        newPlan: 'free' | 'pro' | 'premium',
        yearly: boolean = false
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const userRef = doc(db, 'users', userId);
            const validUntil = new Date();
            validUntil.setMonth(validUntil.getMonth() + (yearly ? 12 : 1));

            await updateDoc(userRef, {
                'subscription.plan': newPlan,
                'subscription.validUntil': Timestamp.fromDate(validUntil),
                'subscription.yearly': yearly,
                'subscription.stripeCustomerId': `test_${userId.substring(0, 8)}`,
            });

            return { success: true };
        } catch (error) {
            console.error('Subscription upgrade error:', error);
            return { success: false, error: 'Błąd aktualizacji subskrypcji' };
        }
    }

    /**
     * Check if subscription is valid
     */
    isSubscriptionValid(subscription: Subscription | undefined): boolean {
        if (!subscription) return false;
        if (subscription.plan === 'free') return true;
        if (!subscription.validUntil) return false;

        const validUntil = subscription.validUntil.toDate();
        return validUntil > new Date();
    }

    /**
     * Get effective plan (considering expiry)
     */
    getEffectivePlan(subscription: Subscription | undefined): 'free' | 'pro' | 'premium' {
        if (!subscription) return 'free';
        if (!this.isSubscriptionValid(subscription)) return 'free';
        return subscription.plan;
    }
}

// Singleton export
export const subscriptionService = new SubscriptionService();
