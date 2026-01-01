'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget, ExpenseCategory, CategoryBudget } from '@/types';
import { insightsEngine, AIInsight } from '@/lib/ai/insights-engine';
import InsightCard from './ai/InsightCard';

export default function AIInsightsWidget() {
    const { userData } = useAuth();
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInsights = async () => {
        if (!userData?.id) return;

        try {
            setRefreshing(true);

            // Fetch recent expenses
            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            const expensesSnap = await getDocs(query(expensesRef, orderBy('date', 'desc'), limit(50)));
            const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];

            // Fetch budgets
            const budgetsRef = collection(db, 'users', userData.id, 'budgets');
            const budgetSnap = await getDocs(budgetsRef);
            const budgets = budgetSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Budget[];

            // Transform budgets for engine
            const currentMonth = new Date().toISOString().slice(0, 7);
            const currentBudget = budgets.find(b => b.month === currentMonth);

            const engineBudgets = currentBudget?.categoryLimits
                ? Object.entries(currentBudget.categoryLimits).map(([cat, data]: [string, CategoryBudget]) => ({
                    category: cat as ExpenseCategory,
                    limit: data.limit,
                    spent: data.spent || 0
                }))
                : [];

            // Generate insights locally
            const generatedInsights = insightsEngine.analyzeDashboard(expenses, engineBudgets);
            setInsights(generatedInsights);
            setLoading(false); // Show local insights immediately

            // Fetch AI insight in background
            if (expenses.length >= 3) {
                // Prepare expenses safe for JSON (remove timestamps or conversion issues)
                const safeExpenses = expenses.slice(0, 15).map(e => ({
                    ...e,
                    date: null, // We don't need date for this specific analysis
                    createdAt: null
                }));

                fetch('/api/ai-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expenses: safeExpenses })
                })
                    .then(res => res.json())
                    .then(aiData => {
                        if (aiData && aiData.title) {
                            const aiInsight: AIInsight = {
                                id: `ai_${Date.now()}`,
                                userId: userData.id,
                                type: (aiData.type as any) || 'tip',
                                priority: (aiData.priority as any) || 'high',
                                emoji: '✨',
                                title: aiData.title,
                                message: aiData.message,
                                confidence: 1.0,
                                status: 'new',
                                createdAt: new Date(),
                                ...aiData
                            };
                            setInsights(prev => {
                                // Prevent duplicates if already fetched
                                if (prev.some(i => i.id.startsWith('ai_'))) return prev;
                                return [aiInsight, ...prev];
                            });
                        }
                    })
                    .catch(err => console.error('AI Fetch Error:', err))
                    .finally(() => setRefreshing(false));
            } else {
                setRefreshing(false);
            }

        } catch (error) {
            console.error('Error generating insights:', error);
            // Fallback empty if initial fetch failed
            if (insights.length === 0) setInsights([]);
            setRefreshing(false);
        } finally {
            // Loading is handled inside for smoother UX
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [userData?.id]);

    if (loading) {
        return (
            <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                        <span className="ml-3 text-slate-400">AI analizuje Twoje finanse...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/10 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">AI Insights</CardTitle>
                        <p className="text-xs text-slate-400">Analiza w czasie rzeczywistym</p>
                    </div>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={refreshing}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <AnimatePresence mode="popLayout">
                    {insights
                        .sort((a, b) => {
                            const prioOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                            return prioOrder[b.priority] - prioOrder[a.priority];
                        })
                        .map((insight, index) => (
                            <InsightCard
                                key={insight.id}
                                insight={insight}
                                onDismiss={(id) => setInsights(prev => prev.filter(i => i.id !== id))}
                            />
                        ))}
                </AnimatePresence>

                {insights.length === 0 && (
                    <div className="space-y-3">
                        {/* Demo insights for new users */}
                        <div className="text-center mb-4">
                            <p className="text-xs text-purple-400 font-medium">✨ Przykładowe insighty</p>
                        </div>

                        {/* Demo insight 1 */}
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 opacity-60">
                            <div className="flex items-start gap-3">
                                <span className="text-lg">📊</span>
                                <div>
                                    <p className="font-medium text-sm text-slate-300">Trend wydatków</p>
                                    <p className="text-xs text-slate-500">AI wykryje Twoje wzorce wydatków i zasugeruje oszczędności</p>
                                </div>
                            </div>
                        </div>

                        {/* Demo insight 2 */}
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 opacity-60">
                            <div className="flex items-start gap-3">
                                <span className="text-lg">💡</span>
                                <div>
                                    <p className="font-medium text-sm text-slate-300">Inteligentne sugestie</p>
                                    <p className="text-xs text-slate-500">Otrzymasz personalizowane porady finansowe</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-center text-slate-500 pt-2">
                            Dodaj więcej wydatków, aby odblokować AI analizę
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
