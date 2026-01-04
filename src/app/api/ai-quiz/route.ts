import { NextResponse } from 'next/server';
import { generateFinanceQuiz } from '@/lib/ai/quiz-generator';
import { checkSubscription, unauthorizedResponse } from '@/lib/api/subscription-guard';

export async function GET(req: Request) {
    try {
        // Get userId from query params for GET request
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // SERVER-SIDE SUBSCRIPTION CHECK - Critical for cost control
        const subscriptionCheck = await checkSubscription(userId || undefined, 'pro');
        if (!subscriptionCheck.isValid) {
            return unauthorizedResponse(subscriptionCheck.error || 'Pro subscription required');
        }

        const quiz = await generateFinanceQuiz();
        return NextResponse.json(quiz);
    } catch (error) {
        console.error('Quiz API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
