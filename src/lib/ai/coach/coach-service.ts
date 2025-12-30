import { Expense, CategoryBudget } from '@/types';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}

export interface CoachContext {
    totalSaved?: number;
    budgets?: CategoryBudget[];
    recentExpenses?: Partial<Expense>[];
    topCategory?: string;
}

class CoachService {
    async sendMessage(message: string, context: CoachContext): Promise<string> {
        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    context: {
                        ...context,
                        // Simplify expenses to reduce token usage
                        recentExpenses: context.recentExpenses?.map(e => ({
                            amount: e.amount,
                            category: e.merchant?.category,
                            merchantName: e.merchant?.name,
                            date: e.date,
                        })),
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            return data.message;
        } catch (error) {
            console.error('Coach Service Error:', error);
            throw error;
        }
    }
}

export const coachService = new CoachService();
