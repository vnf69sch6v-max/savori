import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, Budget, SavingGoal } from '@/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { pl } from 'date-fns/locale';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIInsight {
    id: string;
    type: 'tip' | 'warning' | 'achievement' | 'trend' | 'recommendation';
    icon: string;
    title: string;
    description: string;
    priority: number; // 1-5, higher = more important
}

export interface InsightContext {
    expenses: Expense[];
    budgets: Budget[];
    goals: SavingGoal[];
    userName: string;
    currentDate: Date;
}

/**
 * Generate AI insights based on user's financial data
 */
export async function generateInsights(context: InsightContext): Promise<AIInsight[]> {
    const { expenses, budgets, goals, userName } = context;

    // Calculate statistics for the prompt
    const thisMonth = new Date();
    const monthStart = startOfMonth(thisMonth);
    const monthEnd = endOfMonth(thisMonth);

    const thisMonthExpenses = expenses.filter(e => {
        const date = e.date?.toDate?.() || new Date();
        return date >= monthStart && date <= monthEnd;
    });

    const lastMonthStart = startOfMonth(subDays(monthStart, 1));
    const lastMonthEnd = endOfMonth(subDays(monthStart, 1));
    const lastMonthExpenses = expenses.filter(e => {
        const date = e.date?.toDate?.() || new Date();
        return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
        const cat = e.merchant?.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    // Top merchants
    const merchantTotals: Record<string, { total: number; count: number }> = {};
    thisMonthExpenses.forEach(e => {
        const name = e.merchant?.name || 'Nieznany';
        if (!merchantTotals[name]) merchantTotals[name] = { total: 0, count: 0 };
        merchantTotals[name].total += e.amount;
        merchantTotals[name].count++;
    });

    // Budget utilization
    const activeBudget = budgets.find(b => b.month === format(thisMonth, 'yyyy-MM'));
    const budgetUtilization = activeBudget
        ? ((thisMonthTotal / activeBudget.totalLimit) * 100).toFixed(0)
        : null;

    // Goals progress
    const activeGoals = goals.filter(g => g.status === 'active');
    const goalsProgress = activeGoals.map(g => ({
        name: g.name,
        progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(0),
        remaining: (g.targetAmount - g.currentAmount) / 100,
    }));

    // Build prompt
    const prompt = `
Jesteś asystentem finansowym Savori. Wygeneruj 3-4 krótkie, spersonalizowane insighty dla użytkownika ${userName}.

DANE:
- Ten miesiąc: ${(thisMonthTotal / 100).toFixed(2)} zł (${thisMonthExpenses.length} transakcji)
- Poprzedni miesiąc: ${(lastMonthTotal / 100).toFixed(2)} zł
- Zmiana: ${lastMonthTotal > 0 ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(0) : 0}%

Wydatki per kategoria (ten miesiąc):
${Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat, amount]) => `- ${cat}: ${(amount / 100).toFixed(2)} zł`)
            .join('\n')}

Top sklepy:
${Object.entries(merchantTotals)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 3)
            .map(([name, data]) => `- ${name}: ${(data.total / 100).toFixed(2)} zł (${data.count}x)`)
            .join('\n')}

${activeBudget ? `Budżet: wykorzystano ${budgetUtilization}% z ${(activeBudget.totalLimit / 100).toFixed(2)} zł` : 'Brak ustawionego budżetu'}

Cele:
${goalsProgress.length > 0
            ? goalsProgress.map(g => `- ${g.name}: ${g.progress}% (brakuje ${g.remaining} zł)`).join('\n')
            : 'Brak aktywnych celów'}

Dziś jest ${format(new Date(), 'd MMMM yyyy', { locale: pl })}, zostało ${Math.ceil((monthEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dni do końca miesiąca.

ZASADY:
1. Bądź konkretny (podawaj liczby, procenty)
2. Dawaj praktyczne porady
3. Chwal za sukcesy, ale delikatnie ostrzegaj przed problemami
4. Każdy insight max 2 zdania
5. Używaj emoji na początku

Odpowiedz w formacie JSON:
[
  {
    "type": "tip|warning|achievement|trend|recommendation",
    "icon": "emoji",
    "title": "Krótki tytuł",
    "description": "Opis 1-2 zdania",
    "priority": 1-5
  }
]

Tylko JSON, bez dodatkowego tekstu.
`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('No JSON found in AI response');
            return getDefaultInsights(context);
        }

        const insights = JSON.parse(jsonMatch[0]) as Omit<AIInsight, 'id'>[];

        return insights.map((insight, i) => ({
            ...insight,
            id: `insight_${Date.now()}_${i}`,
        }));
    } catch (error) {
        console.error('AI Insights error:', error);
        return getDefaultInsights(context);
    }
}

/**
 * Fallback insights when AI fails
 */
function getDefaultInsights(context: InsightContext): AIInsight[] {
    const { expenses, budgets } = context;
    const insights: AIInsight[] = [];

    const thisMonth = new Date();
    const monthStart = startOfMonth(thisMonth);
    const thisMonthExpenses = expenses.filter(e => {
        const date = e.date?.toDate?.() || new Date();
        return date >= monthStart;
    });
    const total = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Basic spending insight
    insights.push({
        id: 'default_1',
        type: 'trend',
        icon: '📊',
        title: 'Podsumowanie miesiąca',
        description: `W tym miesiącu wydałeś ${(total / 100).toFixed(2)} zł w ${thisMonthExpenses.length} transakcjach.`,
        priority: 3,
    });

    // Budget insight
    const activeBudget = budgets.find(b => b.month === format(thisMonth, 'yyyy-MM'));
    if (activeBudget) {
        const utilization = (total / activeBudget.totalLimit) * 100;
        insights.push({
            id: 'default_2',
            type: utilization > 90 ? 'warning' : 'tip',
            icon: utilization > 90 ? '⚠️' : '💰',
            title: 'Status budżetu',
            description: `Wykorzystałeś ${utilization.toFixed(0)}% budżetu (${(total / 100).toFixed(2)} z ${(activeBudget.totalLimit / 100).toFixed(2)} zł).`,
            priority: utilization > 90 ? 5 : 2,
        });
    }

    return insights;
}

/**
 * Generate expense analysis after adding an expense
 */
export async function analyzeExpense(
    expense: Expense,
    recentExpenses: Expense[],
    budget: Budget | null
): Promise<string> {
    const merchantName = expense.merchant?.name || 'sklep';
    const amount = expense.amount / 100;
    const category = expense.merchant?.category || 'other';

    // Count purchases at same merchant this week
    const weekAgo = subDays(new Date(), 7);
    const sameMerchantThisWeek = recentExpenses.filter(e =>
        e.merchant?.name?.toLowerCase() === merchantName.toLowerCase() &&
        (e.date?.toDate?.() || new Date()) > weekAgo
    ).length + 1; // +1 for current expense

    // Calculate remaining budget
    const thisMonthExpenses = recentExpenses.filter(e => {
        const date = e.date?.toDate?.() || new Date();
        return date >= startOfMonth(new Date());
    });
    const monthlySpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0) + expense.amount;

    const categorySpent = thisMonthExpenses
        .filter(e => e.merchant?.category === category)
        .reduce((sum, e) => sum + e.amount, 0) + expense.amount;

    let analysis = '';

    if (sameMerchantThisWeek > 2) {
        analysis += `📊 To twój ${sameMerchantThisWeek}. zakup w ${merchantName} w tym tygodniu. `;
    }

    if (budget) {
        const remaining = budget.totalLimit - monthlySpent;
        const daysLeft = Math.ceil((endOfMonth(new Date()).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const dailyBudget = remaining / Math.max(1, daysLeft);

        analysis += `💰 Zostało ${(remaining / 100).toFixed(2)} zł z budżetu (~${(dailyBudget / 100).toFixed(0)} zł/dzień). `;

        const categoryBudget = budget.categoryLimits[category];
        if (categoryBudget) {
            const categoryRemaining = categoryBudget.limit - categorySpent;
            if (categoryRemaining < 0) {
                analysis += `⚠️ Przekroczono limit kategorii o ${(Math.abs(categoryRemaining) / 100).toFixed(2)} zł!`;
            }
        }
    }

    return analysis || `✅ Wydatek ${amount.toFixed(2)} zł w ${merchantName} zapisany.`;
}

/**
 * Generate chart commentary for analytics page
 */
export async function generateChartCommentary(
    chartType: 'monthly' | 'category' | 'trend',
    data: Record<string, number>,
    previousData?: Record<string, number>
): Promise<string> {
    const prompt = `
Jesteś analitykiem finansowym. Skomentuj dane wykresu w 1-2 zdaniach po polsku.

Typ wykresu: ${chartType}
Dane: ${JSON.stringify(data)}
${previousData ? `Poprzedni okres: ${JSON.stringify(previousData)}` : ''}

Bądź konkretny, użyj liczb. Daj praktyczną wskazówkę jeśli to możliwe.
Odpowiedz tylko komentarzem, bez formatowania.
`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Chart commentary error:', error);
        return 'Analiza danych w toku...';
    }
}
