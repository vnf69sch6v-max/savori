import { geminiFlash } from '@/lib/gemini';
import { Expense } from '@/types';

const INSIGHT_GENERATION_PROMPT = `
Jesteś AI generującym mikro-insighty finansowe.
Na podstawie wydatku wygeneruj JEDEN krótki insight (max 6 słów).

Przykłady:
- "15% więcej niż zwykle"
- "Trzeci raz w tym tygodniu"
- "Najtańsza opcja w kategorii"
- "Możliwa subskrypcja"
- "Okazja cenowa!"

Wydatek:
- Sklep: {merchant}
- Kwota: {amount} zł
- Kategoria: {category}
- Historia u tego sprzedawcy: {history}

Wygeneruj insight:
`;

export async function generateMicroInsight(
    expense: Expense,
    history: Expense[]
): Promise<string | null> {
    // Tylko dla wydatków > 20 zł
    if (expense.amount < 2000) return null;

    const samesMerchant = history.filter(
        e => e.merchant.name === expense.merchant.name
    );

    const prompt = INSIGHT_GENERATION_PROMPT
        .replace('{merchant}', expense.merchant.name)
        .replace('{amount}', (expense.amount / 100).toFixed(2))
        .replace('{category}', expense.merchant.category)
        .replace('{history}', `${samesMerchant.length} wizyt`);

    try {
        const result = await geminiFlash.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Insight Generation Error:', error);
        return null;
    }
}

const DASHBOARD_ANALYSIS_PROMPT = `
Jesteś analitykiem finansowym AI. Przeanalizuj ostatnie wydatki użytkownika i znajdź JEDEN najciekawszy wzorzec, anomalię lub poradę.
Bądź krótki, konkretny i motywujący.

Ostatnie wydatki:
{expenses}

Wydatki per kategoria:
{categories}

Zwróć odpowiedź w formacie JSON:
{
  "title": "Krótki tytuł (np. 'Wydatki na kawę')",
  "message": "Treść insightu (max 2 zdania)",
  "type": "spending_spike" | "savings_opportunity" | "praise",
  "priority": "medium" | "high"
}
`;

export async function generateDashboardInsights(
    expenses: Expense[]
): Promise<{ title: string; message: string; type: string; priority: string } | null> {
    if (expenses.length < 3) return null;

    // Prepare context
    const recent = expenses.slice(0, 15);
    const expensesList = recent
        .map(e => `- ${e.merchant.name}: ${(e.amount / 100).toFixed(2)} zł (${e.merchant.category})`)
        .join('\n');

    // Group by category
    const byCategory: Record<string, number> = {};
    recent.forEach(e => {
        const cat = e.merchant.category;
        byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });
    const categoriesList = Object.entries(byCategory)
        .map(([k, v]) => `- ${k}: ${(v / 100).toFixed(2)} zł`)
        .join('\n');

    const prompt = DASHBOARD_ANALYSIS_PROMPT
        .replace('{expenses}', expensesList)
        .replace('{categories}', categoriesList);

    try {
        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Dashboard Insight Error:', error);
        return null;
    }
}
