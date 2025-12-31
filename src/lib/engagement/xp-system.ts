/**
 * Savori XP & Engagement System
 * Gamification mechanics for user retention
 */

import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { notificationService } from '@/lib/engagement/notifications';
import { startOfWeek, format } from 'date-fns';

// ============ TYPES ============

export interface XPAction {
    action: string;
    xp: number;
    description: string;
    cooldown?: number; // minutes
}

export interface UserEngagement {
    xp: number;
    weeklyXP: number;
    lastWeeklyReset: string; // YYYY-MM-DD
    level: number;
    points: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // YYYY-MM-DD
    totalScans: number;
    totalExpenses: number;
    badges: string[];
    achievementsUnlocked: string[];
    // No-Spend tracking
    noSpendStreak: number;
    longestNoSpendStreak: number;
    totalNoSpendDays: number;
}

export interface LevelInfo {
    level: number;
    name: string;
    minXP: number;
    maxXP: number;
    perks: string[];
}

export interface Badge {
    id: string;
    name: string;
    emoji: string;
    description: string;
    requirement: (engagement: UserEngagement) => boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ============ XP ACTIONS ============

export const XP_ACTIONS: Record<string, XPAction> = {
    // Core actions
    scan_receipt: { action: 'scan_receipt', xp: 15, description: 'Zeskanuj paragon' },
    add_expense_manual: { action: 'add_expense_manual', xp: 10, description: 'Dodaj wydatek ręcznie' },
    import_bank: { action: 'import_bank', xp: 50, description: 'Importuj z banku' },

    // Engagement actions
    daily_login: { action: 'daily_login', xp: 5, description: 'Codzienne logowanie', cooldown: 1440 },
    complete_challenge: { action: 'complete_challenge', xp: 100, description: 'Ukończ wyzwanie' },
    set_goal: { action: 'set_goal', xp: 25, description: 'Ustaw cel' },
    reach_goal: { action: 'reach_goal', xp: 200, description: 'Osiągnij cel' },

    // Streak bonuses
    streak_3: { action: 'streak_3', xp: 20, description: '3-dniowy streak' },
    streak_7: { action: 'streak_7', xp: 50, description: '7-dniowy streak' },
    streak_14: { action: 'streak_14', xp: 100, description: '14-dniowy streak' },
    streak_30: { action: 'streak_30', xp: 300, description: '30-dniowy streak' },

    // Special actions
    categorize_correction: { action: 'categorize_correction', xp: 5, description: 'Popraw kategorię' },
    add_budget: { action: 'add_budget', xp: 20, description: 'Ustaw budżet' },
    buy_kitchen_item: { action: 'buy_kitchen_item', xp: 10, description: 'Kup przedmiot do kuchni' },
    view_insights: { action: 'view_insights', xp: 5, description: 'Sprawdź AI Insights', cooldown: 60 },

    // No-Spend bonuses
    no_spend_day: { action: 'no_spend_day', xp: 15, description: 'Dzień bez wydatków' },
    no_spend_3: { action: 'no_spend_3', xp: 30, description: '3 dni bez wydatków z rzędu' },
    no_spend_7: { action: 'no_spend_7', xp: 75, description: 'Tydzień bez wydatków' },
};

// ============ LEVELS ============

export const LEVELS: LevelInfo[] = [
    { level: 1, name: 'Początkujący', minXP: 0, maxXP: 99, perks: ['Podstawowe funkcje'] },
    { level: 2, name: 'Oszczędny', minXP: 100, maxXP: 249, perks: ['Odblokowane wyzwania'] },
    { level: 3, name: 'Świadomy', minXP: 250, maxXP: 499, perks: ['AI Insights'] },
    { level: 4, name: 'Planista', minXP: 500, maxXP: 999, perks: ['Zaawansowane raporty'] },
    { level: 5, name: 'Strateg', minXP: 1000, maxXP: 1999, perks: ['Predykcje wydatków'] },
    { level: 6, name: 'Ekspert', minXP: 2000, maxXP: 3499, perks: ['Porównania cen'] },
    { level: 7, name: 'Mistrz', minXP: 3500, maxXP: 5499, perks: ['Ekskluzywne wyzwania'] },
    { level: 8, name: 'Guru', minXP: 5500, maxXP: 7999, perks: ['Legendarne przedmioty'] },
    { level: 9, name: 'Legenda', minXP: 8000, maxXP: 11999, perks: ['Mentor status'] },
    { level: 10, name: 'Finansowy Bóg', minXP: 12000, maxXP: Infinity, perks: ['Wszystko odblokowane'] },
];

// ============ BADGES ============

export const BADGES: Badge[] = [
    // Milestone badges
    { id: 'first_scan', name: 'Pierwszy skan', emoji: '📸', description: 'Zeskanuj pierwszy paragon', rarity: 'common', requirement: (e) => e.totalScans >= 1 },
    { id: 'scan_10', name: 'Skanoholik', emoji: '🤳', description: 'Zeskanuj 10 paragonów', rarity: 'common', requirement: (e) => e.totalScans >= 10 },
    { id: 'scan_50', name: 'Master Skaner', emoji: '🎯', description: 'Zeskanuj 50 paragonów', rarity: 'rare', requirement: (e) => e.totalScans >= 50 },
    { id: 'scan_100', name: 'Skan Legend', emoji: '👑', description: 'Zeskanuj 100 paragonów', rarity: 'epic', requirement: (e) => e.totalScans >= 100 },

    // Streak badges
    { id: 'streak_3', name: 'Wytrwały', emoji: '🔥', description: '3-dniowy streak', rarity: 'common', requirement: (e) => e.longestStreak >= 3 },
    { id: 'streak_7', name: 'Tygodniowy Wojownik', emoji: '⚔️', description: '7-dniowy streak', rarity: 'rare', requirement: (e) => e.longestStreak >= 7 },
    { id: 'streak_30', name: 'Mistrz Konsekwencji', emoji: '🏆', description: '30-dniowy streak', rarity: 'epic', requirement: (e) => e.longestStreak >= 30 },
    { id: 'streak_100', name: 'Legenda Streak', emoji: '💎', description: '100-dniowy streak', rarity: 'legendary', requirement: (e) => e.longestStreak >= 100 },

    // Level badges
    { id: 'level_5', name: 'Strateg', emoji: '🎖️', description: 'Osiągnij poziom 5', rarity: 'rare', requirement: (e) => e.level >= 5 },
    { id: 'level_10', name: 'Finansowy Bóg', emoji: '👼', description: 'Osiągnij poziom 10', rarity: 'legendary', requirement: (e) => e.level >= 10 },

    // Special badges
    { id: 'early_adopter', name: 'Early Adopter', emoji: '🚀', description: 'Jeden z pierwszych użytkowników', rarity: 'epic', requirement: () => true }, // Manual grant
    { id: 'feedback_hero', name: 'Bohater Feedbacku', emoji: '💬', description: 'Pomógł ulepszyć aplikację', rarity: 'rare', requirement: () => false }, // Manual grant

    // No-Spend badges
    { id: 'no_spend_3', name: 'Oszczędny', emoji: '💪', description: '3 dni bez wydatków z rzędu', rarity: 'common', requirement: (e) => e.longestNoSpendStreak >= 3 },
    { id: 'no_spend_7', name: 'Tydzień Ciszy', emoji: '🧘', description: '7 dni bez wydatków z rzędu', rarity: 'rare', requirement: (e) => e.longestNoSpendStreak >= 7 },
    { id: 'no_spend_14', name: 'Finansowy Ninja', emoji: '🥷', description: '14 dni bez wydatków', rarity: 'epic', requirement: (e) => e.longestNoSpendStreak >= 14 },
    { id: 'no_spend_30', name: 'Mistrz Minimalizmu', emoji: '🏆', description: 'Miesiąc bez wydatków', rarity: 'legendary', requirement: (e) => e.longestNoSpendStreak >= 30 },
];

// ============ ENGAGEMENT SERVICE ============

export class EngagementService {

    /**
     * Check if weekly XP needs reset
     */
    private async checkWeeklyReset(userId: string, engagement: UserEngagement): Promise<void> {
        const now = new Date();
        const startOfThisWeek = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // Monday start

        if (engagement.lastWeeklyReset !== startOfThisWeek) {
            // New week started, reset weekly XP
            await updateDoc(doc(db, 'users', userId), {
                'gamification.weeklyXP': 0,
                'gamification.lastWeeklyReset': startOfThisWeek
            });
            // Update local object to reflect change for subsequent calculations
            engagement.weeklyXP = 0;
            engagement.lastWeeklyReset = startOfThisWeek;
        }
    }

    /**
     * Award XP for an action
     */
    async awardXP(userId: string, actionKey: string): Promise<{ xp: number; levelUp: boolean; newLevel?: LevelInfo; newBadges: Badge[] }> {
        const action = XP_ACTIONS[actionKey];
        if (!action) throw new Error(`Unknown action: ${actionKey}`);

        // Get current engagement
        const engagement = await this.getEngagement(userId);

        // Check weekly reset before awarding
        await this.checkWeeklyReset(userId, engagement);

        // Check cooldown (skipped implementation for now)

        // Calculate new XP
        const newXP = engagement.xp + action.xp;
        const currentLevel = this.getLevelForXP(engagement.xp);
        const newLevel = this.getLevelForXP(newXP);
        const levelUp = newLevel.level > currentLevel.level;

        // Update in Firestore
        await updateDoc(doc(db, 'users', userId), {
            'gamification.xp': increment(action.xp),
            'gamification.weeklyXP': increment(action.xp),
            'gamification.points': increment(action.xp),
            'gamification.level': newLevel.level,
        });

        if (levelUp) {
            await notificationService.send(userId, {
                type: 'system',
                title: 'Awans Poziomu! 🎉',
                message: `Gratulacje! Osiągnąłeś poziom ${newLevel.level}: ${newLevel.name}.`,
                emoji: '🆙'
            });
        }

        // Check for new badges
        const newBadges = await this.checkNewBadges(userId, { ...engagement, xp: newXP, level: newLevel.level });

        return {
            xp: action.xp,
            levelUp,
            newLevel: levelUp ? newLevel : undefined,
            newBadges,
        };
    }

    /**
     * Award custom amount of XP (e.g. for challenges with variable rewards)
     */
    async awardCustomXP(userId: string, amount: number, reason: string): Promise<{ xp: number; levelUp: boolean; newLevel?: LevelInfo; newBadges: Badge[] }> {
        // Get current engagement
        const engagement = await this.getEngagement(userId);

        // Check weekly reset
        await this.checkWeeklyReset(userId, engagement);

        // Calculate new XP
        const newXP = engagement.xp + amount;
        const currentLevel = this.getLevelForXP(engagement.xp);
        const newLevel = this.getLevelForXP(newXP);
        const levelUp = newLevel.level > currentLevel.level;

        // Update in Firestore
        await updateDoc(doc(db, 'users', userId), {
            'gamification.xp': increment(amount),
            'gamification.weeklyXP': increment(amount),
            'gamification.level': newLevel.level,
            // Also add points if we want to track them separately (legacy or currency)
            'gamification.points': increment(amount),
        });

        if (levelUp) {
            await notificationService.send(userId, {
                type: 'system',
                title: 'Awans Poziomu! 🎉',
                message: `Gratulacje! Osiągnąłeś poziom ${newLevel.level}: ${newLevel.name}.`,
                emoji: '🆙'
            });
        }

        // Check for new badges
        const newBadges = await this.checkNewBadges(userId, { ...engagement, xp: newXP, level: newLevel.level });

        return {
            xp: amount,
            levelUp,
            newLevel: levelUp ? newLevel : undefined,
            newBadges,
        };
    }

    /**
     * Update streak (call daily)
     */
    async updateStreak(userId: string): Promise<{ streak: number; isNew: boolean; bonus?: number }> {
        const engagement = await this.getEngagement(userId);
        const today = this.getDateString(new Date());
        const yesterday = this.getDateString(new Date(Date.now() - 86400000));

        let newStreak = engagement.currentStreak;
        let bonus = 0;
        let isNew = false;

        if (engagement.lastActiveDate === today) {
            // Already logged in today
            return { streak: newStreak, isNew: false };
        }

        if (engagement.lastActiveDate === yesterday) {
            // Streak continues
            newStreak = engagement.currentStreak + 1;
            isNew = true;

            // Check for streak milestones
            if (newStreak === 3) bonus = XP_ACTIONS.streak_3.xp;
            else if (newStreak === 7) bonus = XP_ACTIONS.streak_7.xp;
            else if (newStreak === 14) bonus = XP_ACTIONS.streak_14.xp;
            else if (newStreak === 30) bonus = XP_ACTIONS.streak_30.xp;
        } else {
            // Streak broken
            newStreak = 1;
            isNew = true;
        }

        const longestStreak = Math.max(newStreak, engagement.longestStreak);

        // Update in Firestore
        await updateDoc(doc(db, 'users', userId), {
            'gamification.currentStreak': newStreak,
            'gamification.longestStreak': longestStreak,
            'engagement.lastActive': Timestamp.now(),
        });

        // Award streak bonus XP if any (handled separately to avoid double reset check, but awardXP handles it)
        if (bonus > 0) {
            // Direct update to avoid circular dependency or double check if we called awardCustomXP
            // But awardCustomXP is safe.
            await this.awardCustomXP(userId, bonus, 'streak_bonus');
        }

        // Award daily login XP
        await this.awardXP(userId, 'daily_login');

        return { streak: newStreak, isNew, bonus };
    }

    /**
     * Get user engagement data
     */
    async getEngagement(userId: string): Promise<UserEngagement> {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const data = userDoc.data();

        const gamification = data?.gamification || {};
        const engagement = data?.engagement || {};

        return {
            xp: gamification.xp || 0,
            weeklyXP: gamification.weeklyXP || 0,
            lastWeeklyReset: gamification.lastWeeklyReset || '',
            level: gamification.level || 1,
            points: gamification.points || 0,
            currentStreak: gamification.currentStreak || 0,
            longestStreak: gamification.longestStreak || 0,
            lastActiveDate: engagement.lastActive?.toDate ?
                this.getDateString(engagement.lastActive.toDate()) :
                this.getDateString(new Date()),
            totalScans: gamification.totalScans || 0,
            totalExpenses: gamification.totalExpenses || 0,
            badges: gamification.badges || [],
            achievementsUnlocked: gamification.achievementsUnlocked || [],
            // No-Spend tracking
            noSpendStreak: gamification.noSpendStreak || 0,
            longestNoSpendStreak: gamification.longestNoSpendStreak || 0,
            totalNoSpendDays: gamification.totalNoSpendDays || 0,
        };
    }

    /**
     * Check and award new badges
     */
    private async checkNewBadges(userId: string, engagement: UserEngagement): Promise<Badge[]> {
        const newBadges: Badge[] = [];

        for (const badge of BADGES) {
            if (!engagement.badges.includes(badge.id) && badge.requirement(engagement)) {
                newBadges.push(badge);

                // Award badge
                await updateDoc(doc(db, 'users', userId), {
                    'gamification.badges': [...engagement.badges, badge.id],
                });

                await notificationService.send(userId, {
                    type: 'achievement',
                    title: `Nowa Odznaka: ${badge.name}`,
                    message: badge.description,
                    emoji: badge.emoji
                });

                engagement.badges.push(badge.id);
            }
        }

        return newBadges;
    }

    /**
     * Get level info for XP amount
     */
    getLevelForXP(xp: number): LevelInfo {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].minXP) {
                return LEVELS[i];
            }
        }
        return LEVELS[0];
    }

    /**
     * Get progress to next level
     */
    getProgressToNextLevel(xp: number): { current: number; needed: number; percentage: number } {
        const currentLevel = this.getLevelForXP(xp);
        const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

        if (!nextLevel) {
            return { current: xp, needed: xp, percentage: 100 };
        }

        const xpInLevel = xp - currentLevel.minXP;
        const xpNeeded = nextLevel.minXP - currentLevel.minXP;
        const percentage = Math.round((xpInLevel / xpNeeded) * 100);

        return { current: xpInLevel, needed: xpNeeded, percentage };
    }

    /**
     * Record a no-spend day (call at end of day if no expenses were added)
     */
    async recordNoSpendDay(userId: string): Promise<{ streak: number; bonus?: number; newBadges: Badge[] }> {
        const engagement = await this.getEngagement(userId);

        // Increment no-spend streak
        const newStreak = engagement.noSpendStreak + 1;
        const longestNoSpendStreak = Math.max(newStreak, engagement.longestNoSpendStreak);
        const totalNoSpendDays = engagement.totalNoSpendDays + 1;

        // Check for milestone bonuses
        let bonus = 0;
        if (newStreak === 3) bonus = XP_ACTIONS.no_spend_3.xp;
        else if (newStreak === 7) bonus = XP_ACTIONS.no_spend_7.xp;

        // Update in Firestore
        await updateDoc(doc(db, 'users', userId), {
            'gamification.noSpendStreak': newStreak,
            'gamification.longestNoSpendStreak': longestNoSpendStreak,
            'gamification.totalNoSpendDays': totalNoSpendDays,
        });

        // Award base XP for no-spend day
        await this.awardXP(userId, 'no_spend_day');

        // Award bonus XP if hit milestone
        if (bonus > 0) {
            await this.awardCustomXP(userId, bonus, 'no_spend_streak_bonus');
        }

        // Check for new badges with updated streak
        const updatedEngagement = {
            ...engagement,
            noSpendStreak: newStreak,
            longestNoSpendStreak,
            totalNoSpendDays,
        };
        const newBadges = await this.checkNewBadges(userId, updatedEngagement);

        return { streak: newStreak, bonus: bonus > 0 ? bonus : undefined, newBadges };
    }

    /**
     * Reset no-spend streak (call when expense is added)
     */
    async resetNoSpendStreak(userId: string): Promise<void> {
        await updateDoc(doc(db, 'users', userId), {
            'gamification.noSpendStreak': 0,
        });
    }

    /**
     * Helper: Get date string YYYY-MM-DD
     */
    private getDateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

// Singleton export
export const engagementService = new EngagementService();

