'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Bot, User, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Expense } from '@/types';

interface AnalystWidgetProps {
    expenses: Expense[];
    onRequestForecast: () => void;
}

export default function AnalystWidget({ expenses, onRequestForecast }: AnalystWidgetProps) {
    const { userData } = useAuth();
    const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([
        { role: 'agent', content: 'Cześć! Jestem Twoim osobistym analitykiem. Jak mogę Ci pomóc w analizie wydatków?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const contextData = {
                userName: userData?.displayName || 'User',
                totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                expenseCount: expenses.length,
                expensesSummary: expenses.slice(0, 10).map(e => ({ // Limit context
                    date: e.date?.toDate?.()?.toISOString().split('T')[0],
                    merchant: e.merchant?.name,
                    amount: e.amount,
                    category: e.merchant?.category
                }))
            };

            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'agent_chat',
                    data: {
                        question: userMsg,
                        context: contextData
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'agent', content: typeof data.data === 'string' ? data.data : JSON.stringify(data.data) }]);
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: 'Przepraszam, wystąpił błąd podczas analizy.' }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'agent', content: 'Błąd połączenia z serwerem.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border-indigo-500/20 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-indigo-500/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                    Savori Analyst AI
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="h-[300px] overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'agent' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'
                                }`}>
                                {msg.role === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div className={`rounded-2xl p-3 max-w-[80%] text-sm ${msg.role === 'agent'
                                ? 'bg-slate-800 text-slate-200 rounded-tl-sm'
                                : 'bg-indigo-600 text-white rounded-tr-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-slate-800 rounded-2xl p-3 rounded-tl-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 h-8"
                        onClick={onRequestForecast}
                    >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Pokaż Prognozę
                    </Button>
                </div>
                <div className="p-4 bg-slate-900 border-t border-indigo-500/10 flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Zapytaj o swoje wydatki..."
                        className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 p-2"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
