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
Jesteś Savori AI - prostym w obsłudze asystentem finansowym dla zwykłych ludzi.
Twoim zadaniem jest spojrzeć na finanse użytkownika i powiedzieć mu wprost: czy jest dobrze, czy źle.

SYTUACJA UŻYTKOWNIKA (${data.userName}):
- Wydał w tym miesiącu: ${(data.thisMonthTotal / 100).toFixed(2)} zł
- Zostało mu dni: ${data.daysLeft}
- Stan budżetu: ${data.budgetUtilization !== null ? `${data.budgetUtilization.toFixed(0)}% zużyte` : 'Nieustalony'}
- Najwięcej kasy poszło na: ${Object.entries(data.categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || 'nic'}

TOP SKLEPY (gdzie ucieka kasa):
${data.topMerchants.slice(0, 3).map(m => `- ${m.name}: ${(m.total / 100).toFixed(2)} zł`).join('\n')}

ZADANIE:
Wygeneruj 3 karty ("Insights") dla użytkownika. Pisz prostym językiem, bez "ekonomicznego bełkotu".
1. "Health Check" - ogólna ocena sytuacji (np. "Jesteś na minusie", "Świetnie Ci idzie").
2. "Główny Złodziej" - gdzie ucieka najwięcej pieniędzy (kategoria/sklep).
3. "Action Plan" - jedna prosta rzecz, którą ma zrobić dzisiaj (np. "Nie kupuj kawy na mieście").

FORMAT ODPOWIEDZI (JSON):
[
  {"type": "warning|trend|tip", "icon": "emoji", "title": "Krótki nagłówek (max 4 słowa)", "description": "Proste wyjaśnienie (1 zdanie)", "priority": 1-5}
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
Jesteś osobistym, bezpośrednim trenerem finansowym ("Financial Coach"). Twoim celem jest proste i dosadne uświadamianie użytkownika o jego sytuacji finansowej - "jak krowie na rowie".
Nie używaj żargonu. Pisz krótko, jak w SMSie od znajomego.

KONTEKST:
Użytkownik właśnie wydał: ${data.expense.amount.toFixed(2)} zł w ${data.expense.merchant}
- Kategoria: ${data.expense.category}
- To jego ${data.sameMerchantThisWeek + 1}. wizyta w tym sklepie w tym tygodniu.
- W tym miesiącu wydał łącznie: ${data.monthlySpent.toFixed(2)} zł
${data.budgetRemaining !== null ? `- Do końca miesiąca zostało mu TYLKO: ${data.budgetRemaining.toFixed(2)} zł` : ''}
${data.categoryLimit !== null ? `- Limit kategorii "${data.expense.category}": wydano ${data.categorySpent.toFixed(2)} z ${data.categoryLimit.toFixed(2)} zł` : ''}

ZADANIE:
Napisz 1-2 krótkie, mocne zdania komentarza.
Jeśli jest źle (przekracza budżet, dużo wydaje) -> OPRZE go (np. "Serio? Znowu McDonald? Zostało Ci tylko 100 zł!").
Jeśli jest dobrze (oszczędza, mało wydaje) -> POCHWAL go (np. "Super, tak trzymaj! Portfel Ci podziękuje.").

Użyj emoji. Bądź jak kumpel, który dba o jego kasę. Bez lania wody.
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
