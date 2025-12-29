import { doc, updateDoc, increment, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';

// ============ POINTS SYSTEM ============

export const POINTS_CONFIG = {
    // Actions
    RECEIPT_SCAN: 10,
    RECEIPT_SCAN_HIGH_CONFIDENCE: 15, // AI confidence > 95%
    MANUAL_EXPENSE: 5,
    GOAL_CONTRIBUTION: 20,
    GOAL_COMPLETED: 100,
    BUDGET_MAINTAINED: 50, // Per month

    // Streak multipliers
    STREAK_7_DAYS: 2,
    STREAK_30_DAYS: 3,
    STREAK_90_DAYS: 5,
} as const;

// ============ ACHIEVEMENTS ============

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    type: 'count' | 'streak' | 'amount' | 'special';
    target: number;
    category: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    // First steps
    {
        id: 'first_scan',
        name: 'Pierwszy krok',
        description: 'Zeskanuj pierwszy paragon',
        icon: '📸',
        rarity: 'common',
        type: 'count',
        target: 1,
        category: 'scans',
    },
    {
        id: 'scanner_10',
        name: 'Skanowanie w krwi',
        description: 'Zeskanuj 10 paragonów',
        icon: '🎯',
        rarity: 'common',
        type: 'count',
        target: 10,
        category: 'scans',
    },
    {
        id: 'scanner_50',
        name: 'Skanoholik',
        description: 'Zeskanuj 50 paragonów',
        icon: '📷',
        rarity: 'rare',
        type: 'count',
        target: 50,
        category: 'scans',
    },
    {
        id: 'scanner_100',
        name: 'Mistrz Skanowania',
        description: 'Zeskanuj 100 paragonów',
        icon: '🏆',
        rarity: 'epic',
        type: 'count',
        target: 100,
        category: 'scans',
    },

    // Goals
    {
        id: 'first_goal',
        name: 'Marzyciel',
        description: 'Utwórz pierwszy cel oszczędnościowy',
        icon: '✨',
        rarity: 'common',
        type: 'count',
        target: 1,
        category: 'goals',
    },
    {
        id: 'goal_completed',
        name: 'Cel osiągnięty!',
        description: 'Ukończ pierwszy cel oszczędnościowy',
        icon: '🎉',
        rarity: 'rare',
        type: 'count',
        target: 1,
        category: 'goals_completed',
    },
    {
        id: 'goals_5_completed',
        name: 'Konsekwentny',
        description: 'Ukończ 5 celów oszczędnościowych',
        icon: '💪',
        rarity: 'epic',
        type: 'count',
        target: 5,
        category: 'goals_completed',
    },

    // Streaks
    {
        id: 'streak_7',
        name: 'Tygodniowy Wojownik',
        description: 'Utrzymaj 7-dniowy streak',
        icon: '🔥',
        rarity: 'rare',
        type: 'streak',
        target: 7,
        category: 'streak',
    },
    {
        id: 'streak_30',
        name: 'Mistrz Miesiąca',
        description: 'Utrzymaj 30-dniowy streak',
        icon: '🔥',
        rarity: 'epic',
        type: 'streak',
        target: 30,
        category: 'streak',
    },
    {
        id: 'streak_90',
        name: 'Legenda Dyscypliny',
        description: 'Utrzymaj 90-dniowy streak',
        icon: '👑',
        rarity: 'legendary',
        type: 'streak',
        target: 90,
        category: 'streak',
    },

    // Savings
    {
        id: 'saved_1000',
        name: 'Pierwszy tysiąc',
        description: 'Zaoszczędź 1 000 zł',
        icon: '💰',
        rarity: 'rare',
        type: 'amount',
        target: 100000, // grosze
        category: 'savings',
    },
    {
        id: 'saved_5000',
        name: 'Pięć tysięcy!',
        description: 'Zaoszczędź 5 000 zł',
        icon: '💎',
        rarity: 'epic',
        type: 'amount',
        target: 500000,
        category: 'savings',
    },
    {
        id: 'saved_10000',
        name: 'Wielki Oszczędzający',
        description: 'Zaoszczędź 10 000 zł',
        icon: '👑',
        rarity: 'legendary',
        type: 'amount',
        target: 1000000,
        category: 'savings',
    },

    // Budget
    {
        id: 'budget_first',
        name: 'Planista',
        description: 'Utwórz pierwszy budżet',
        icon: '📊',
        rarity: 'common',
        type: 'count',
        target: 1,
        category: 'budgets',
    },
    {
        id: 'budget_maintained_3',
        name: 'Mistrz Budżetu',
        description: 'Nie przekrocz budżetu przez 3 miesiące',
        icon: '🏅',
        rarity: 'epic',
        type: 'count',
        target: 3,
        category: 'budget_maintained',
    },
];

// ============ GAMIFICATION FUNCTIONS ============

export interface UserProgress {
    points: number;
    level: number;
    streak: number;
    lastActiveDate: string | null;
    unlockedAchievements: string[];
    stats: {
        totalScans: number;
        totalGoals: number;
        goalsCompleted: number;
        totalSaved: number;
        budgetsMaintained: number;
    };
}

/**
 * Calculate level from points
 */
export function calculateLevel(points: number): number {
    // Level formula: each level requires 100 * level points
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
    let level = 1;
    let requiredPoints = 0;

    while (points >= requiredPoints) {
        level++;
        requiredPoints += 100 * level;
    }

    return level - 1;
}

/**
 * Get points required for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
    let total = 0;
    for (let i = 1; i <= currentLevel + 1; i++) {
        total += 100 * i;
    }
    return total;
}

/**
 * Get streak multiplier
 */
export function getStreakMultiplier(streak: number): number {
    if (streak >= 90) return POINTS_CONFIG.STREAK_90_DAYS;
    if (streak >= 30) return POINTS_CONFIG.STREAK_30_DAYS;
    if (streak >= 7) return POINTS_CONFIG.STREAK_7_DAYS;
    return 1;
}

/**
 * Award points to user
 */
export async function awardPoints(
    userId: string,
    basePoints: number,
    reason: string
): Promise<{ points: number; newAchievements: Achievement[] }> {
    try {
        const userRef = doc(db, 'users', userId);
        const progressRef = doc(db, 'users', userId, 'gamification', 'progress');

        // Get current progress
        const progressSnap = await getDoc(progressRef);
        let progress: UserProgress = progressSnap.exists()
            ? progressSnap.data() as UserProgress
            : {
                points: 0,
                level: 1,
                streak: 0,
                lastActiveDate: null,
                unlockedAchievements: [],
                stats: {
                    totalScans: 0,
                    totalGoals: 0,
                    goalsCompleted: 0,
                    totalSaved: 0,
                    budgetsMaintained: 0,
                },
            };

        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (progress.lastActiveDate === yesterday) {
            progress.streak += 1;
        } else if (progress.lastActiveDate !== today) {
            progress.streak = 1;
        }
        progress.lastActiveDate = today;

        // Apply streak multiplier
        const multiplier = getStreakMultiplier(progress.streak);
        const finalPoints = basePoints * multiplier;

        // Update points
        progress.points += finalPoints;
        progress.level = calculateLevel(progress.points);

        // Check for new achievements
        const newAchievements: Achievement[] = [];

        for (const achievement of ACHIEVEMENTS) {
            if (progress.unlockedAchievements.includes(achievement.id)) continue;

            let unlocked = false;

            switch (achievement.category) {
                case 'scans':
                    unlocked = progress.stats.totalScans >= achievement.target;
                    break;
                case 'goals':
                    unlocked = progress.stats.totalGoals >= achievement.target;
                    break;
                case 'goals_completed':
                    unlocked = progress.stats.goalsCompleted >= achievement.target;
                    break;
                case 'streak':
                    unlocked = progress.streak >= achievement.target;
                    break;
                case 'savings':
                    unlocked = progress.stats.totalSaved >= achievement.target;
                    break;
            }

            if (unlocked) {
                progress.unlockedAchievements.push(achievement.id);
                newAchievements.push(achievement);
                // Bonus points for achievements
                progress.points += achievement.rarity === 'legendary' ? 500
                    : achievement.rarity === 'epic' ? 200
                        : achievement.rarity === 'rare' ? 100
                            : 50;
            }
        }

        // Save progress
        await setDoc(progressRef, progress);

        // Update user stats
        await updateDoc(userRef, {
            'stats.currentStreak': progress.streak,
        });

        return { points: finalPoints, newAchievements };
    } catch (error) {
        console.error('Error awarding points:', error);
        return { points: 0, newAchievements: [] };
    }
}

/**
 * Increment stat and check achievements
 */
export async function incrementStat(
    userId: string,
    stat: keyof UserProgress['stats'],
    amount: number = 1
): Promise<void> {
    try {
        const progressRef = doc(db, 'users', userId, 'gamification', 'progress');
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
            const progress = progressSnap.data() as UserProgress;
            progress.stats[stat] = (progress.stats[stat] || 0) + amount;
            await setDoc(progressRef, progress);
        }
    } catch (error) {
        console.error('Error incrementing stat:', error);
    }
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
        case 'common': return 'text-slate-400 bg-slate-500/20';
        case 'rare': return 'text-blue-400 bg-blue-500/20';
        case 'epic': return 'text-purple-400 bg-purple-500/20';
        case 'legendary': return 'text-amber-400 bg-amber-500/20';
    }
}

/**
 * Get rarity label
 */
export function getRarityLabel(rarity: Achievement['rarity']): string {
    switch (rarity) {
        case 'common': return 'Zwykłe';
        case 'rare': return 'Rzadkie';
        case 'epic': return 'Epickie';
        case 'legendary': return 'Legendarne';
    }
}
