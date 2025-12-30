'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coachService, ChatMessage, CoachContext } from '@/lib/ai/coach/coach-service';
import { subscriptionService } from '@/lib/subscription-service';
import { toast } from 'react-hot-toast';
import { Expense, CategoryBudget } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AICoachChat() {
    const { userData, user } = useAuth();
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Cześć! Jestem Savori, Twój finansowy trener. Pomogę Ci zadbać o budżet. O co chcesz zapytać? 💰',
            createdAt: Date.now(),
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Fetch data for context
    useEffect(() => {
        if (!user) return;

        // 1. Fetch recent expenses
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(20)
        );

        const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as unknown as Expense[];
            setExpenses(data);
        });

        // 2. Fetch budgets
        const budgetsQuery = query(
            collection(db, 'budgets'),
            where('userId', '==', user.uid)
        );

        const unsubBudgets = onSnapshot(budgetsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as unknown as CategoryBudget[];
            setBudgets(data);
        });

        return () => {
            unsubExpenses();
            unsubBudgets();
        };
    }, [user]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            createdAt: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        // Prepare context
        const context: CoachContext = {
            totalSaved: userData?.stats?.totalSaved || 0,
            budgets: budgets,
            recentExpenses: expenses.slice(0, 10), // Last 10 expenses
            topCategory: expenses.length > 0 ? expenses[0].merchant?.category : undefined, // Very simplified top category logic for now
        };

        try {
            const responseText = await coachService.sendMessage(text, context);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                createdAt: Date.now(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Przepraszam, mam małą czkawkę techniczną. Spróbuj ponownie później! 🤖⚠️',
                createdAt: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Jak mi idzie w tym miesiącu?",
        "Na czym mogę zaoszczędzić?",
        "Czy stać mnie na kawę?",
        "Ustal limit na jedzenie",
    ];

    const handleOpen = () => {
        if (!subscriptionService.hasFeature(userData?.subscription, 'aiInsights')) {
            toast.error('AI Coach dostępny jest w planie PRO 💎');
            router.push('/settings');
            return;
        }
        setIsOpen(true);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full shadow-lg flex items-center justify-center z-40 text-white"
            >
                <Bot className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900" />
            </motion.button>

            {/* Chat Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="fixed bottom-4 right-4 md:bottom-24 md:right-8 w-[95vw] md:w-[400px] h-[600px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">Trener Savori</h3>
                                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Online
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className="text-[10px] opacity-50 mt-1 text-right">
                                                {format(msg.createdAt, 'HH:mm', { locale: pl })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                            <span className="text-xs text-slate-400">Piszę...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur">
                                {/* Suggestions */}
                                {messages.length < 3 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleSend(s)}
                                                className="whitespace-nowrap px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Zapytaj o finanse..."
                                        className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 text-white placeholder:text-slate-500"
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || loading}
                                        className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
