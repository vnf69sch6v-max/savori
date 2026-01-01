import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExpenseCategory } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const AUDIO_EXPENSE_PROMPT = `
Jesteś ekspertem AI do analizy poleceń głosowych dotyczących wydatków w języku polskim.
Przesłuchaj nagranie audio i wyciągnij strukturyzowane dane o wydatku.

## REGUŁY:

### 1. KWOTA (WYMAGANE)
Rozpoznaj różne formaty mówione po polsku:
- "pięćdziesiąt złotych" → 5000 (w groszach)
- "dwadzieścia pięć zł" → 2500
- "piętnaście dziewięćdziesiąt dziewięć" → 1599
- "sto dwadzieścia" → 12000
- "stówka" → 10000

### 2. SKLEP/MIEJSCE (opcjonalne)
Rozpoznaj popularne sieci: Żabka, Biedronka, Lidl, Orlen, McDonald's, itd.

### 3. KATEGORIA
- groceries: żywność, napoje, sklep
- restaurants: kawa, lunch, restauracja
- transport: paliwo, uber, taxi, bilet
- utilities: rachunek, prąd, gaz
- entertainment: kino, gry
- shopping: ubrania, elektronika
- health: apteka, leki
- subscriptions: abonament
- other: inne

### 4. DATA
- "wczoraj" → dateOffset: -1
- brak wzmianki → dateOffset: 0 (dziś)

## FORMAT ODPOWIEDZI (TYLKO JSON):

{
  "success": true,
  "transcript": "dosłowna transkrypcja audio",
  "data": {
    "amount": number,
    "merchant": string | null,
    "category": string,
    "items": string[],
    "dateOffset": number,
    "confidence": number
  }
}

Jeśli audio jest niezrozumiałe lub nie zawiera informacji o wydatku:
{
  "success": false,
  "transcript": "co usłyszałeś (jeśli cokolwiek)",
  "error": "Nie rozpoznałem wydatku. Spróbuj powiedzieć np. 'wydałem 50 złotych w Żabce'"
}
`;

export interface ParsedAudioExpense {
    amount: number;
    merchant: string | null;
    category: ExpenseCategory;
    items: string[];
    dateOffset: number;
    confidence: number;
}

export interface AudioParseResult {
    success: boolean;
    transcript?: string;
    data?: ParsedAudioExpense;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: 'Brak pliku audio' },
                { status: 400 }
            );
        }

        console.log('Received audio file:', audioFile.type, audioFile.size, 'bytes');

        // Convert to base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Determine mime type
        let mimeType = audioFile.type || 'audio/webm';
        // Gemini supports: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
        if (mimeType === 'audio/webm;codecs=opus') {
            mimeType = 'audio/webm';
        }

        console.log('Processing audio with Gemini, mime:', mimeType);

        // Use Gemini 2.0 Flash with audio
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent([
            AUDIO_EXPENSE_PROMPT,
            {
                inlineData: {
                    mimeType,
                    data: base64Audio,
                },
            },
        ]);

        const response = result.response;
        let text = response.text();

        console.log('Gemini audio response:', text.substring(0, 500));

        // Extract JSON
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        }

        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(text) as AudioParseResult;

        // Validate
        if (parsed.success && parsed.data) {
            if (!parsed.data.amount || parsed.data.amount <= 0) {
                return NextResponse.json({
                    success: false,
                    transcript: parsed.transcript,
                    error: 'Nie rozpoznałem kwoty. Spróbuj: "50 złotych w Żabce"',
                });
            }

            const validCategories: ExpenseCategory[] = [
                'groceries', 'restaurants', 'transport', 'utilities',
                'entertainment', 'shopping', 'health', 'education',
                'subscriptions', 'other'
            ];
            if (!validCategories.includes(parsed.data.category)) {
                parsed.data.category = 'other';
            }
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Audio parse error:', error);
        return NextResponse.json(
            { success: false, error: 'Błąd przetwarzania audio' },
            { status: 500 }
        );
    }
}
