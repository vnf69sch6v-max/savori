import { NextResponse } from 'next/server';
import { generateDashboardInsights } from '@/lib/ai/smart-insights';
import { Expense } from '@/types';
import { redactor } from '@/lib/security/redactor';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawExpenses: Expense[] = body.expenses;

        if (!rawExpenses || !Array.isArray(rawExpenses)) {
            return NextResponse.json({ error: 'Invalid expenses data' }, { status: 400 });
        }

        // Redact PII from expenses
        const expenses = redactor.object(rawExpenses);

        const insight = await generateDashboardInsights(expenses);

        return NextResponse.json(insight || { error: 'No insight generated' });
    } catch (error) {
        console.error('Insights API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
