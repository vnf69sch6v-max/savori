import { geminiFlash } from '@/lib/gemini';

const QUIZ_GENERATION_PROMPT = `
Wygeneruj pytanie quizowe o finansach osobistych.
Temat: oszczędzanie, budżetowanie, inwestowanie, inflacja, podatki.

Format JSON:
{
    "question": "Pytanie?",
    "answers": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Krótkie wyjaśnienie"
}

Poziom trudności: średni
Pytanie powinno być praktyczne i związane z codziennymi finansami w Polsce.
Zwróć TYLKO czysty JSON, bez markdowna.
`;

export interface QuizQuestion {
    question: string;
    answers: string[];
    correctIndex: number;
    explanation: string;
}

export async function generateFinanceQuiz(): Promise<QuizQuestion> {
    try {
        const result = await geminiFlash.generateContent(QUIZ_GENERATION_PROMPT);
        let text = result.response.text();

        // Clean markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            text = jsonMatch[1].trim();
        }

        // Parse JSON
        return JSON.parse(text) as QuizQuestion;
    } catch (error) {
        console.error('Quiz Generation Error:', error);
        // Fallback quiz
        return {
            question: "Co to jest procent składany?",
            answers: ["Podatek od lokat", "Odsetki od odsetek", "Oprocentowanie kredytu", "Rodzaj inflacji"],
            correctIndex: 1,
            explanation: "Procent składany to mechanizm, w którym odsetki są naliczane nie tylko od kapitału początkowego, ale także od wcześniej naliczonych odsetek."
        };
    }
}
