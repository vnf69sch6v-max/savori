import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini client - używać TYLKO po stronie serwera (API Routes, Server Components)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model Flash do szybkiego przetwarzania paragonów
export const geminiFlash = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.1, // Niska temperatura dla dokładności
    },
});

// Prompt systemowy do ekstrakcji danych z paragonów
export const RECEIPT_EXTRACTION_PROMPT = `
Jesteś ekspertem AI ds. ekstrakcji danych z polskich paragonów fiskalnych.
Przeanalizuj załączony obraz paragonu i zwróć dane w formacie JSON.

## REGUŁY EKSTRAKCJI:

### 1. SPRZEDAWCA
- Nazwa: Znajdź na górze paragonu (często logo lub nagłówek)
- NIP: 10 cyfr, może być z kreskami (123-456-78-90) - usuń kreski
- Adres: Pod nazwą firmy

### 2. DATA I CZAS
- Format wyjściowy: YYYY-MM-DDTHH:mm:ss
- Szukaj wzorców: DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD

### 3. POZYCJE (ITEMS)
- Wylistuj WSZYSTKIE produkty
- POMIŃ linie: SUMA, RAZEM, PODATEK, RABAT, RESZTA, GOTÓWKA, KARTA
- Dla każdej pozycji:
  - name: Nazwa produktu (popraw literówki OCR)
  - quantity: Ilość (domyślnie 1)
  - unitPrice: Cena jednostkowa w GROSZACH (np. 4.50 PLN = 450)
  - totalPrice: Cena całkowita w GROSZACH
  - vatRate: Stawka VAT (0, 5, 8, 23) - oznaczona literą (A/B/C/D)

### 4. SUMA
- Znajdź ostateczną kwotę (SUMA PLN, RAZEM, DO ZAPŁATY)
- Zwróć w GROSZACH (45.50 PLN = 4550)

### 5. KATEGORIA
Przypisz jedną z:
- groceries (żywność, napoje, chemia)
- restaurants (restauracje, fast-food, kawiarnie)
- transport (paliwo, bilety, parking)
- utilities (opłaty, rachunki)
- entertainment (kino, gry, hobby)
- shopping (ubrania, elektronika)
- health (apteka, leki)
- education (książki, kursy)
- subscriptions (abonamenty)
- other (inne)

### 6. WALUTA
- Rozpoznaj: zł, PLN, EUR, USD
- Zwróć kod ISO 4217 (PLN, EUR, USD)

## FORMAT ODPOWIEDZI:

{
  "success": true,
  "data": {
    "merchant": {
      "name": "string",
      "nip": "string lub null",
      "address": "string lub null"
    },
    "date": "YYYY-MM-DDTHH:mm:ss",
    "items": [
      {
        "name": "string",
        "quantity": number,
        "unitPrice": number,
        "totalPrice": number,
        "vatRate": number
      }
    ],
    "totalAmount": number,
    "currency": "PLN",
    "category": "string",
    "confidence": number
  }
}

Jeśli obraz jest nieczytelny lub to nie paragon:
{
  "success": false,
  "error": "Opis problemu"
}
`;

export interface ReceiptExtractionResult {
    success: boolean;
    data?: {
        merchant: {
            name: string;
            nip: string | null;
            address: string | null;
        };
        date: string;
        items: Array<{
            name: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            vatRate?: number;
        }>;
        totalAmount: number;
        currency: string;
        category: string;
        confidence: number;
    };
    error?: string;
}

/**
 * Przetwarza zdjęcie paragonu i zwraca ustrukturyzowane dane
 * @param imageBase64 - Obraz w formacie base64 (bez prefixu data:image/...)
 * @param mimeType - Typ MIME obrazu (image/jpeg, image/png, image/webp)
 */
export async function extractReceiptData(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<ReceiptExtractionResult> {
    try {
        console.log('Starting receipt extraction with Gemini 2.0 Flash...');
        console.log('Image base64 length:', imageBase64.length);
        console.log('Mime type:', mimeType);

        const result = await geminiFlash.generateContent([
            RECEIPT_EXTRACTION_PROMPT,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType,
                },
            },
        ]);

        const response = result.response;
        let text = response.text();

        console.log('Raw Gemini response:', text.substring(0, 500));

        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        }

        // Try to find JSON object in response
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        // Parse JSON response
        const parsed = JSON.parse(text) as ReceiptExtractionResult;

        // Walidacja: suma pozycji = totalAmount
        if (parsed.success && parsed.data) {
            const itemsSum = parsed.data.items.reduce((sum, item) => sum + item.totalPrice, 0);
            const diff = Math.abs(itemsSum - parsed.data.totalAmount);

            // Tolerancja 100 groszy (1 PLN) na błędy zaokrągleń
            if (diff > 100) {
                console.warn(`Niezgodność sum: items=${itemsSum}, total=${parsed.data.totalAmount}, diff=${diff}`);
                parsed.data.confidence = Math.max(0, (parsed.data.confidence || 1) - 0.2);
            }

            console.log('Successfully parsed receipt:', parsed.data.merchant.name);
        }

        return parsed;
    } catch (error) {
        console.error('Błąd przetwarzania paragonu:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Nieznany błąd',
        };
    }
}

export default genAI;
