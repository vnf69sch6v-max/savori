/**
 * Financial Weather Service
 * Generates daily "weather forecast" for spending
 */

import { Expense, Budget } from '@/types';
import { formatMoney } from '@/lib/utils';
import { subDays, getDay } from 'date-fns';

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';

export interface FinancialWeather {
    condition: WeatherCondition;
    emoji: string;
    title: string;
    subtitle: string;
    advice: string;
    expectedSpending: number;
    safeToSpend: number;
    upcomingExpenses: UpcomingExpense[];
    riskLevel: 'low' | 'medium' | 'high';
    color: string;
}

export interface UpcomingExpense {
    name: string;
    amount: number;
    type: 'subscription' | 'bill' | 'predicted';
    dueDate?: Date;
}

const WEATHER_CONFIG: Record<WeatherCondition, { emoji: string; color: string }> = {
    sunny: { emoji: '☀️', color: 'from-amber-500 to-yellow-500' },
    partly_cloudy: { emoji: '⛅', color: 'from-blue-400 to-cyan-400' },
    cloudy: { emoji: '☁️', color: 'from-slate-400 to-slate-500' },
    rainy: { emoji: '🌧️', color: 'from-blue-600 to-indigo-600' },
    stormy: { emoji: '⛈️', color: 'from-purple-600 to-rose-600' },
};

// Day of week spending patterns (index 0 = Sunday)
const DAY_MULTIPLIERS = [1.3, 0.9, 0.85, 0.9, 0.95, 1.4, 1.5]; // Higher on weekends

class FinancialWeatherService {
    /**
     * Generate today's financial weather forecast
     */
    generateForecast(
        expenses: Expense[],
        budgets: Budget[],
        upcomingBills: UpcomingExpense[] = []
    ): FinancialWeather {
        const today = new Date();
        const dayOfWeek = getDay(today);

        // Calculate daily average from history
        const dailyAvg = this.calculateDailyAverage(expenses);

        // Apply day-of-week multiplier
        const expectedSpending = Math.round(dailyAvg * DAY_MULTIPLIERS[dayOfWeek]);

        // Calculate safe to spend
        const monthlyBudgetTotal = budgets.reduce((sum, b) => sum + (b.totalLimit || 0), 0);
        const daysInMonth = 30;
        const dayOfMonth = today.getDate();
        const daysRemaining = daysInMonth - dayOfMonth + 1;

        const monthlySpent = this.getMonthlySpent(expenses);
        const remainingBudget = monthlyBudgetTotal - monthlySpent;
        const safeToSpend = Math.max(0, Math.round(remainingBudget / daysRemaining));

        // Determine weather condition based on various factors
        const condition = this.determineCondition(
            expectedSpending,
            safeToSpend,
            upcomingBills,
            dayOfWeek
        );

        // Generate advice
        const advice = this.generateAdvice(condition, expectedSpending, safeToSpend, dayOfWeek);

        // Get title and subtitle
        const { title, subtitle } = this.getTitleAndSubtitle(condition, expectedSpending, dayOfWeek);

        // Risk level
        const riskLevel = this.calculateRiskLevel(expectedSpending, safeToSpend, upcomingBills);

        const config = WEATHER_CONFIG[condition];

        return {
            condition,
            emoji: config.emoji,
            title,
            subtitle,
            advice,
            expectedSpending,
            safeToSpend,
            upcomingExpenses: upcomingBills.slice(0, 3),
            riskLevel,
            color: config.color,
        };
    }

    /**
     * Calculate daily average from last 30 days
     */
    private calculateDailyAverage(expenses: Expense[]): number {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const recentExpenses = expenses.filter(e => {
            const date = e.date?.toDate?.() || new Date(e.date as unknown as string);
            return date >= thirtyDaysAgo;
        });

        const total = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return Math.round(total / 30);
    }

    /**
     * Get total spent this month
     */
    private getMonthlySpent(expenses: Expense[]): number {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return expenses
            .filter(e => {
                const date = e.date?.toDate?.() || new Date(e.date as unknown as string);
                return date >= startOfMonth;
            })
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    /**
     * Determine weather condition
     */
    private determineCondition(
        expectedSpending: number,
        safeToSpend: number,
        upcomingBills: UpcomingExpense[],
        dayOfWeek: number
    ): WeatherCondition {
        const ratio = expectedSpending / Math.max(safeToSpend, 1);
        const hasUpcomingBills = upcomingBills.length > 0;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Stormy: Expected spending way over safe limit or many bills
        if (ratio > 1.5 || (hasUpcomingBills && ratio > 1.2)) {
            return 'stormy';
        }

        // Rainy: Expected spending over safe limit
        if (ratio > 1.2 || upcomingBills.length >= 2) {
            return 'rainy';
        }

        // Cloudy: Close to limit or weekend (higher risk)
        if (ratio > 0.9 || (isWeekend && ratio > 0.7)) {
            return 'cloudy';
        }

        // Partly cloudy: Some spending expected but manageable
        if (ratio > 0.5 || hasUpcomingBills) {
            return 'partly_cloudy';
        }

        // Sunny: Low expected spending, no bills
        return 'sunny';
    }

    /**
     * Generate title and subtitle
     */
    private getTitleAndSubtitle(
        condition: WeatherCondition,
        expectedSpending: number,
        dayOfWeek: number
    ): { title: string; subtitle: string } {
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        switch (condition) {
            case 'sunny':
                return {
                    title: 'Słonecznie',
                    subtitle: isWeekend
                        ? 'Spokojny weekend na horyzoncie'
                        : 'Brak zaplanowanych wydatków',
                };
            case 'partly_cloudy':
                return {
                    title: 'Lekkie zachmurzenie',
                    subtitle: `Przewidywane wydatki: ~${formatMoney(expectedSpending)}`,
                };
            case 'cloudy':
                return {
                    title: 'Pochmurno',
                    subtitle: isWeekend
                        ? 'Weekend = większe ryzyko wydatków'
                        : 'Uważaj na impulsywne zakupy',
                };
            case 'rainy':
                return {
                    title: 'Deszczowo',
                    subtitle: 'Nadchodzą rachunki lub większe wydatki',
                };
            case 'stormy':
                return {
                    title: 'Burzowo',
                    subtitle: 'Ciężki dzień dla portfela',
                };
        }
    }

    /**
     * Generate advice based on conditions
     */
    private generateAdvice(
        condition: WeatherCondition,
        expectedSpending: number,
        safeToSpend: number,
        dayOfWeek: number
    ): string {
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFriday = dayOfWeek === 5;

        switch (condition) {
            case 'sunny':
                return 'Świetny dzień na oszczędzanie! Może przenieść trochę do celu?';
            case 'partly_cloudy':
                return isFriday
                    ? 'Piątek - planuj weekend mądrze!'
                    : 'Trzymaj się planu i będzie dobrze.';
            case 'cloudy':
                return isWeekend
                    ? 'Weekend = pokusy. Ustal limit przed wyjściem.'
                    : 'Unikaj spontanicznych zakupów.';
            case 'rainy':
                return `Bezpieczny limit na dziś: ${formatMoney(safeToSpend)}. Trzymaj się go!`;
            case 'stormy':
                return 'Dzień na zostanie w domu. Każda złotówka się liczy!';
        }
    }

    /**
     * Calculate risk level
     */
    private calculateRiskLevel(
        expectedSpending: number,
        safeToSpend: number,
        upcomingBills: UpcomingExpense[]
    ): 'low' | 'medium' | 'high' {
        const ratio = expectedSpending / Math.max(safeToSpend, 1);
        const billsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

        if (ratio > 1.2 || billsTotal > safeToSpend) {
            return 'high';
        }
        if (ratio > 0.8 || upcomingBills.length > 0) {
            return 'medium';
        }
        return 'low';
    }
}

export const financialWeatherService = new FinancialWeatherService();
