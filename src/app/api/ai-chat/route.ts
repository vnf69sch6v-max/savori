import { NextResponse } from 'next/server';
import { askFinancialAssistant } from '@/lib/ai/gemini-assistant';
// We don't have next-auth set up with getServerSession nicely in this project structure usually
// using mock session for now or assuming context passed from client if auth is client-side
// But let's try to mock the context logic for now as we don't have full backend context service ready

export async function POST(request: Request) {
    try {
        const { question, context } = await request.json();

        // If context is provided from client (temporary solution until we have full backend service)
        const safeContext = context || {
            safeToSpend: 150000, // 1500 zł
            monthlySpent: 350000, // 3500 zł
            budgetLimit: 500000, // 5000 zł
            topCategory: 'Jedzenie',
            recentExpenses: [
                { merchant: 'Biedronka', amount: 12550 },
                { merchant: 'Uber', amount: 2500 },
                { merchant: 'Netflix', amount: 4500 }
            ]
        };

        const answer = await askFinancialAssistant(question, safeContext);

        return NextResponse.json({ answer });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
