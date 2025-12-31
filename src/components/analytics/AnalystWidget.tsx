'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, Loader2, TrendingUp, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Expense } from '@/types';

interface AnalystWidgetProps {
    expenses: Expense[];
    onRequestForecast: () => void;
}

export default function AnalystWidget({ expenses, onRequestForecast }: AnalystWidgetProps) {
    const { userData } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([
        { role: 'agent', content: 'Cześć! Jestem Twoim osobistym analitykiem finansowym. Zapytaj mnie o swoje wydatki, trendy lub porady!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const contextData = {
                userName: userData?.displayName || 'User',
                totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / 100, // Convert grosze to złoty
                expenseCount: expenses.length,
                expensesSummary: expenses.slice(0, 10).map(e => ({
                    date: e.date?.toDate?.()?.toISOString().split('T')[0],
                    merchant: e.merchant?.name,
                    amount: (e.amount || 0) / 100, // Convert grosze to złoty
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
        <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-indigo-950/70 to-slate-950/90 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl" />

            {/* Content */}
            <div className="relative z-10">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center gap-3">
                        {/* Animated Bot Avatar */}
                        <div className="relative">
                            <motion.div
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                                animate={{
                                    boxShadow: [
                                        '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                                        '0 10px 25px -3px rgba(139, 92, 246, 0.5)',
                                        '0 10px 15px -3px rgba(139, 92, 246, 0.3)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                            </motion.div>
                            <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </div>
                        <div>
                            <span className="text-lg font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                                Savori Analyst AI
                            </span>
                            <p className="text-xs text-slate-400 font-normal">Twój inteligentny asystent finansowy</p>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Messages Area */}
                    <div className="h-[280px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'agent'
                                        ? 'bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300 border border-violet-500/20'
                                        : 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/20'
                                        }`}>
                                        {msg.role === 'agent' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-2xl p-3 max-w-[85%] text-sm shadow-lg backdrop-blur-sm ${msg.role === 'agent'
                                        ? 'bg-white/5 text-slate-200 rounded-tl-sm border border-white/5'
                                        : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-indigo-500/20'
                                        }`}>
                                        <p className="leading-relaxed">{msg.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing Indicator */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300 border border-violet-500/20 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 border border-white/5 flex items-center gap-1">
                                        <motion.span
                                            className="w-2 h-2 bg-violet-400 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-violet-400 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-violet-400 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Forecast Button */}
                    <div className="px-4 pb-2">
                        <motion.button
                            onClick={onRequestForecast}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium flex items-center justify-center gap-2 hover:from-violet-600/30 hover:to-indigo-600/30 transition-all"
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span>Pokaż Prognozę AI</span>
                            <Zap className="w-3 h-3 text-yellow-400" />
                        </motion.button>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Zapytaj o swoje wydatki..."
                            className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-500 focus:ring-violet-500/50 focus:border-violet-500/50 rounded-xl"
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white w-11 h-11 p-0 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </motion.div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
