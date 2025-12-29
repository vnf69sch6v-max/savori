import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { image, mimeType } = await request.json();

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Brak obrazu' },
                { status: 400 }
            );
        }

        const result = await extractReceiptData(image, mimeType || 'image/jpeg');

        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
