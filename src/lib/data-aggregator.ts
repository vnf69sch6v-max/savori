/**
 * Savori Data Aggregator
 * Central module for aggregating data across all services
 */

import { Timestamp } from 'firebase/firestore';
import { expenseService, ExpenseStats } from './expense-service';
import { predictMonthlySpending, SpendingPrediction } from './spending-predictor';
import { cache, getMonthRange } from './service-base';
import { Expense, Budget, SavingGoal } from '@/types';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

export interface DashboardData {
    stats: ExpenseStats;
    prediction: SpendingPrediction;
    budget: Budget | null;
    goals: SavingGoal[];
    recentExpenses: Expense[];
    streakInfo: {
        current: number;
        longest: number;
        multiplier: number;
    };
    gamification: {
        level: number;
        points: number;
        achievements: string[];
    };
}

export interface AnalyticsData {
    currentPeriod: ExpenseStats;
    previousPeriod: ExpenseStats;
    trends: {
        totalChange: number;
        categoryChanges: Record<string, number>;
        merchantChanges: Record<string, number>;
    };
    predictions: {
        nextMonthEstimate: number;
        savingsPotential: number;
    };
}

class DataAggregator {
    /**
     * Get all data needed for dashboard
     */
    async getDashboardData(userId: string): Promise<DashboardData> {
        const cacheKey = `dashboard:${userId}`;
        const cached = cache.get<DashboardData>(cacheKey);
        if (cached) return cached;

        // Parallel fetch for performance
        const [stats, prediction, budget, goals, recentExpenses, gamification] = await Promise.all([
            expenseService.getStats(userId, 'month'),
            predictMonthlySpending(userId),
            this.getCurrentBudget(userId),
            this.getActiveGoals(userId),
            expenseService.getByPeriod(userId, 'month'),
            this.getGamificationData(userId),
        ]);

        const data: DashboardData = {
            stats,
            prediction,
            budget,
            goals,
            recentExpenses: recentExpenses.slice(0, 10),
            streakInfo: {
                current: gamification.streak || 0,
                longest: gamification.longestStreak || 0,
                multiplier: this.getStreakMultiplier(gamification.streak || 0),
            },
            gamification: {
                level: gamification.level || 1,
                points: gamification.points || 0,
                achievements: gamification.unlockedAchievements || [],
            },
        };

        cache.set(cacheKey, data, 2 * 60 * 1000); // 2 min cache
        return data;
    }

    /**
     * Get analytics with comparisons
     */
    async getAnalyticsData(userId: string): Promise<AnalyticsData> {
        const cacheKey = `analytics:${userId}`;
        const cached = cache.get<AnalyticsData>(cacheKey);
        if (cached) return cached;

        // Current and previous month ranges
        const now = new Date();
        const currentRange = getMonthRange(now);
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousRange = getMonthRange(previousMonth);

        const [currentPeriod, previousPeriodExpenses] = await Promise.all([
            expenseService.getStats(userId, 'month'),
            expenseService.getByPeriod(userId, 'month', previousRange),
        ]);

        // Calculate previous period stats
        const previousTotalSpent = previousPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
        const previousByCategory: Record<string, { amount: number; count: number }> = {};
        previousPeriodExpenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            if (!previousByCategory[cat]) previousByCategory[cat] = { amount: 0, count: 0 };
            previousByCategory[cat].amount += e.amount;
            previousByCategory[cat].count++;
        });

        const previousPeriod: ExpenseStats = {
            totalSpent: previousTotalSpent,
            count: previousPeriodExpenses.length,
            avgExpense: previousPeriodExpenses.length > 0 ? previousTotalSpent / previousPeriodExpenses.length : 0,
            byCategory: previousByCategory,
            byMerchant: [],
            dailyAverage: previousTotalSpent / 30,
        };

        // Calculate trends
        const totalChange = previousTotalSpent > 0
            ? ((currentPeriod.totalSpent - previousTotalSpent) / previousTotalSpent) * 100
            : 0;

        const categoryChanges: Record<string, number> = {};
        Object.keys(currentPeriod.byCategory).forEach(cat => {
            const current = currentPeriod.byCategory[cat]?.amount || 0;
            const previous = previousByCategory[cat]?.amount || 0;
            categoryChanges[cat] = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        });

        const data: AnalyticsData = {
            currentPeriod,
            previousPeriod,
            trends: {
                totalChange,
                categoryChanges,
                merchantChanges: {},
            },
            predictions: {
                nextMonthEstimate: currentPeriod.dailyAverage * 30,
                savingsPotential: currentPeriod.totalSpent * 0.1, // 10% potential
            },
        };

        cache.set(cacheKey, data, 5 * 60 * 1000);
        return data;
    }

    /**
     * Get current month budget
     */
    private async getCurrentBudget(userId: string): Promise<Budget | null> {
        const monthKey = format(new Date(), 'yyyy-MM');
        const ref = doc(db, 'users', userId, 'budgets', monthKey);
        const snap = await getDoc(ref);

        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Budget;
    }

    /**
     * Get active savings goals
     */
    private async getActiveGoals(userId: string): Promise<SavingGoal[]> {
        const goalsRef = collection(db, 'users', userId, 'goals');
        const q = query(goalsRef, where('status', '==', 'active'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingGoal[];
    }

    /**
     * Get gamification data
     */
    private async getGamificationData(userId: string): Promise<{
        level: number;
        points: number;
        streak: number;
        longestStreak: number;
        unlockedAchievements: string[];
    }> {
        const ref = doc(db, 'users', userId, 'gamification', 'progress');
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return { level: 1, points: 0, streak: 0, longestStreak: 0, unlockedAchievements: [] };
        }

        const data = snap.data();
        return {
            level: data.level || 1,
            points: data.points || 0,
            streak: data.streak || 0,
            longestStreak: data.longestStreak || 0,
            unlockedAchievements: data.unlockedAchievements || [],
        };
    }

    /**
     * Calculate streak multiplier
     */
    private getStreakMultiplier(streak: number): number {
        if (streak >= 90) return 5;
        if (streak >= 30) return 3;
        if (streak >= 7) return 2;
        return 1;
    }

    /**
     * Invalidate all caches for user
     */
    invalidateUserCache(userId: string): void {
        cache.invalidate(userId);
    }
}

// Singleton instance
export const dataAggregator = new DataAggregator();
