import { NextResponse } from 'next/server';
import { generateFinanceQuiz } from '@/lib/ai/quiz-generator';

export async function GET() {
    try {
        const quiz = await generateFinanceQuiz();
        return NextResponse.json(quiz);
    } catch (error) {
        console.error('Quiz API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
