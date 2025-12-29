/**
 * Savori Price Comparison Engine
 * Compares user spending to benchmarks and finds savings opportunities
 */

import { Expense, ExpenseCategory } from '@/types';

// ============ TYPES ============

export interface PriceComparison {
    category: ExpenseCategory;
    merchantName?: string;
    userAvg: number;
    benchmarkAvg: number;
    benchmarkMedian: number;
    percentile: number;        // 0-100, where they stand vs others
    difference: number;        // How much more/less they pay
    verdict: 'underpaying' | 'fair' | 'overpaying' | 'significantly_overpaying';
    suggestion?: string;
}

export interface MerchantComparison {
    merchantName: string;
    category: ExpenseCategory;
    userAvgTransaction: number;
    alternatives: AlternativeMerchant[];
    potentialSavings: number;
}

export interface AlternativeMerchant {
    name: string;
    avgTransaction: number;
    savingsPerVisit: number;
    confidence: number;
}

export interface CategoryBenchmark {
    category: ExpenseCategory;
    avgMonthly: number;
    medianMonthly: number;
    p25: number;    // 25th percentile
    p75: number;    // 75th percentile
    p90: number;    // 90th percentile
}

// ============ NATIONAL BENCHMARKS (PLN, grosze) ============

export const NATIONAL_BENCHMARKS: CategoryBenchmark[] = [
    { category: 'groceries', avgMonthly: 120000, medianMonthly: 100000, p25: 60000, p75: 150000, p90: 200000 },
    { category: 'restaurants', avgMonthly: 50000, medianMonthly: 35000, p25: 15000, p75: 80000, p90: 150000 },
    { category: 'transport', avgMonthly: 60000, medianMonthly: 45000, p25: 20000, p75: 90000, p90: 150000 },
    { category: 'utilities', avgMonthly: 80000, medianMonthly: 70000, p25: 50000, p75: 100000, p90: 150000 },
    { category: 'entertainment', avgMonthly: 30000, medianMonthly: 20000, p25: 5000, p75: 50000, p90: 100000 },
    { category: 'shopping', avgMonthly: 40000, medianMonthly: 25000, p25: 10000, p75: 60000, p90: 120000 },
    { category: 'health', avgMonthly: 25000, medianMonthly: 15000, p25: 5000, p75: 40000, p90: 80000 },
    { category: 'education', avgMonthly: 20000, medianMonthly: 10000, p25: 0, p75: 30000, p90: 60000 },
    { category: 'subscriptions', avgMonthly: 15000, medianMonthly: 10000, p25: 5000, p75: 25000, p90: 50000 },
    { category: 'other', avgMonthly: 30000, medianMonthly: 20000, p25: 5000, p75: 50000, p90: 100000 },
];

// ============ KNOWN MERCHANT ALTERNATIVES ============

const MERCHANT_ALTERNATIVES: Record<string, string[]> = {
    // Supermarkety
    'biedronka': ['lidl', 'aldi', 'netto'],
    'lidl': ['biedronka', 'aldi', 'netto'],
    'carrefour': ['biedronka', 'lidl', 'auchan'],
    'auchan': ['carrefour', 'biedronka', 'lidl'],
    'żabka': ['biedronka', 'lidl', 'lewiatan'],

    // Fast food
    'mcdonald\'s': ['burger king', 'kfc', 'max premium burgers'],
    'burger king': ['mcdonald\'s', 'kfc'],
    'kfc': ['mcdonald\'s', 'burger king'],
    'starbucks': ['costa coffee', 'green caffè nero', 'kawiarnia lokalna'],
    'costa coffee': ['starbucks', 'green caffè nero'],

    // Transport
    'uber': ['bolt', 'freenow', 'komunikacja miejska'],
    'bolt': ['uber', 'freenow', 'komunikacja miejska'],
    'orlen': ['bp', 'shell', 'circle k'],
    'bp': ['orlen', 'shell', 'circle k'],
    'shell': ['orlen', 'bp', 'circle k'],

    // Zakupy
    'zalando': ['reserved', 'h&m', 'zara'],
    'h&m': ['reserved', 'zara', 'sinsay'],
    'zara': ['h&m', 'reserved', 'mango'],
    'media expert': ['rtv euro agd', 'media markt', 'x-kom'],
    'rtv euro agd': ['media expert', 'media markt', 'x-kom'],
};

// ============ PRICE COMPARISON ENGINE ============

export class PriceCompareEngine {

    /**
     * Compare user's spending against national benchmarks
     */
    compareToNationalBenchmarks(
        expenses: Expense[],
        period: 'month' | 'week' = 'month'
    ): PriceComparison[] {
        const comparisons: PriceComparison[] = [];

        // Get period expenses
        const now = new Date();
        const periodStart = period === 'month'
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const periodExpenses = expenses.filter(e => {
            const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as unknown as string);
            return date >= periodStart;
        });

        // Group by category
        const byCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
        periodExpenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        // Compare each category
        Object.entries(byCategory).forEach(([cat, total]) => {
            const benchmark = NATIONAL_BENCHMARKS.find(b => b.category === cat);
            if (!benchmark) return;

            // Adjust benchmark for period
            const adjustedBenchmark = period === 'week'
                ? { avg: benchmark.avgMonthly / 4, median: benchmark.medianMonthly / 4 }
                : { avg: benchmark.avgMonthly, median: benchmark.medianMonthly };

            // Calculate percentile
            const percentile = this.calculatePercentile(total, benchmark);

            // Determine verdict
            let verdict: PriceComparison['verdict'];
            if (percentile < 25) verdict = 'underpaying';
            else if (percentile < 60) verdict = 'fair';
            else if (percentile < 85) verdict = 'overpaying';
            else verdict = 'significantly_overpaying';

            const difference = total - adjustedBenchmark.avg;

            comparisons.push({
                category: cat as ExpenseCategory,
                userAvg: total,
                benchmarkAvg: adjustedBenchmark.avg,
                benchmarkMedian: adjustedBenchmark.median,
                percentile,
                difference,
                verdict,
                suggestion: this.getSuggestion(cat as ExpenseCategory, verdict, difference),
            });
        });

        // Sort by difference (highest overpaying first)
        return comparisons.sort((a, b) => b.difference - a.difference);
    }

    /**
     * Find cheaper alternatives for user's frequent merchants
     */
    findCheaperAlternatives(expenses: Expense[]): MerchantComparison[] {
        const comparisons: MerchantComparison[] = [];

        // Group by merchant
        const byMerchant: Record<string, { expenses: Expense[]; total: number }> = {};
        expenses.forEach(e => {
            const name = e.merchant?.name?.toLowerCase() || 'unknown';
            if (!byMerchant[name]) byMerchant[name] = { expenses: [], total: 0 };
            byMerchant[name].expenses.push(e);
            byMerchant[name].total += e.amount;
        });

        // For each merchant, find alternatives
        Object.entries(byMerchant).forEach(([merchantName, data]) => {
            if (data.expenses.length < 2) return; // Need multiple visits

            const alternatives = this.findAlternatives(merchantName, expenses);
            if (alternatives.length === 0) return;

            const userAvg = data.total / data.expenses.length;
            const bestAlternative = alternatives[0];
            const potentialSavings = (userAvg - bestAlternative.avgTransaction) * data.expenses.length;

            if (potentialSavings > 0) {
                comparisons.push({
                    merchantName: data.expenses[0].merchant?.name || merchantName,
                    category: data.expenses[0].merchant?.category || 'other',
                    userAvgTransaction: userAvg,
                    alternatives,
                    potentialSavings,
                });
            }
        });

        // Sort by potential savings
        return comparisons.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }

    /**
     * Calculate total potential savings
     */
    calculateTotalSavingsPotential(expenses: Expense[]): {
        total: number;
        byCategory: Array<{ category: ExpenseCategory; potential: number; suggestion: string }>;
        byMerchant: MerchantComparison[];
    } {
        const categoryComparisons = this.compareToNationalBenchmarks(expenses);
        const merchantComparisons = this.findCheaperAlternatives(expenses);

        const byCategorySavings = categoryComparisons
            .filter(c => c.verdict === 'overpaying' || c.verdict === 'significantly_overpaying')
            .map(c => ({
                category: c.category,
                potential: c.difference,
                suggestion: c.suggestion || '',
            }));

        const categoryTotal = byCategorySavings.reduce((sum, c) => sum + c.potential, 0);
        const merchantTotal = merchantComparisons.reduce((sum, m) => sum + m.potentialSavings, 0);

        return {
            total: categoryTotal + merchantTotal,
            byCategory: byCategorySavings,
            byMerchant: merchantComparisons,
        };
    }

    /**
     * Generate savings report
     */
    generateSavingsReport(expenses: Expense[]): {
        summary: string;
        topOpportunities: string[];
        monthlyPotential: number;
        yearlyPotential: number;
    } {
        const savings = this.calculateTotalSavingsPotential(expenses);

        const topOpportunities: string[] = [];

        // Add category opportunities
        savings.byCategory.slice(0, 2).forEach(c => {
            topOpportunities.push(
                `${this.getCategoryLabel(c.category)}: możesz zaoszczędzić ${this.formatMoney(c.potential)}/mies`
            );
        });

        // Add merchant opportunities
        savings.byMerchant.slice(0, 2).forEach(m => {
            if (m.alternatives[0]) {
                topOpportunities.push(
                    `Zamień ${m.merchantName} na ${m.alternatives[0].name}: ${this.formatMoney(m.alternatives[0].savingsPerVisit)}/wizytę`
                );
            }
        });

        const monthlyPotential = savings.total;
        const yearlyPotential = monthlyPotential * 12;

        let summary: string;
        if (monthlyPotential > 50000) { // > 500 zł/mies
            summary = `Masz duży potencjał oszczędności! Możesz zaoszczędzić nawet ${this.formatMoney(yearlyPotential)} rocznie.`;
        } else if (monthlyPotential > 20000) { // > 200 zł/mies
            summary = `Masz dobry potencjał oszczędności - około ${this.formatMoney(monthlyPotential)} miesięcznie.`;
        } else {
            summary = `Twoje wydatki są w normie. Niewielkie optymalizacje mogą dać ${this.formatMoney(monthlyPotential)} miesięcznie.`;
        }

        return {
            summary,
            topOpportunities,
            monthlyPotential,
            yearlyPotential,
        };
    }

    // ============ HELPERS ============

    private calculatePercentile(value: number, benchmark: CategoryBenchmark): number {
        if (value <= benchmark.p25) return 25 * (value / benchmark.p25);
        if (value <= benchmark.medianMonthly) return 25 + 25 * ((value - benchmark.p25) / (benchmark.medianMonthly - benchmark.p25));
        if (value <= benchmark.p75) return 50 + 25 * ((value - benchmark.medianMonthly) / (benchmark.p75 - benchmark.medianMonthly));
        if (value <= benchmark.p90) return 75 + 15 * ((value - benchmark.p75) / (benchmark.p90 - benchmark.p75));
        return Math.min(99, 90 + 9 * ((value - benchmark.p90) / benchmark.p90));
    }

    private findAlternatives(merchantName: string, expenses: Expense[]): AlternativeMerchant[] {
        const normalizedName = merchantName.toLowerCase().replace(/[^a-ząćęłńóśźż]/g, '');

        // Find known alternatives
        const knownAlts = Object.entries(MERCHANT_ALTERNATIVES).find(([key]) =>
            normalizedName.includes(key) || key.includes(normalizedName)
        );

        if (!knownAlts) return [];

        // Check if user shops at alternatives
        const alternatives: AlternativeMerchant[] = [];
        const userAvg = this.getMerchantAvg(merchantName, expenses);

        knownAlts[1].forEach(altName => {
            const altAvg = this.getMerchantAvg(altName, expenses);

            // If user shops there and it's cheaper
            if (altAvg > 0 && altAvg < userAvg) {
                alternatives.push({
                    name: this.capitalize(altName),
                    avgTransaction: altAvg,
                    savingsPerVisit: userAvg - altAvg,
                    confidence: 0.8,
                });
            }
            // If user doesn't shop there, estimate based on known data
            else if (altAvg === 0) {
                // Use estimated average (placeholder - could be enriched with real data)
                const estimatedAvg = userAvg * 0.85; // Assume 15% cheaper
                alternatives.push({
                    name: this.capitalize(altName),
                    avgTransaction: estimatedAvg,
                    savingsPerVisit: userAvg - estimatedAvg,
                    confidence: 0.5,
                });
            }
        });

        return alternatives.sort((a, b) => b.savingsPerVisit - a.savingsPerVisit);
    }

    private getMerchantAvg(name: string, expenses: Expense[]): number {
        const merchantExpenses = expenses.filter(e =>
            e.merchant?.name?.toLowerCase().includes(name.toLowerCase())
        );

        if (merchantExpenses.length === 0) return 0;

        const total = merchantExpenses.reduce((sum, e) => sum + e.amount, 0);
        return total / merchantExpenses.length;
    }

    private getSuggestion(
        category: ExpenseCategory,
        verdict: PriceComparison['verdict'],
        difference: number
    ): string | undefined {
        if (verdict === 'fair' || verdict === 'underpaying') return undefined;

        const suggestions: Record<ExpenseCategory, string> = {
            groceries: 'Rozważ porównanie cen między sklepami lub zakupy na promocjach',
            restaurants: 'Gotowanie w domu może znacząco zmniejszyć wydatki',
            transport: 'Sprawdź bilet miesięczny lub carpooling',
            utilities: 'Porównaj taryfy i sprawdź oszczędne urządzenia',
            entertainment: 'Szukaj darmowych alternatyw i promocji',
            shopping: 'Zasada 48h przed zakupem i wyprzedaże',
            health: 'Sprawdź leki generyczne',
            education: 'Szukaj darmowych kursów online',
            subscriptions: 'Audyt subskrypcji - usuń nieużywane',
            other: 'Przeanalizuj dokładniej te wydatki',
        };

        return suggestions[category];
    }

    private formatMoney(amount: number): string {
        return `${(amount / 100).toFixed(0)} zł`;
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

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Singleton export
export const priceCompareEngine = new PriceCompareEngine();
