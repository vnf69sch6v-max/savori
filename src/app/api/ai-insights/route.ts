import { NextResponse } from 'next/server';
import { generateDashboardInsights } from '@/lib/ai/smart-insights';
import { Expense } from '@/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const expenses: Expense[] = body.expenses;

        if (!expenses || !Array.isArray(expenses)) {
            return NextResponse.json({ error: 'Invalid expenses data' }, { status: 400 });
        }

        const insight = await generateDashboardInsights(expenses);

        return NextResponse.json(insight || { error: 'No insight generated' });
    } catch (error) {
        console.error('Insights API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
