import { geminiFlash } from '@/lib/gemini';
import type { ExpenseCategory } from '@/types';

const VOICE_EXPENSE_PROMPT = `
Jesteś ekspertem AI do parsowania poleceń głosowych dotyczących wydatków w języku polskim.
Użytkownik mówi jak chce dodać wydatek. Twoim zadaniem jest wyciągnąć strukturyzowane dane.

## REGUŁY PARSOWANIA:

### 1. KWOTA (WYMAGANE)
Rozpoznaj różne formaty:
- "50 złotych" → 5000 (grosze)
- "dwadzieścia pięć zł" → 2500
- "15.99" → 1599
- "sto dwadzieścia" → 12000
- "pięć dych" → 5000
- "stówka" → 10000
- "dwa patyski" → 40000 (2 x 200)

### 2. SKLEP/MIEJSCE (opcjonalne)
Rozpoznaj popularne sieci:
- Żabka, Biedronka, Lidl, Auchan, Carrefour, Kaufland
- Orlen, BP, Shell, Circle K
- McDonald's, KFC, Starbucks
- Allegro, Amazon, Empik

### 3. KATEGORIA
Przypisz na podstawie kontekstu:
- groceries: żywność, napoje, chemia, sklep spożywczy
- restaurants: kawa, lunch, jedzenie na mieście, fast-food
- transport: paliwo, uber, taxi, bilet, parking
- utilities: rachunek, prąd, gaz, internet
- entertainment: kino, gry, netflix, spotify
- shopping: ubrania, elektronika, meble
- health: apteka, leki, wizyta lekarska
- education: książki, kursy, szkolenie
- subscriptions: abonament, miesięczna opłata
- other: inne

### 4. DATA (opcjonalne)
- "wczoraj" → data wczorajsza
- "w piątek" → ostatni piątek
- brak wzmianki → dzisiaj

### 5. PRODUKTY (opcjonalne)
Wylistuj wspomniane produkty: "piwo i chipsy" → ["piwo", "chipsy"]

## FORMAT ODPOWIEDZI (TYLKO JSON):

{
  "success": true,
  "data": {
    "amount": number,           // W GROSZACH
    "merchant": string | null,  // Nazwa sklepu lub null
    "category": string,         // Jedna z kategorii powyżej
    "items": string[],          // Lista produktów lub pusta
    "dateOffset": number,       // 0 = dziś, -1 = wczoraj, itd.
    "confidence": number        // 0.0 - 1.0
  }
}

Jeśli nie można rozpoznać kwoty:
{
  "success": false,
  "error": "Nie rozpoznałem kwoty. Powiedz np. 'wydałem 50 złotych'"
}

WAŻNE: Odpowiedz TYLKO poprawnym JSON, bez dodatkowego tekstu.
`;

export interface ParsedVoiceExpense {
    amount: number;            // in cents/grosze
    merchant: string | null;
    category: ExpenseCategory;
    items: string[];
    dateOffset: number;        // 0 = today, -1 = yesterday
    confidence: number;
}

export interface VoiceParseResult {
    success: boolean;
    data?: ParsedVoiceExpense;
    error?: string;
}

/**
 * Parse voice transcript into structured expense data using Gemini
 */
export async function parseVoiceExpense(transcript: string): Promise<VoiceParseResult> {
    if (!transcript || transcript.trim().length < 3) {
        return {
            success: false,
            error: 'Tekst za krótki. Powiedz więcej szczegółów.',
        };
    }

    try {
        console.log('Parsing voice expense:', transcript);

        const result = await geminiFlash.generateContent([
            VOICE_EXPENSE_PROMPT,
            `Transkrypcja użytkownika: "${transcript}"`,
        ]);

        const response = result.response;
        let text = response.text();

        console.log('Gemini raw response:', text);

        // Extract JSON from markdown if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        }

        // Find JSON object
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(text) as VoiceParseResult;

        if (parsed.success && parsed.data) {
            // Validate amount
            if (!parsed.data.amount || parsed.data.amount <= 0) {
                return {
                    success: false,
                    error: 'Nie rozpoznałem kwoty. Spróbuj: "50 złotych w Żabce"',
                };
            }

            // Ensure category is valid
            const validCategories: ExpenseCategory[] = [
                'groceries', 'restaurants', 'transport', 'utilities',
                'entertainment', 'shopping', 'health', 'education',
                'subscriptions', 'other'
            ];
            if (!validCategories.includes(parsed.data.category)) {
                parsed.data.category = 'other';
            }

            console.log('Parsed expense:', parsed.data);
        }

        return parsed;
    } catch (error) {
        console.error('Voice parse error:', error);
        return {
            success: false,
            error: 'Błąd przetwarzania. Spróbuj ponownie.',
        };
    }
}

/**
 * Calculate actual date from offset
 */
export function getDateFromOffset(offset: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
}

/**
 * Format amount in grosze to PLN string
 */
export function formatAmountFromGrosze(grosze: number): string {
    return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
}
