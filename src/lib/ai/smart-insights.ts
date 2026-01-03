/**
 * Savori Smart Insights v2.0
 * Goal-aware, context-rich AI insights using Gemini
 */

import { geminiFlash } from '@/lib/gemini';
import { Expense, SavingGoal } from '@/types';
import { calculateStats, calculateVolatility } from '@/lib/math/statistics';

// ============ CONTEXTS ============

export interface UserContext {
    savingGoals?: SavingGoal[];
    monthlyBudget?: number;
    spendingTrend?: 'up' | 'down' | 'stable';
    topCategory?: string;
    daysUntilPayday?: number;
}

// ============ PROMPTS ============

const MICRO_INSIGHT_PROMPT = `
Jesteś AI generującym mikro-insighty finansowe w kontekście celu użytkownika.
Na podstawie wydatku wygeneruj JEDEN krótki insight (max 8 słów).
Insight musi być związany z celem oszczędnościowym jeśli podany.

Cel użytkownika: {goal}
Wydatek:
- Sklep: {merchant}
- Kwota: {amount} zł
- Kategoria: {category}
- Historia u tego sprzedawcy: {history} wizyt
- Zmienność wydatków: {volatility}

Przykłady:
- "Cel 'Wakacje' bliżej o 50 zł ✈️" (gdy zaoszczędził)
- "15% więcej niż Twoja średnia"
- "Trzeci raz w tym tygodniu 🤔"
- "Dzięki temu dotrzesz do celu szybciej!"
- "To opóźni cel o ~2 dni"

Wygeneruj insight (bez cudzysłowów):
`;

const DASHBOARD_ANALYSIS_PROMPT = `
Jesteś osobistym analitykiem finansowym AI o imieniu Savori.
Przeanalizuj wydatki użytkownika w kontekście jego celów i znajdź JEDEN najważniejszy insight.

=== KONTEKST UŻYTKOWNIKA ===
Główny cel oszczędnościowy: {goal}
Trend wydatków: {trend}
Zmienność wydatków: {volatility}
Dni do wypłaty: {payday}

=== WYDATKI (ostatnie 15) ===
{expenses}

=== SUMA PER KATEGORIA ===
{categories}

=== STATYSTYKI ===
- Średnia transakcja: {avgAmount} zł
- Max transakcja: {maxAmount} zł
- Liczba transakcji: {count}

=== TWOJE ZADANIE ===
Znajdź JEDEN najciekawszy wzorzec i napisz insight który:
1. Jest związany z celem użytkownika (jeśli podany)
2. Jest konkretny i zawiera liczby
3. Motywuje do działania

Zwróć TYLKO JSON (bez markdown):
{
  "title": "Krótki tytuł (4-6 słów)",
  "message": "Treść insightu (1-2 zdania, max 100 znaków)",
  "type": "spending_spike" | "savings_opportunity" | "praise" | "goal_progress",
  "priority": "medium" | "high",
  "emoji": "odpowiedni emoji"
}
`;

// ============ FUNCTIONS ============

export async function generateMicroInsight(
    expense: Expense,
    history: Expense[],
    context?: UserContext
): Promise<string | null> {
    // Tylko dla wydatków > 10 zł
    if (expense.amount < 1000) return null;

    const sameMerchant = history.filter(
        e => e.merchant?.name === expense.merchant?.name
    );

    // Calculate volatility for this merchant
    const amounts = sameMerchant.map(e => e.amount);
    const volatility = amounts.length >= 3
        ? calculateVolatility(amounts)
        : 0;

    // Get goal context
    const goalContext = context?.savingGoals?.[0]?.name
        ? `Oszczędzam na: "${context.savingGoals[0].name}"`
        : 'Brak konkretnego celu';

    const prompt = MICRO_INSIGHT_PROMPT
        .replace('{goal}', goalContext)
        .replace('{merchant}', expense.merchant?.name || 'Nieznany')
        .replace('{amount}', (expense.amount / 100).toFixed(2))
        .replace('{category}', expense.merchant?.category || 'other')
        .replace('{history}', String(sameMerchant.length))
        .replace('{volatility}', volatility > 0.3 ? 'wysoka' : volatility > 0.15 ? 'średnia' : 'niska');

    try {
        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text().trim();
        // Clean up: remove quotes if present
        return text.replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('Micro Insight Error:', error);
        return null;
    }
}

export async function generateDashboardInsights(
    expenses: Expense[],
    context?: UserContext
): Promise<{
    title: string;
    message: string;
    type: string;
    priority: string;
    emoji?: string;
} | null> {
    if (expenses.length < 3) return null;

    // Prepare context
    const recent = expenses.slice(0, 15);
    const expensesList = recent
        .map(e => `- ${e.merchant?.name || 'Nieznany'}: ${(e.amount / 100).toFixed(2)} zł (${e.merchant?.category || 'other'})`)
        .join('\n');

    // Group by category
    const byCategory: Record<string, number> = {};
    recent.forEach(e => {
        const cat = e.merchant?.category || 'other';
        byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });
    const categoriesList = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `- ${k}: ${(v / 100).toFixed(2)} zł`)
        .join('\n');

    // Calculate statistics
    const amounts = recent.map(e => e.amount);
    const stats = calculateStats(amounts);
    const volatility = calculateVolatility(amounts);

    // Goal context
    const goalContext = context?.savingGoals?.[0]?.name
        ? `"${context.savingGoals[0].name}" (cel: ${(context.savingGoals[0].targetAmount / 100).toFixed(0)} zł)`
        : 'Brak zdefiniowanego celu';

    const prompt = DASHBOARD_ANALYSIS_PROMPT
        .replace('{goal}', goalContext)
        .replace('{trend}', context?.spendingTrend || 'nieznany')
        .replace('{volatility}', volatility > 0.5 ? 'wysoka' : volatility > 0.25 ? 'średnia' : 'niska')
        .replace('{payday}', context?.daysUntilPayday ? String(context.daysUntilPayday) : 'nieznane')
        .replace('{expenses}', expensesList)
        .replace('{categories}', categoriesList)
        .replace('{avgAmount}', (stats.mean / 100).toFixed(2))
        .replace('{maxAmount}', (stats.max / 100).toFixed(2))
        .replace('{count}', String(stats.count));

    try {
        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();

        // Clean markdown code blocks if present
        const jsonStr = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Dashboard Insight Error:', error);
        return null;
    }
}

/**
 * Generate a quick insight for a spending pattern
 */
export async function generatePatternInsight(
    patternDescription: string,
    amount: number,
    goalName?: string
): Promise<string | null> {
    const prompt = `
Jesteś AI finansowym. Użytkownik ma wzorzec wydatków: "${patternDescription}" (${(amount / 100).toFixed(2)} zł).
${goalName ? `Cel oszczędnościowy: "${goalName}"` : ''}

Napisz JEDNĄ radę (max 15 słów) jak to poprawić lub wykorzystać. Bądź konkretny i motywujący.
`;

    try {
        const result = await geminiFlash.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Pattern Insight Error:', error);
        return null;
    }
}
