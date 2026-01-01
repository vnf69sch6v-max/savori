'use client';

import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, PlanFeatures, SUBSCRIPTION_PLANS } from '@/lib/subscription-service';
import { useState, useCallback, useEffect } from 'react';

interface UseSubscriptionReturn {
    // Current plan info
    plan: 'free' | 'pro' | 'premium';
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
    useEffect(() => {
        if (userData?.id) {
            subscriptionService.getRemainingScans(userData.id, subscription)
                .then(setRemainingScans)
                .catch(() => setRemainingScans(0));
        }
    }, [userData?.id, subscription]);

    const canUse = useCallback((feature: keyof PlanFeatures['limits']): boolean => {
        return subscriptionService.canUseFeature(subscription, feature);
    }, [subscription]);

    const getLimit = useCallback((feature: 'monthlyScans' | 'budgets' | 'goals'): number => {
        return subscriptionService.getLimit(subscription, feature);
    }, [subscription]);

    const checkCanScan = useCallback(async (): Promise<boolean> => {
        if (!userData?.id) return false;
        return subscriptionService.canScanMore(userData.id, subscription);
    }, [userData?.id, subscription]);

    const incrementScan = useCallback(async (): Promise<void> => {
        if (!userData?.id) return;
        await subscriptionService.incrementScanCount(userData.id);
        setRemainingScans(prev => Math.max(0, prev - 1));
    }, [userData?.id]);

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
        isPro: plan === 'pro' || plan === 'premium',
        isPremium: plan === 'premium',
        isFree: plan === 'free',
    };
}
