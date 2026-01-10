/**
 * Savori Subscription Service
 * Manage user subscription plans and feature gating
 */

import { doc, updateDoc, Timestamp, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subscription, UserUsage } from '@/types';

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
    id: 'free' | 'pro' | 'ultra';
    name: string;
    subtitle: string;
    price: number;
    yearlyPrice: number;
    isHighlighted?: boolean;
    highlightBadge?: string;
    features: string[];
    limits: {
        monthlyScans: number;
        dailyAiMessages: number;
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
            '5 wiadomości AI/dzień',
            'Podstawowe statystyki',
            'Śledzenie wydatków',
        ],
        limits: {
            monthlyScans: 10,
            dailyAiMessages: 5,
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
        price: 2499,
        yearlyPrice: 19900,  // ~16.60/mies
        features: [
            'Wszystko z Free',
            '5 celów oszczędnościowych',
            '50 skanów/miesiąc',
            '50 wiadomości AI/dzień',
            'Automatyczne reguły',
            'Tygodniowe raporty',
        ],
        limits: {
            monthlyScans: 50,
            dailyAiMessages: 50,
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
        id: 'ultra',
        name: 'Ultimate',
        subtitle: 'Pełna kontrola finansów',
        price: 3999,
        yearlyPrice: 34900,  // ~29.00/mies
        isHighlighted: true,
        highlightBadge: 'Tylko 15 zł więcej!',
        features: [
            'Wszystko z Pro',
            'Nieograniczone cele',
            'Nieograniczone skany',
            'Nieograniczone wiadomości AI',
            'AI Financial Coach',
            'Predykcje wydatków',
            'Eksport danych',
            'Priority support',
        ],
        limits: {
            monthlyScans: Infinity,
            dailyAiMessages: Infinity,
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
    getPlan(planId: 'free' | 'pro' | 'ultra'): PlanFeatures | undefined {
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
        feature: 'monthlyScans' | 'budgets' | 'goals' | 'dailyAiMessages'
    ): number {
        const planId = subscription?.plan || 'free';
        const plan = this.getPlan(planId);
        return plan?.limits[feature] || 0;
    }

    // ============ USAGE TRACKING ============

    /**
     * Get current usage from user object
     * Normalizes defaults if fields are missing
     */
    getCurrentUsage(userUsage: UserUsage | undefined): {
        scans: number;
        aiMessages: number;
        scansRemaining: number;
        aiMessagesRemaining: number;
    } {
        // This is a helper for UI, but logic should be separate
        return {
            scans: userUsage?.scanCount || 0,
            aiMessages: userUsage?.aiChatCount || 0,
            scansRemaining: 0, // Placeholder
            aiMessagesRemaining: 0 // Placeholder
        };
    }

    /**
     * Check if user can scan more receipts this month
     */
    async canScanMore(userId: string, subscription: Subscription | undefined, currentUsage?: { scanCount: number, scanMonth: string }): Promise<boolean> {
        const limit = this.getLimit(subscription, 'monthlyScans');
        if (limit === Infinity) return true;

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // If usage data is stale (previous month), allow
        if (currentUsage?.scanMonth !== currentMonth) return true;

        return (currentUsage?.scanCount || 0) < limit;
    }

    /**
     * Increment scan count for current month
     * Resets if new month
     */
    async incrementScanCount(userId: string, currentUsage?: { scanCount: number, scanMonth: string }): Promise<void> {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const userRef = doc(db, 'users', userId);

        let newCount = 1;
        if (currentUsage?.scanMonth === currentMonth) {
            newCount = (currentUsage.scanCount || 0) + 1;
        }

        await updateDoc(userRef, {
            'usage.scanCount': newCount,
            'usage.scanMonth': currentMonth,
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Check if user can send more AI messages today
     */
    async canChatMore(userId: string, subscription: Subscription | undefined, currentUsage?: { aiChatCount: number, lastAiChatDate: Timestamp }): Promise<boolean> {
        const limit = this.getLimit(subscription, 'dailyAiMessages');
        if (limit === Infinity) return true;

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        let lastDate = '';
        if (currentUsage?.lastAiChatDate) {
            lastDate = currentUsage.lastAiChatDate.toDate().toISOString().slice(0, 10);
        }

        // If usage data is stale (previous day), allow
        if (lastDate !== today) return true;

        return (currentUsage?.aiChatCount || 0) < limit;
    }

    /**
     * Increment AI chat message count
     * Resets if new day
     */
    async incrementAiChatCount(userId: string, currentUsage?: { aiChatCount: number, lastAiChatDate: Timestamp }): Promise<void> {
        const today = new Date().toISOString().slice(0, 10);
        const userRef = doc(db, 'users', userId);

        let lastDate = '';
        if (currentUsage?.lastAiChatDate) {
            lastDate = currentUsage.lastAiChatDate.toDate().toISOString().slice(0, 10);
        }

        let newCount = 1;
        if (lastDate === today) {
            newCount = (currentUsage?.aiChatCount || 0) + 1;
        }

        await updateDoc(userRef, {
            'usage.aiChatCount': newCount,
            'usage.lastAiChatDate': Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Get remaining scans for user
     */
    getRemainingScans(subscription: Subscription | undefined, currentUsage?: { scanCount: number, scanMonth: string }): number {
        const limit = this.getLimit(subscription, 'monthlyScans');
        if (limit === Infinity) return Infinity;

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (currentUsage?.scanMonth !== currentMonth) return limit; // New month = full limit

        return Math.max(0, limit - (currentUsage?.scanCount || 0));
    }

    /**
    * Get remaining AI messages for today
    */
    getRemainingAiMessages(subscription: Subscription | undefined, currentUsage?: { aiChatCount: number, lastAiChatDate: Timestamp }): number {
        const limit = this.getLimit(subscription, 'dailyAiMessages');
        if (limit === Infinity) return Infinity;

        const today = new Date().toISOString().slice(0, 10);
        let lastDate = '';
        if (currentUsage?.lastAiChatDate) {
            lastDate = currentUsage.lastAiChatDate.toDate().toISOString().slice(0, 10);
        }

        if (lastDate !== today) return limit; // New day = full limit

        return Math.max(0, limit - (currentUsage?.aiChatCount || 0));
    }

    /**
     * Upgrade subscription
     */
    async upgradeSubscription(
        userId: string,
        newPlan: 'free' | 'pro' | 'ultra',
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
    getEffectivePlan(subscription: Subscription | undefined): 'free' | 'pro' | 'ultra' {
        if (!subscription) return 'free';
        if (!this.isSubscriptionValid(subscription)) return 'free';
        return subscription.plan;
    }
}

// Singleton export
export const subscriptionService = new SubscriptionService();
