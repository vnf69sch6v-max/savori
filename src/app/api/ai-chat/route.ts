import { NextResponse } from 'next/server';
import { DataAnalysisAgent } from '@/lib/ai/data-analysis-agent';
import { redactor } from '@/lib/security/redactor';

export async function POST(request: Request) {
    try {
        const { question, context } = await request.json();

        // 1. Redact PII from context and question
        const safeContext = redactor.object(context || {});
        const safeQuestion = redactor.text(question);

        // 2. Use Data Analysis Agent
        const agent = new DataAnalysisAgent();
        const answer = await agent.ask(safeQuestion, safeContext);

        return NextResponse.json({ answer });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
