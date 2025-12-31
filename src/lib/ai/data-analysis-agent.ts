import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, ExpenseCategory } from '@/types';
import { formatMoney } from '@/lib/utils'; // Assuming this exists, need to verify import path or inline it if it's client side only. It is in utils but might be using client specific Intl. Server side safe? Yes usually.

// We need a robust prompt builder
class PromptBuilder {
    static generateMonthlyReport(
        expenses: Expense[],
        totalSpent: number,
        budget: number | null,
        topCategories: { category: string; amount: number }[]
    ): string {
        return `
Jesteś Savori AI, zaawansowanym analitykiem finansowym dla finansów osobistych.
Twoim zadaniem jest wygenerowanie szczegółowego, ale przystępnego raportu miesięcznego.

DANE:
- Łączne wydatki: ${totalSpent.toFixed(2)} zł
- Budżet: ${budget ? budget.toFixed(2) + ' zł' : 'Nieustalony'}
- Top Kategorie:
${topCategories.map(c => `- ${c.category}: ${c.amount.toFixed(2)} zł`).join('\n')}
- Liczba transakcji: ${expenses.length}

ZADANIE:
Przygotuj raport w formacie Markdown zawierający:
1. **Podsumowanie miesiąca**: Krótka ocena sytuacji (czy jest dobrze, czy źle).
2. **Analiza budżetu**: Jak użytkownik radzi sobie z limitem (jeśli podano).
3. **Trendy**: Co dominowało w wydatkach.
4. **Zalecenia**: 3 konkretne kroki na przyszły miesiąc.

Styl: Profesjonalny, ale motywujący. Używaj emoji. Formatuj tekst pogrubieniami.
`;
    }

    static analyzeTrends(expenses: Expense[]): string {
        // Prepare simplified data for the AI to "see" patterns without slight noise
        const simplifiedData = expenses.map(e => ({
            date: e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date), // Handle timestamps if needed
            amount: e.amount,
            category: e.merchant?.category,
            merchant: e.merchant?.name
        })).slice(0, 50); // Limit context window

        return `
Jesteś "Detektywem Finansowym" Savori.
Znajdź ukryte wzorce w wydatkach użytkownika.

OSTATNIE 50 TRANSAKCJI:
${JSON.stringify(simplifiedData)}

ZADANIE:
Znajdź 2-3 ciekawe korelacje lub trendy, np.:
- "Dziwnie dużo wydajesz w piątki na jedzenie."
- "Sklep X pojawia się coraz częściej."
- "Kategoria Y rośnie w tempie wykładniczym."

Odpowiedz krótko i konkretnie. Jeśli nie ma wyraźnych trendów, napisz "Wydatki wyglądają stabilnie".
`;
    }

    static forecastExpenses(expenses: Expense[]): string {
        const dailyTotals: Record<string, number> = {};
        expenses.forEach(e => {
            const date = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date);
            dailyTotals[date] = (dailyTotals[date] || 0) + (e.amount || 0);
        });

        // Ensure we send ordered data
        const sortedDays = Object.entries(dailyTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30);

        return `
Jesteś AI "Futurystą Finansowym".
Twoim zadaniem jest przewidzieć wydatki użytkownika na następne 7 dni.

HISTORIA WYDATKÓW (ostatnie 30 dni):
${JSON.stringify(sortedDays)}

ZADANIE:
Na podstawie historii przewiduj, ile użytkownik wyda w kolejnych 7 dniach.
Bierz pod uwagę trendy (np. więcej w weekendy, stałe rachunki jeśli widać).

Odpowiedz WYŁĄCZNIE poprawnym formatem JSON:
[
  { "date": "YYYY-MM-DD", "amount": 123.45, "reason": "Weekendowe zakupy" },
  ... (7 dni)
]
`;
    }
}

export class DataAnalysisAgent {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async generateMonthlyReport(expenses: Expense[], budget: number | null): Promise<string> {
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Calculate aggregations
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => {
            const cat = e.merchant?.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
        });

        const topCategories = Object.entries(byCategory)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        const prompt = PromptBuilder.generateMonthlyReport(expenses, totalSpent, budget, topCategories);

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('DataAnalysisAgent Error:', error);
            return 'Przepraszam, nie udało mi się wygenerować raportu w tej chwili.';
        }
    }

    async analyzeTrends(expenses: Expense[]): Promise<string> {
        if (expenses.length < 5) return 'Za mało danych do analizy trendów.';

        const prompt = PromptBuilder.analyzeTrends(expenses);

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('DataAnalysisAgent Error:', error);
            return 'Nie udało się przeanalizować trendów.';
        }
    }

    async ask(question: string, contextData: any): Promise<string> {
        const prompt = `
Jesteś inteligentnym asystentem finansowym Savori.
Odpowiadasz na pytania użytkownika dotyczące jego finansów.

KONTEKST DANYCH:
${JSON.stringify(contextData)}

PYTANIE UŻYTKOWNIKA:
"${question}"

ZADANIE:
Udziel konkretnej, opartej na danych odpowiedzi. Jeśli brakuje danych, powiedz to wprost.
Bądź pomocny i uprzejmy.
`;
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('DataAnalysisAgent Error:', error);
            return 'Przepraszam, mam problem z odpowiedzią na to pytanie.';
        }
    }

    async forecastExpenses(expenses: Expense[]): Promise<any[]> {
        if (expenses.length < 5) return [];

        const prompt = PromptBuilder.forecastExpenses(expenses);

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            console.error('DataAnalysisAgent Error:', error);
            return [];
        }
    }
}
