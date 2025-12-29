/**
 * Savori Anomaly Detection System
 * Detects unusual spending patterns and potential issues
 */

import { Expense, ExpenseCategory } from '@/types';

// ============ TYPES ============

export type AnomalyType =
    | 'unusual_amount'       // Kwota znacznie odbiega od normy
    | 'unusual_frequency'    // Zbyt częste/rzadkie zakupy
    | 'unusual_time'         // Nietypowa pora (np. 3:00 w nocy)
    | 'unusual_merchant'     // Nieznany/nietypowy sklep
    | 'duplicate_suspect'    // Podejrzenie duplikatu
    | 'spending_spike'       // Nagły wzrost w kategorii
    | 'pattern_break'        // Przerwany wzorzec (brak cyklicznego wydatku)
    | 'budget_overrun';      // Znaczne przekroczenie budżetu

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
    id: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    title: string;
    description: string;
    confidence: number;
    relatedExpenseId?: string;
    relatedCategory?: ExpenseCategory;
    suggestedAction?: string;
    detectedAt: Date;
}

export interface AnomalyConfig {
    amountZScore: number;           // Z-score threshold for amount anomaly
    frequencyMultiplier: number;    // Multiplier for unusual frequency
    unusualHours: [number, number]; // Range of hours considered unusual
    duplicateWindowHours: number;   // Window for duplicate detection
}

// ============ DEFAULT CONFIG ============

const DEFAULT_CONFIG: AnomalyConfig = {
    amountZScore: 2.5,
    frequencyMultiplier: 3,
    unusualHours: [0, 5], // 00:00 - 05:00
    duplicateWindowHours: 2,
};

// ============ ANOMALY DETECTOR ============

export class AnomalyDetector {
    private config: AnomalyConfig;

    constructor(config: Partial<AnomalyConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Detect all anomalies for a new expense
     */
    detectAnomalies(
        newExpense: Expense,
        historicalExpenses: Expense[],
        budgets?: Array<{ category: ExpenseCategory; limit: number; spent: number }>
    ): Anomaly[] {
        const anomalies: Anomaly[] = [];

        // 1. Unusual amount
        const amountAnomaly = this.detectUnusualAmount(newExpense, historicalExpenses);
        if (amountAnomaly) anomalies.push(amountAnomaly);

        // 2. Unusual time
        const timeAnomaly = this.detectUnusualTime(newExpense);
        if (timeAnomaly) anomalies.push(timeAnomaly);

        // 3. Duplicate suspect
        const duplicateAnomaly = this.detectDuplicate(newExpense, historicalExpenses);
        if (duplicateAnomaly) anomalies.push(duplicateAnomaly);

        // 4. Spending spike in category
        const spikeAnomaly = this.detectCategorySpike(newExpense, historicalExpenses);
        if (spikeAnomaly) anomalies.push(spikeAnomaly);

        // 5. Budget overrun
        if (budgets) {
            const budgetAnomaly = this.detectBudgetOverrun(newExpense, budgets);
            if (budgetAnomaly) anomalies.push(budgetAnomaly);
        }

        // 6. Unusual frequency
        const frequencyAnomaly = this.detectUnusualFrequency(newExpense, historicalExpenses);
        if (frequencyAnomaly) anomalies.push(frequencyAnomaly);

        return anomalies;
    }

    /**
     * Detect if expense amount is unusually high/low
     */
    private detectUnusualAmount(expense: Expense, history: Expense[]): Anomaly | null {
        const category = expense.merchant?.category || 'other';

        // Get historical amounts for this category
        const categoryExpenses = history.filter(e => e.merchant?.category === category);
        if (categoryExpenses.length < 5) return null; // Need enough data

        const amounts = categoryExpenses.map(e => e.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) return null;

        const zScore = (expense.amount - mean) / stdDev;

        if (Math.abs(zScore) > this.config.amountZScore) {
            const isHigh = zScore > 0;
            const severity: AnomalySeverity = Math.abs(zScore) > 4 ? 'high' : 'medium';

            return {
                id: this.generateId(),
                type: 'unusual_amount',
                severity,
                title: isHigh ? 'Kwota znacznie wyższa niż zwykle' : 'Kwota znacznie niższa niż zwykle',
                description: `${this.formatMoney(expense.amount)} jest ${isHigh ? 'wyższa' : 'niższa'} od średniej (${this.formatMoney(mean)}) o ${Math.abs(zScore).toFixed(1)} odchyleń standardowych`,
                confidence: Math.min(0.95, 0.7 + categoryExpenses.length * 0.02),
                relatedExpenseId: expense.id,
                relatedCategory: category,
                suggestedAction: isHigh ? 'Sprawdź czy to nie był błąd' : undefined,
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Detect unusual transaction time
     */
    private detectUnusualTime(expense: Expense): Anomaly | null {
        const expenseDate = expense.date?.toDate
            ? expense.date.toDate()
            : new Date(expense.date as unknown as string);

        const hour = expenseDate.getHours();
        const [startHour, endHour] = this.config.unusualHours;

        if (hour >= startHour && hour <= endHour) {
            return {
                id: this.generateId(),
                type: 'unusual_time',
                severity: 'low',
                title: 'Transakcja w nietypowej porze',
                description: `Wydatek o ${hour}:${expenseDate.getMinutes().toString().padStart(2, '0')} - to nietypowa pora`,
                confidence: 0.8,
                relatedExpenseId: expense.id,
                suggestedAction: expense.amount > 10000 ? 'Zweryfikuj tę transakcję' : undefined,
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Detect potential duplicate transactions
     */
    private detectDuplicate(expense: Expense, history: Expense[]): Anomaly | null {
        const expenseDate = expense.date?.toDate
            ? expense.date.toDate()
            : new Date(expense.date as unknown as string);

        const windowStart = new Date(expenseDate.getTime() - this.config.duplicateWindowHours * 60 * 60 * 1000);
        const windowEnd = new Date(expenseDate.getTime() + this.config.duplicateWindowHours * 60 * 60 * 1000);

        // Find similar transactions in time window
        const similar = history.filter(e => {
            if (e.id === expense.id) return false;

            const eDate = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            if (eDate < windowStart || eDate > windowEnd) return false;

            // Same amount and similar merchant
            const sameAmount = e.amount === expense.amount;
            const sameMerchant = e.merchant?.name?.toLowerCase() === expense.merchant?.name?.toLowerCase();

            return sameAmount && sameMerchant;
        });

        if (similar.length > 0) {
            return {
                id: this.generateId(),
                type: 'duplicate_suspect',
                severity: 'medium',
                title: 'Podejrzenie duplikatu',
                description: `Znaleziono ${similar.length} podobną transakcję w ciągu ${this.config.duplicateWindowHours}h`,
                confidence: 0.75,
                relatedExpenseId: expense.id,
                suggestedAction: 'Sprawdź czy to nie duplikat',
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Detect spending spike in category
     */
    private detectCategorySpike(expense: Expense, history: Expense[]): Anomaly | null {
        const category = expense.merchant?.category || 'other';
        const now = new Date();

        // Get last 7 days spending in category
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeek = history.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= weekAgo && e.merchant?.category === category;
        });

        // Get previous week
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const lastWeek = history.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= twoWeeksAgo && date < weekAgo && e.merchant?.category === category;
        });

        const thisWeekTotal = thisWeek.reduce((sum, e) => sum + e.amount, 0) + expense.amount;
        const lastWeekTotal = lastWeek.reduce((sum, e) => sum + e.amount, 0);

        if (lastWeekTotal > 0 && thisWeekTotal > lastWeekTotal * 2) {
            const increasePercent = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);

            return {
                id: this.generateId(),
                type: 'spending_spike',
                severity: increasePercent > 200 ? 'high' : 'medium',
                title: `Gwałtowny wzrost w kategorii ${this.getCategoryLabel(category)}`,
                description: `Wydatki wzrosły o ${increasePercent}% w porównaniu z poprzednim tygodniem`,
                confidence: 0.85,
                relatedCategory: category,
                suggestedAction: 'Sprawdź co spowodowało wzrost',
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Detect budget overrun
     */
    private detectBudgetOverrun(
        expense: Expense,
        budgets: Array<{ category: ExpenseCategory; limit: number; spent: number }>
    ): Anomaly | null {
        const category = expense.merchant?.category || 'other';
        const budget = budgets.find(b => b.category === category);

        if (!budget) return null;

        const newSpent = budget.spent + expense.amount;
        const percentOver = ((newSpent - budget.limit) / budget.limit) * 100;

        if (percentOver > 20) {
            return {
                id: this.generateId(),
                type: 'budget_overrun',
                severity: percentOver > 50 ? 'critical' : 'high',
                title: `Budżet ${this.getCategoryLabel(category)} przekroczony`,
                description: `Przekroczono limit o ${Math.round(percentOver)}%`,
                confidence: 1.0,
                relatedCategory: category,
                relatedExpenseId: expense.id,
                suggestedAction: 'Rozważ dostosowanie budżetu',
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Detect unusual shopping frequency
     */
    private detectUnusualFrequency(expense: Expense, history: Expense[]): Anomaly | null {
        const merchantName = expense.merchant?.name?.toLowerCase();
        if (!merchantName) return null;

        // Count visits to this merchant in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentVisits = history.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= weekAgo && e.merchant?.name?.toLowerCase() === merchantName;
        });

        if (recentVisits.length >= 5) {
            return {
                id: this.generateId(),
                type: 'unusual_frequency',
                severity: 'low',
                title: 'Częste wizyty w tym samym miejscu',
                description: `${recentVisits.length + 1} wizyt w ${expense.merchant?.name} w ciągu tygodnia`,
                confidence: 0.7,
                relatedExpenseId: expense.id,
                suggestedAction: 'Czy da się skonsolidować zakupy?',
                detectedAt: new Date(),
            };
        }

        return null;
    }

    /**
     * Analyze historical data for pattern breaks
     */
    detectPatternBreaks(history: Expense[]): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const now = new Date();

        // Find recurring expenses that didn't occur
        const recurringPatterns = this.findRecurringPatterns(history);

        recurringPatterns.forEach(pattern => {
            if (pattern.expectedDate < now && !pattern.occurred) {
                anomalies.push({
                    id: this.generateId(),
                    type: 'pattern_break',
                    severity: 'low',
                    title: 'Brakujący cykliczny wydatek',
                    description: `${pattern.merchantName} zwykle pojawia się ${pattern.frequency}, ale brak od ${this.formatDate(pattern.lastOccurrence)}`,
                    confidence: 0.6,
                    suggestedAction: 'Czy zapomniałeś o abonamencie?',
                    detectedAt: new Date(),
                });
            }
        });

        return anomalies;
    }

    /**
     * Find recurring spending patterns
     */
    private findRecurringPatterns(history: Expense[]): Array<{
        merchantName: string;
        frequency: string;
        expectedDate: Date;
        lastOccurrence: Date;
        occurred: boolean;
    }> {
        const patterns: Array<{
            merchantName: string;
            frequency: string;
            expectedDate: Date;
            lastOccurrence: Date;
            occurred: boolean;
        }> = [];

        // Group by merchant
        const byMerchant: Record<string, Expense[]> = {};
        history.forEach(e => {
            const name = e.merchant?.name || 'Unknown';
            if (!byMerchant[name]) byMerchant[name] = [];
            byMerchant[name].push(e);
        });

        Object.entries(byMerchant).forEach(([merchantName, expenses]) => {
            if (expenses.length < 3) return;

            const dates = expenses
                .map(e => e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string))
                .sort((a, b) => a.getTime() - b.getTime());

            // Calculate average interval
            const intervals: number[] = [];
            for (let i = 1; i < dates.length; i++) {
                intervals.push(dates[i].getTime() - dates[i - 1].getTime());
            }

            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const days = Math.round(avgInterval / (24 * 60 * 60 * 1000));

            // Check if it's regular (low variance)
            const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance) / (24 * 60 * 60 * 1000);

            if (stdDev < days * 0.3) { // Regular if variance < 30% of interval
                const lastDate = dates[dates.length - 1];
                const expectedDate = new Date(lastDate.getTime() + avgInterval);

                let frequency = '';
                if (days <= 7) frequency = 'co tydzień';
                else if (days <= 15) frequency = 'co 2 tygodnie';
                else if (days <= 35) frequency = 'co miesiąc';
                else frequency = `co ${days} dni`;

                patterns.push({
                    merchantName,
                    frequency,
                    expectedDate,
                    lastOccurrence: lastDate,
                    occurred: expectedDate > new Date(),
                });
            }
        });

        return patterns;
    }

    // ============ HELPERS ============

    private generateId(): string {
        return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private formatMoney(amount: number): string {
        return `${(amount / 100).toFixed(2).replace('.', ',')} zł`;
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('pl', { day: 'numeric', month: 'short' });
    }

    private getCategoryLabel(category: ExpenseCategory): string {
        const labels: Record<ExpenseCategory, string> = {
            groceries: 'Zakupy spożywcze',
            restaurants: 'Jedzenie na mieście',
            transport: 'Transport',
            utilities: 'Opłaty',
            entertainment: 'Rozrywka',
            shopping: 'Zakupy',
            health: 'Zdrowie',
            education: 'Edukacja',
            subscriptions: 'Subskrypcje',
            other: 'Inne',
        };
        return labels[category] || 'Inne';
    }
}

// Singleton export
export const anomalyDetector = new AnomalyDetector();
