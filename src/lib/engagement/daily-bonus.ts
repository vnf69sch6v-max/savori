'use client';

/**
 * Daily Bonus System
 * Rewards users for consecutive daily logins
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { engagementService } from '@/lib/engagement/xp-system';

interface DailyBonusStatus {
    canClaim: boolean;
    currentStreak: number;
    lastClaimDate: string | null;
    todaysReward: {
        xp: number;
        isWeeklyBonus: boolean;
        isMonthlyBonus: boolean;
    };
    nextMilestone: {
        day: number;
        reward: string;
    };
}

// Reward tiers
const DAILY_REWARDS = {
    base: 10,        // Day 1-6
    weekly: 50,      // Day 7, 14, 21, 28
    monthly: 200,    // Day 30
};

const MILESTONES = [
    { day: 7, reward: '50 XP + Random Badge' },
    { day: 14, reward: '50 XP + Exclusive Avatar Frame' },
    { day: 21, reward: '50 XP + Special Theme Unlock' },
    { day: 30, reward: '200 XP + Rare Badge "Dedicated Saver"' },
];

export const dailyBonusService = {
    /**
     * Check if user can claim daily bonus
     */
    async getStatus(userId: string): Promise<DailyBonusStatus> {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return {
                canClaim: true,
                currentStreak: 0,
                lastClaimDate: null,
                todaysReward: { xp: DAILY_REWARDS.base, isWeeklyBonus: false, isMonthlyBonus: false },
                nextMilestone: MILESTONES[0],
            };
        }

        const data = userDoc.data();
        const engagement = data.engagement || {};
        const lastClaim = engagement.lastDailyBonusClaim?.toDate?.() || null;
        const currentStreak = engagement.dailyBonusStreak || 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let canClaim = true;
        if (lastClaim) {
            const lastClaimDate = new Date(lastClaim);
            lastClaimDate.setHours(0, 0, 0, 0);
            canClaim = lastClaimDate.getTime() < today.getTime();
        }

        // Calculate what the next day's streak would be
        const nextStreakDay = canClaim ? currentStreak + 1 : currentStreak;
        const isWeeklyBonus = nextStreakDay % 7 === 0;
        const isMonthlyBonus = nextStreakDay === 30;

        let xpReward = DAILY_REWARDS.base;
        if (isMonthlyBonus) xpReward = DAILY_REWARDS.monthly;
        else if (isWeeklyBonus) xpReward = DAILY_REWARDS.weekly;

        // Find next milestone
        const nextMilestone = MILESTONES.find(m => m.day > nextStreakDay) || MILESTONES[MILESTONES.length - 1];

        return {
            canClaim,
            currentStreak,
            lastClaimDate: lastClaim?.toISOString() || null,
            todaysReward: {
                xp: xpReward,
                isWeeklyBonus,
                isMonthlyBonus,
            },
            nextMilestone,
        };
    },

    /**
     * Claim daily bonus
     */
    async claim(userId: string): Promise<{
        success: boolean;
        xpAwarded: number;
        newStreak: number;
        bonusType: 'daily' | 'weekly' | 'monthly';
        badgeUnlocked?: string;
    }> {
        const status = await this.getStatus(userId);

        if (!status.canClaim) {
            return { success: false, xpAwarded: 0, newStreak: status.currentStreak, bonusType: 'daily' };
        }

        const userRef = doc(db, 'users', userId);
        const newStreak = status.currentStreak + 1;

        // Check if streak should reset (missed a day)
        const userDoc = await getDoc(userRef);
        const data = userDoc.data();
        const lastClaim = data?.engagement?.lastDailyBonusClaim?.toDate?.();

        let finalStreak = newStreak;
        if (lastClaim) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const lastClaimDate = new Date(lastClaim);
            lastClaimDate.setHours(0, 0, 0, 0);

            // If last claim was before yesterday, reset streak
            if (lastClaimDate.getTime() < yesterday.getTime()) {
                finalStreak = 1;
            }
        }

        const isWeeklyBonus = finalStreak % 7 === 0;
        const isMonthlyBonus = finalStreak === 30;

        let xpReward = DAILY_REWARDS.base;
        let bonusType: 'daily' | 'weekly' | 'monthly' = 'daily';

        if (isMonthlyBonus) {
            xpReward = DAILY_REWARDS.monthly;
            bonusType = 'monthly';
        } else if (isWeeklyBonus) {
            xpReward = DAILY_REWARDS.weekly;
            bonusType = 'weekly';
        }

        // Update user document
        await updateDoc(userRef, {
            'engagement.dailyBonusStreak': finalStreak,
            'engagement.lastDailyBonusClaim': Timestamp.now(),
            'engagement.totalDailyBonusesClaimed': (data?.engagement?.totalDailyBonusesClaimed || 0) + 1,
        });

        // Award XP through main system
        await engagementService.awardXP(userId, 'daily_bonus');

        let badgeUnlocked: string | undefined;

        // Check for streak badges
        if (finalStreak === 7) badgeUnlocked = 'week_streak';
        if (finalStreak === 30) badgeUnlocked = 'month_streak';

        return {
            success: true,
            xpAwarded: xpReward,
            newStreak: finalStreak,
            bonusType,
            badgeUnlocked,
        };
    },
};

export default dailyBonusService;
