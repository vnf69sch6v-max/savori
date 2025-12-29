import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PDF_EXTRACTION_PROMPT = `
Analizujesz wyciąg bankowy lub historię transakcji z polskiego banku.

Znajdź WSZYSTKIE transakcje wydatkowe (ujemne kwoty / obciążenia) i zwróć je jako JSON array.

Dla każdej transakcji zwróć:
- date: data w formacie YYYY-MM-DD
- description: opis transakcji / nazwa odbiorcy
- amount: kwota jako liczba (dodatnia, w złotych, np. 45.99)

IGNORUJ:
- Wpływy / uznania / przelewy przychodzące
- Salda
- Nagłówki

Zwróć TYLKO JSON w formacie:
{
  "transactions": [
    { "date": "2024-12-15", "description": "BIEDRONKA WARSZAWA", "amount": 156.78 },
    { "date": "2024-12-14", "description": "SPOTIFY", "amount": 29.99 }
  ]
}

Jeśli nie znajdziesz transakcji, zwróć: { "transactions": [] }
`;

export async function POST(request: NextRequest) {
    try {
        const { pdf } = await request.json();

        if (!pdf) {
            return NextResponse.json({ error: 'No PDF provided' }, { status: 400 });
        }

        // Use Gemini 2.0 Flash for PDF analysis
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.1,
            }
        });

        const result = await model.generateContent([
            PDF_EXTRACTION_PROMPT,
            {
                inlineData: {
                    data: pdf,
                    mimeType: 'application/pdf',
                },
            },
        ]);

        const response = result.response;
        let text = response.text();

        console.log('Gemini PDF response:', text.substring(0, 500));

        // Extract JSON from response
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        }

        // Find JSON object
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(text);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
            { error: 'Failed to parse PDF', transactions: [] },
            { status: 500 }
        );
    }
}
