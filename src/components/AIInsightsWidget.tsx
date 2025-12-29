'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget } from '@/types';
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
                ? Object.entries(currentBudget.categoryLimits).map(([cat, data]: [string, any]) => ({
                    category: cat as any,
                    limit: data.limit,
                    spent: data.spent || 0
                }))
                : [];

            // Generate insights locally
            const generatedInsights = insightsEngine.analyzeDashboard(expenses, engineBudgets);

            setInsights(generatedInsights);

        } catch (error) {
            console.error('Error generating insights:', error);
            // Fallback empty
            setInsights([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
                    <div className="text-center py-6 text-slate-400">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Brak nowych insightów na ten moment.</p>
                        <p className="text-xs text-slate-500 mt-1">Używaj aplikacji regularnie, aby otrzymać więcej analiz.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
