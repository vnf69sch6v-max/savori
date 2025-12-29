import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Missing type or data' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        let prompt = '';

        switch (type) {
            case 'dashboard_insights':
                prompt = buildDashboardPrompt(data);
                break;
            case 'expense_analysis':
                prompt = buildExpenseAnalysisPrompt(data);
                break;
            case 'chart_commentary':
                prompt = buildChartCommentaryPrompt(data);
                break;
            case 'goal_advice':
                prompt = buildGoalAdvicePrompt(data);
                break;
            default:
                return NextResponse.json(
                    { error: 'Unknown analysis type' },
                    { status: 400 }
                );
        }

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Try to parse as JSON, otherwise return as text
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({ success: true, data: parsed });
            }
        } catch {
            // Not JSON, return as text
        }

        return NextResponse.json({ success: true, data: response.trim() });

    } catch (error) {
        console.error('AI Analyze error:', error);
        return NextResponse.json(
            { error: 'Failed to generate analysis', details: String(error) },
            { status: 500 }
        );
    }
}

function buildDashboardPrompt(data: {
    thisMonthTotal: number;
    lastMonthTotal: number;
    categoryTotals: Record<string, number>;
    topMerchants: { name: string; total: number; count: number }[];
    budgetUtilization: number | null;
    budgetTotal: number | null;
    goals: { name: string; progress: number; remaining: number }[];
    daysLeft: number;
    userName: string;
}): string {
    return `
Jesteś Savori AI - inteligentnym asystentem finansowym. Wygeneruj 3-4 spersonalizowane insighty.

DANE UŻYTKOWNIKA (${data.userName}):
- Wydatki ten miesiąc: ${(data.thisMonthTotal / 100).toFixed(2)} zł
- Wydatki poprzedni miesiąc: ${(data.lastMonthTotal / 100).toFixed(2)} zł
- Zmiana: ${data.lastMonthTotal > 0 ? (((data.thisMonthTotal - data.lastMonthTotal) / data.lastMonthTotal) * 100).toFixed(0) : 0}%
- Dni do końca miesiąca: ${data.daysLeft}

TOP KATEGORIE:
${Object.entries(data.categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat, amount]) => `- ${cat}: ${(amount / 100).toFixed(2)} zł`)
            .join('\n')}

TOP SKLEPY:
${data.topMerchants.slice(0, 3).map(m =>
                `- ${m.name}: ${(m.total / 100).toFixed(2)} zł (${m.count}x)`
            ).join('\n')}

${data.budgetUtilization !== null
            ? `BUDŻET: ${data.budgetUtilization.toFixed(0)}% z ${(data.budgetTotal! / 100).toFixed(2)} zł`
            : 'BRAK BUDŻETU'}

CELE:
${data.goals.length > 0
            ? data.goals.map(g => `- ${g.name}: ${g.progress}% (brakuje ${g.remaining.toFixed(2)} zł)`).join('\n')
            : 'Brak aktywnych celów'}

ZASADY:
1. Każdy insight max 2 zdania, konkretne liczby
2. Typy: tip (porada), warning (ostrzeżenie), achievement (sukces), trend (statystyka), recommendation (rekomendacja)
3. Priorytet 1-5 (5=najważniejsze)
4. Emoji na początku
5. Po polsku, przyjaznym tonem

ODPOWIEDŹ (tylko JSON):
[
  {"type": "tip|warning|achievement|trend|recommendation", "icon": "emoji", "title": "Max 5 słów", "description": "1-2 zdania", "priority": 1-5}
]
`;
}

function buildExpenseAnalysisPrompt(data: {
    expense: { merchant: string; amount: number; category: string };
    sameMerchantThisWeek: number;
    monthlySpent: number;
    budgetRemaining: number | null;
    categorySpent: number;
    categoryLimit: number | null;
}): string {
    return `
Skomentuj wydatek użytkownika w 1-2 zdaniach po polsku.

WYDATEK: ${data.expense.amount.toFixed(2)} zł w ${data.expense.merchant}
- Kategoria: ${data.expense.category}
- Zakupy w tym sklepie ten tydzień: ${data.sameMerchantThisWeek}x
- Wydane ten miesiąc: ${data.monthlySpent.toFixed(2)} zł
${data.budgetRemaining !== null ? `- Pozostało z budżetu: ${data.budgetRemaining.toFixed(2)} zł` : ''}
${data.categoryLimit !== null ? `- Limit kategorii: ${data.categorySpent.toFixed(2)}/${data.categoryLimit.toFixed(2)} zł` : ''}

Dodaj praktyczną obserwację lub poradę. Użyj emoji. Odpowiedz samym tekstem.
`;
}

function buildChartCommentaryPrompt(data: {
    chartType: string;
    currentData: Record<string, number>;
    previousData?: Record<string, number>;
}): string {
    return `
Skomentuj wykres finansowy w 2 zdaniach po polsku.

Typ: ${data.chartType}
Aktualne dane: ${JSON.stringify(data.currentData)}
${data.previousData ? `Poprzedni okres: ${JSON.stringify(data.previousData)}` : ''}

Wskaż najważniejszą obserwację i daj konkretną poradę. Użyj emoji. Odpowiedz samym tekstem.
`;
}

function buildGoalAdvicePrompt(data: {
    goal: { name: string; target: number; current: number; deadline?: string };
    monthlyContribution: number;
    userSpendingPattern: Record<string, number>;
}): string {
    const remaining = data.goal.target - data.goal.current;
    const monthsLeft = data.monthlyContribution > 0
        ? Math.ceil(remaining / data.monthlyContribution)
        : null;

    return `
Jako doradca finansowy, podaj 2-3 konkretne porady jak szybciej osiągnąć cel.

CEL: ${data.goal.name}
- Potrzeba: ${remaining.toFixed(2)} zł
- Obecne tempo: ${data.monthlyContribution.toFixed(2)} zł/mies
${monthsLeft ? `- Szacowany czas: ${monthsLeft} miesięcy` : ''}
${data.goal.deadline ? `- Deadline: ${data.goal.deadline}` : ''}

WYDATKI UŻYTKOWNIKA (miesięcznie):
${Object.entries(data.userSpendingPattern)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat, amount]) => `- ${cat}: ${amount.toFixed(2)} zł`)
            .join('\n')}

Zaproponuj konkretne oszczędności z kwotami. Odpowiedz jako JSON:
{"prediction": "kiedy osiągnie cel", "tips": ["tip1", "tip2", "tip3"]}
`;
}
