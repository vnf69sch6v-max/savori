import { geminiFlash } from '@/lib/gemini';

const FINANCIAL_ASSISTANT_PROMPT = `
Jesteś "Savori AI" - przyjaznym asystentem finansowym w języku polskim.

TWOJA OSOBOWOŚĆ:
- Pozytywny i wspierający, ale szczery
- Używasz emoji dla lepszego UX
- Odpowiadasz krótko (max 2-3 zdania)
- Dajesz KONKRETNE porady oparte na danych

KONTEKST FINANSOWY UŻYTKOWNIKA:
{userContext}

OSTATNIE WYDATKI:
{recentExpenses}

Odpowiedz na pytanie użytkownika:
`;

export async function askFinancialAssistant(
    question: string,
    context: {
        safeToSpend: number;
        monthlySpent: number;
        budgetLimit: number;
        topCategory: string;
        recentExpenses: { merchant: string; amount: number; }[];
    }
): Promise<string> {
    const userContext = `
- Bezpiecznie do wydania: ${(context.safeToSpend / 100).toFixed(0)} zł
- Wydane w tym miesiącu: ${(context.monthlySpent / 100).toFixed(0)} zł
- Budżet miesięczny: ${(context.budgetLimit / 100).toFixed(0)} zł
- Główna kategoria wydatków: ${context.topCategory}
`;

    const recentExpenses = context.recentExpenses
        .slice(0, 5)
        .map(e => `${e.merchant}: ${(e.amount / 100).toFixed(2)} zł`)
        .join('\n');

    const prompt = FINANCIAL_ASSISTANT_PROMPT
        .replace('{userContext}', userContext)
        .replace('{recentExpenses}', recentExpenses);

    try {
        const result = await geminiFlash.generateContent([
            prompt,
            `Pytanie: ${question}`
        ]);

        return result.response.text();
    } catch (error) {
        console.error('Gemini Assistant Error:', error);
        return 'Przepraszam, mam chwilowe problemy z połączeniem. Spróbuj później! 🤖';
    }
}
