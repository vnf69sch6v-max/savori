import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceExpense } from '@/lib/ai/voice-expense-parser';

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json();

        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Brak transkrypcji' },
                { status: 400 }
            );
        }

        const result = await parseVoiceExpense(transcript);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Parse voice API error:', error);
        return NextResponse.json(
            { success: false, error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
