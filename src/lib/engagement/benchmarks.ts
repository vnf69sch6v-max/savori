/**
 * Anonymous Benchmarks Service
 * Compares user spending to aggregated anonymous data
 * Privacy-first: No individual data exposed
 */

import { Expense } from '@/types';

// Simulated benchmark data (in production, this would come from aggregated Firebase data)
// All amounts in grosz (1/100 PLN) for consistency
const BENCHMARK_DATA = {
    // Age group based benchmarks (monthly averages in grosz)
    ageGroups: {
        '18-24': {
            food: 80000,        // 800 PLN
            transport: 35000,
            entertainment: 45000,
            shopping: 60000,
            subscriptions: 15000,
            health: 12000,
            bills: 40000,
            other: 25000,
        },
        '25-34': {
            food: 120000,       // 1200 PLN
            transport: 55000,
            entertainment: 50000,
            shopping: 80000,
            subscriptions: 25000,
            health: 20000,
            bills: 85000,
            other: 40000,
        },
        '35-44': {
            food: 150000,
            transport: 70000,
            entertainment: 40000,
            shopping: 100000,
            subscriptions: 30000,
            health: 35000,
            bills: 120000,
            other: 50000,
        },
        '45+': {
            food: 140000,
            transport: 60000,
            entertainment: 30000,
            shopping: 90000,
            subscriptions: 20000,
            health: 50000,
            bills: 130000,
            other: 45000,
        },
    },

    // City-based adjustments (multiplier)
    cityMultipliers: {
        'warszawa': 1.35,
        'kraków': 1.15,
        'wrocław': 1.12,
        'poznań': 1.10,
        'gdańsk': 1.10,
        'łódź': 1.00,
        'other': 0.95,
    },

    // Top percentile benchmarks (what top 25% spenders achieve - lower is better)
    topPerformers: {
        food: 0.70,           // Top 25% spend 70% of average
        transport: 0.60,
        entertainment: 0.50,
        shopping: 0.55,
        subscriptions: 0.65,
        health: 0.80,
        bills: 0.90,
        other: 0.60,
    },
};

export interface BenchmarkResult {
    category: string;
    categoryLabel: string;
    userAmount: number;          // User's monthly spending
    avgAmount: number;           // Average for their demographic
    topPerformerAmount: number;  // What top 25% achieve
    percentile: number;          // User's percentile (higher = spending more than others)
    potentialSavings: number;    // If they matched top performers
    status: 'excellent' | 'good' | 'average' | 'high';
    insight: string;
}

export interface BenchmarkSummary {
    totalUserSpending: number;
    totalAvgSpending: number;
    totalPotentialSavings: number;
    yearlyPotentialSavings: number;
    overallPercentile: number;
    categories: BenchmarkResult[];
    bestCategory: BenchmarkResult | null;
    worstCategory: BenchmarkResult | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Jedzenie',
    transport: 'Transport',
    entertainment: 'Rozrywka',
    shopping: 'Zakupy',
    subscriptions: 'Subskrypcje',
    health: 'Zdrowie',
    bills: 'Rachunki',
    other: 'Inne',
};

class BenchmarkService {
    /**
     * Calculate benchmarks for user based on their expenses and demographics
     */
    calculateBenchmarks(
        expenses: Expense[],
        ageGroup: keyof typeof BENCHMARK_DATA.ageGroups = '25-34',
        city: keyof typeof BENCHMARK_DATA.cityMultipliers = 'other'
    ): BenchmarkSummary {
        // Get base benchmarks for age group
        const baseBenchmarks = BENCHMARK_DATA.ageGroups[ageGroup];
        const cityMultiplier = BENCHMARK_DATA.cityMultipliers[city];

        // Calculate user's monthly spending by category
        const userSpending = this.calculateMonthlySpending(expenses);

        // Calculate benchmarks for each category
        const categories: BenchmarkResult[] = Object.entries(baseBenchmarks).map(
            ([category, baseAvg]) => {
                const avgAmount = Math.round(baseAvg * cityMultiplier);
                const topPerformerAmount = Math.round(avgAmount * BENCHMARK_DATA.topPerformers[category as keyof typeof BENCHMARK_DATA.topPerformers]);
                const userAmount = userSpending[category] || 0;

                // Calculate percentile (0-100, higher means spending more than peers)
                const percentile = this.calculatePercentile(userAmount, avgAmount);

                // Calculate potential savings
                const potentialSavings = Math.max(0, userAmount - topPerformerAmount);

                // Determine status
                const status = this.getStatus(percentile);

                // Generate insight
                const insight = this.generateInsight(category, userAmount, avgAmount, topPerformerAmount, status);

                return {
                    category,
                    categoryLabel: CATEGORY_LABELS[category] || category,
                    userAmount,
                    avgAmount,
                    topPerformerAmount,
                    percentile,
                    potentialSavings,
                    status,
                    insight,
                };
            }
        );

        // Sort by potential savings (worst first)
        categories.sort((a, b) => b.potentialSavings - a.potentialSavings);

        // Calculate totals
        const totalUserSpending = categories.reduce((sum, c) => sum + c.userAmount, 0);
        const totalAvgSpending = categories.reduce((sum, c) => sum + c.avgAmount, 0);
        const totalPotentialSavings = categories.reduce((sum, c) => sum + c.potentialSavings, 0);
        const yearlyPotentialSavings = totalPotentialSavings * 12;

        // Overall percentile
        const overallPercentile = this.calculatePercentile(totalUserSpending, totalAvgSpending);

        // Best and worst categories
        const sortedByPercentile = [...categories].sort((a, b) => a.percentile - b.percentile);
        const bestCategory = sortedByPercentile.find(c => c.userAmount > 0) || null;
        const worstCategory = sortedByPercentile.reverse().find(c => c.userAmount > 0) || null;

        return {
            totalUserSpending,
            totalAvgSpending,
            totalPotentialSavings,
            yearlyPotentialSavings,
            overallPercentile,
            categories,
            bestCategory,
            worstCategory,
        };
    }

    /**
     * Calculate average monthly spending from expenses
     */
    private calculateMonthlySpending(expenses: Expense[]): Record<string, number> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Filter to last 30 days
        const recentExpenses = expenses.filter(e => {
            const date = e.date?.toDate?.() || new Date(e.date as unknown as string);
            return date >= thirtyDaysAgo;
        });

        // Aggregate by category
        return recentExpenses.reduce((acc, e) => {
            const category = e.merchant?.category || 'other';
            acc[category] = (acc[category] || 0) + (e.amount || 0);
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Calculate percentile (0-100)
     * Using simplified normal distribution approximation
     */
    private calculatePercentile(userAmount: number, avgAmount: number): number {
        if (avgAmount === 0) return 50;

        // Ratio of user spending to average
        const ratio = userAmount / avgAmount;

        // Convert to percentile using sigmoid function
        // ratio = 1.0 -> 50th percentile
        // ratio = 0.5 -> ~20th percentile
        // ratio = 1.5 -> ~80th percentile
        const percentile = 100 / (1 + Math.exp(-2 * (ratio - 1)));

        return Math.round(Math.max(1, Math.min(99, percentile)));
    }

    /**
     * Get status based on percentile
     */
    private getStatus(percentile: number): BenchmarkResult['status'] {
        if (percentile <= 25) return 'excellent';
        if (percentile <= 50) return 'good';
        if (percentile <= 75) return 'average';
        return 'high';
    }

    /**
     * Generate human-readable insight
     */
    private generateInsight(
        category: string,
        userAmount: number,
        avgAmount: number,
        topAmount: number,
        status: BenchmarkResult['status']
    ): string {
        const categoryLabel = CATEGORY_LABELS[category] || category;
        const diff = userAmount - avgAmount;
        const diffAbs = Math.abs(diff);

        if (userAmount === 0) {
            return `Brak wydatków w kategorii ${categoryLabel.toLowerCase()} w tym miesiącu.`;
        }

        switch (status) {
            case 'excellent':
                return `Świetnie! Wydajesz mniej niż 75% użytkowników w kategorii ${categoryLabel.toLowerCase()}.`;
            case 'good':
                return `Nieźle! Jesteś poniżej średniej w kategorii ${categoryLabel.toLowerCase()}.`;
            case 'average':
                return `Wydajesz podobnie do innych. Możesz zaoszczędzić ${this.formatMoney(userAmount - topAmount)} osiągając poziom top 25%.`;
            case 'high':
                return `Uwaga! Wydajesz ${this.formatMoney(diffAbs)} więcej niż średnia. Potencjał oszczędności: ${this.formatMoney(userAmount - topAmount)}/msc.`;
        }
    }

    /**
     * Format money for display
     */
    private formatMoney(amount: number): string {
        return `${(amount / 100).toFixed(0)} zł`;
    }
}

export const benchmarkService = new BenchmarkService();
