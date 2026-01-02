'use client';

import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, PlanFeatures, SUBSCRIPTION_PLANS } from '@/lib/subscription-service';
import { useState, useCallback, useEffect } from 'react';

interface UseSubscriptionReturn {
    // Current plan info
    plan: 'free' | 'pro' | 'ultra';
    planDetails: PlanFeatures | undefined;
    isValid: boolean;

    // Feature checks
    canUse: (feature: keyof PlanFeatures['limits']) => boolean;
    getLimit: (feature: 'monthlyScans' | 'budgets' | 'goals') => number;

    // Scan limits (async)
    remainingScans: number;
    checkCanScan: () => Promise<boolean>;
    incrementScan: () => Promise<void>;

    // Upgrade flow
    showUpgradeModal: boolean;
    upgradeReason: string;
    openUpgrade: (reason: string) => void;
    closeUpgrade: () => void;

    // Utils
    isPro: boolean;
    isPremium: boolean;
    isFree: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
    const { userData } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState('');
    const [remainingScans, setRemainingScans] = useState(10);

    const subscription = userData?.subscription;
    const plan = subscriptionService.getEffectivePlan(subscription);
    const planDetails = subscriptionService.getPlan(plan);
    const isValid = subscriptionService.isSubscriptionValid(subscription);

    // Load remaining scans on mount
    // Load remaining scans on mount and when usage updates
    useEffect(() => {
        if (userData?.id) {
            // Updated to pass subscription and usage data directly to synchronous helper if possible, 
            // or async if the service requires it. 
            // NOTE: The service method getRemainingScans is now synchronous/helper based on passed usage, 
            // but we might want to refactor it to accept just the data we have.
            // Wait, looking at my previous edit to SubscriptionService, `getRemainingScans` takes (subscription, currentUsage) and checks usage vs limit.
            // It is synchronous.

            const remaining = subscriptionService.getRemainingScans(subscription, userData?.usage);
            setRemainingScans(remaining);
        }
    }, [userData?.id, subscription, userData?.usage]);

    const canUse = useCallback((feature: keyof PlanFeatures['limits']): boolean => {
        return subscriptionService.canUseFeature(subscription, feature);
    }, [subscription]);

    const getLimit = useCallback((feature: 'monthlyScans' | 'budgets' | 'goals'): number => {
        return subscriptionService.getLimit(subscription, feature);
    }, [subscription]);

    const checkCanScan = useCallback(async (): Promise<boolean> => {
        if (!userData?.id) return false;
        // Updated service method: canScanMore(userId, subscription, currentUsage)
        return subscriptionService.canScanMore(userData.id, subscription, userData?.usage);
    }, [userData?.id, subscription, userData?.usage]);

    const incrementScan = useCallback(async (): Promise<void> => {
        if (!userData?.id) return;
        // Updated service method: incrementScanCount(userId, currentUsage)
        await subscriptionService.incrementScanCount(userData.id, userData.usage);
        setRemainingScans(prev => Math.max(0, prev - 1));
    }, [userData?.id, userData?.usage]);

    const openUpgrade = useCallback((reason: string) => {
        setUpgradeReason(reason);
        setShowUpgradeModal(true);
    }, []);

    const closeUpgrade = useCallback(() => {
        setShowUpgradeModal(false);
        setUpgradeReason('');
    }, []);

    return {
        plan,
        planDetails,
        isValid,
        canUse,
        getLimit,
        remainingScans,
        checkCanScan,
        incrementScan,
        showUpgradeModal,
        upgradeReason,
        openUpgrade,
        closeUpgrade,
        isPro: plan === 'pro' || plan === 'ultra',
        isPremium: plan === 'ultra',
        isFree: plan === 'free',
    };
}
