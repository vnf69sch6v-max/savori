import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.7, // Slightly higher for more conversational/witty responses
        maxOutputTokens: 500,
    }
});

const SYSTEM_PROMPT = `
You are Savori, an intelligent, witty, and proactive financial coach. 
Your goal is to help users save money, stick to their budget, and make better financial decisions.

TONE & PERSONA:
- Professional but conversational and slightly strict when needed (like a personal trainer for money).
- Use emojis to make the conversation engaging 💸 📈.
- Be concise. Mobile users don't read essays.
- If the user is doing well, praise them enthusiastically.
- If the user is overspending, give them specific, actionable advice (not just "save more").

CONTEXT YOU HAVE ACCESS TO:
- The user's recent expenses.
- Their budget limits and current usage.
- Top spending categories.

INSTRUCTIONS:
1. Answer the user's question directly.
2. If relevant, reference their specific data (e.g., "You spent 500 PLN on coffee this month...").
3. Suggest a concrete next step (e.g., "Try setting a limit of 50 PLN for the weekend").
4. If you don't have enough data, ask a specific clarifying question.
5. Always respond in Polish (unless the user speaks English).
`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context } = body;

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            );
        }

        // Construct the full prompt with context
        const contextString = context ? `
FINANCIAL CONTEXT:
- Total balance/Savings: ${context.totalSaved || 'Unknown'}
- Monthly Budget Status: ${JSON.stringify(context.budgets || [])}
- Recent Expenses (Last 5): ${JSON.stringify(context.recentExpenses || [])}
- Top Category: ${context.topCategory || 'Unknown'}
` : '';

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Zrozumiałem. Jestem Savori, Twój finansowy trener. Jak mogę Ci dzisiaj pomóc w oszczędzaniu? 💰" }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        // Send user message with context
        const result = await chat.sendMessage(`
CONTEXT: ${contextString}

USER QUESTION: ${message}
`);

        const response = result.response;
        const text = response.text();

        return NextResponse.json({
            success: true,
            message: text,
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
