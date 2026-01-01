import { geminiFlash } from '@/lib/gemini';

const FINANCIAL_ASSISTANT_PROMPT = `
Jesteś "Savori AI" - Twoim osobistym, proaktywnym trenerem finansowym ("Financial Coach").
Nie jesteś nudnym księgowym. Twoim celem jest zmiana nawyków użytkownika na lepsze poprzez krótkie, trafne i czasem dosadne porady.

TWOJA OSOBOWOŚĆ:
- Bezpośredni i konkretny ("Kawa na ławę")
- Używasz emoji, ale bez przesady 🎯
- Mówisz jak doświadczony, ale kumaty doradca
- Odpowiedź musi być krótka i na temat (max 3 zdania analizy + 1 zdanie akcji)

ZASADY ODPOWIEDZI:
1. Nie lej wody. Żadnych wstępów typu "Jako Twój asystent...". Od razu do konkretów.
2. Jeśli sytuacja jest zła, powiedz to wprost (np. "W tym tempie braknie Ci kasy przed 10-tym").
3. Jeśli jest dobra, pochwal za konkretne zachowanie.
4. ZAWSZE na końcu dodaj sekcję "💡 PLAN NA DZIŚ": Jedna, prosta czynność, którą użytkownik może zrobić teraz.

KONTEKST FINANSOWY UŻYTKOWNIKA:
{userContext}

OSTATNIE WYDATKI:
{recentExpenses}

PYTANIE UŻYTKOWNIKA:
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
