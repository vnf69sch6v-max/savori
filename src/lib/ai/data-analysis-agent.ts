import { getAIModel } from '@/lib/firebase';
import { Expense, ExpenseCategory } from '@/types';
import { Timestamp } from 'firebase/firestore';
// Note: formatMoney import removed as it's not used in this server-side module

// Helper type for date conversion
type FirestoreDate = Timestamp | Date;

// We need a robust prompt builder
class PromptBuilder {
    static generateMonthlyReport(
        expenses: Expense[],
        totalSpent: number,
        budget: number | null,
        topCategories: { category: string; amount: number }[]
    ): string {
        return `
Jesteś Savori AI, zaawansowanym analitykiem finansowym.
Twoim celem nie jest nudne raportowanie, ale wskazanie kluczowych obszarów do poprawy.

DANE:
- Łączne wydatki: ${totalSpent.toFixed(2)} zł
- Budżet: ${budget ? budget.toFixed(2) + ' zł' : 'Nieustalony'}
- Top Maszynki do mielenia pieniędzy (Kategorie):
${topCategories.map(c => `- ${c.category}: ${c.amount.toFixed(2)} zł`).join('\n')}
- Liczba transakcji: ${expenses.length}

ZADANIE:
Przygotuj raport w formacie Markdown:
1. **Werdykt Miesiąca**: Jedno zdanie podsumowania (np. "Było groźnie, ale dałeś radę" lub "Totalna katastrofa").
2. **Analiza Budżetu**: Krótko o stopniu realizacji planu.
3. **Główny Winowajca**: Kategoria, która zjadła najwięcej, z komentarzem czy to konieczne wydatki.
4. **🔥 SMART ACTIONS**: 3 ultra-konkretne kroki na przyszły miesiąc. Nie pisz "oszczędzaj". Pisz "Zmniejsz wydatki na Ubera o połowę".

Styl: Profesjonalny, ale z charakterem. Używaj pogrubień dla kluczowych liczb.
`;
    }

    static analyzeTrends(expenses: Expense[]): string {
        // Safe date helper
        const getDate = (d: FirestoreDate): Date => d instanceof Timestamp ? d.toDate() : new Date(d);

        // Prepare simplified data for the AI to "see" patterns without slight noise
        const simplifiedData = expenses.map(e => ({
            day: getDate(e.date).toLocaleDateString('pl-PL', { weekday: 'long' }),
            amount: e.amount,
            category: e.merchant?.category,
            merchant: e.merchant?.name
        })).slice(0, 50); // Limit context window

        return `
Jesteś "Detektywem Finansowym" Savori.
Twoim zadaniem jest znalezienie UKRYTYCH wzorców, których użytkownik nie widzi.

OSTATNIE 50 TRANSAKCJI:
${JSON.stringify(simplifiedData)}

ZADANIE:
Znajdź 2-3 nieoczywiste korelacje.
NIE PISZ oczywistości typu "Wydajesz pieniądze na jedzenie".
Poszukaj:
- "W każdy piątek zamawiasz to samo..."
- "Twoje wydatki na kawę sumują się do..."
- "Zauważyłem, że po wizycie w X często idziesz do Y..."

Jeśli nie ma nic ciekawego, wymyśl wyzwanie: "Brak wyraźnych złych nawyków, ale spróbuj 'Weekendu bez wydawania'".

Odpowiedz krótko i intrygująco.
`;
    }

    static forecastExpenses(expenses: Expense[]): string {
        const getDate = (d: FirestoreDate): Date => d instanceof Timestamp ? d.toDate() : new Date(d);
        const dailyTotals: Record<string, number> = {};
        expenses.forEach(e => {
            const date = getDate(e.date).toISOString().split('T')[0];
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
    private model: ReturnType<typeof getAIModel>;

    constructor() {
        // Uses Firebase AI Logic (Vertex AI) via centralized helper
        this.model = getAIModel('gemini-2.0-flash');
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

    async ask(question: string, contextData: Record<string, unknown>): Promise<string> {
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

    async forecastExpenses(expenses: Expense[]): Promise<Array<{ date: string; amount: number; reason: string }>> {
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
