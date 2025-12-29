'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2, Lightbulb, AlertTriangle, TrendingUp, Trophy, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget, SavingGoal } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AIInsight {
    id: string;
    type: 'tip' | 'warning' | 'achievement' | 'trend' | 'recommendation';
    icon: string;
    title: string;
    description: string;
    priority: number;
}

const typeStyles = {
    tip: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    achievement: 'border-emerald-500/30 bg-emerald-500/5',
    trend: 'border-purple-500/30 bg-purple-500/5',
    recommendation: 'border-cyan-500/30 bg-cyan-500/5',
};

const typeIcons = {
    tip: Lightbulb,
    warning: AlertTriangle,
    achievement: Trophy,
    trend: TrendingUp,
    recommendation: Target,
};

export default function AIInsightsWidget() {
    const { userData } = useAuth();
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInsights = async () => {
        if (!userData?.id) return;

        try {
            setRefreshing(true);

            // Fetch user data for analysis
            const now = new Date();
            const thisMonthStart = startOfMonth(now);
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));

            // Get expenses
            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            const expensesSnap = await getDocs(query(expensesRef, orderBy('date', 'desc'), limit(100)));
            const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];

            // Calculate stats
            const thisMonthExpenses = expenses.filter(e => {
                const date = e.date?.toDate?.();
                return date && date >= thisMonthStart;
            });
            const lastMonthExpenses = expenses.filter(e => {
                const date = e.date?.toDate?.();
                return date && date >= lastMonthStart && date <= lastMonthEnd;
            });

            const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            // Category totals
            const categoryTotals: Record<string, number> = {};
            thisMonthExpenses.forEach(e => {
                const cat = e.merchant?.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
            });

            // Top merchants
            const merchantMap: Record<string, { total: number; count: number }> = {};
            thisMonthExpenses.forEach(e => {
                const name = e.merchant?.name || 'Nieznany';
                if (!merchantMap[name]) merchantMap[name] = { total: 0, count: 0 };
                merchantMap[name].total += e.amount;
                merchantMap[name].count++;
            });
            const topMerchants = Object.entries(merchantMap)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Get budget
            const budgetsRef = collection(db, 'users', userData.id, 'budgets');
            const budgetSnap = await getDocs(budgetsRef);
            const budgets = budgetSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Budget[];
            const currentBudget = budgets.find(b => b.month === format(now, 'yyyy-MM'));

            // Get goals
            const goalsRef = collection(db, 'users', userData.id, 'goals');
            const goalsSnap = await getDocs(goalsRef);
            const goals = goalsSnap.docs
                .map(d => ({ id: d.id, ...d.data() })) as SavingGoal[];
            const activeGoals = goals.filter(g => g.status === 'active');

            // Prepare data for AI
            const analysisData = {
                thisMonthTotal,
                lastMonthTotal,
                categoryTotals,
                topMerchants,
                budgetUtilization: currentBudget ? (thisMonthTotal / currentBudget.totalLimit) * 100 : null,
                budgetTotal: currentBudget?.totalLimit || null,
                goals: activeGoals.map(g => ({
                    name: g.name,
                    progress: Math.round((g.currentAmount / g.targetAmount) * 100),
                    remaining: (g.targetAmount - g.currentAmount) / 100,
                })),
                daysLeft: Math.ceil((endOfMonth(now).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                userName: userData.displayName || 'Użytkowniku',
            };

            // Call AI API
            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'dashboard_insights',
                    data: analysisData,
                }),
            });

            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                const insightsWithIds = result.data.map((insight: Omit<AIInsight, 'id'>, i: number) => ({
                    ...insight,
                    id: `insight_${Date.now()}_${i}`,
                }));
                setInsights(insightsWithIds);
            } else {
                // Fallback insights
                setInsights([
                    {
                        id: 'fallback_1',
                        type: 'trend',
                        icon: '📊',
                        title: 'Podsumowanie',
                        description: `W tym miesiącu wydałeś ${(thisMonthTotal / 100).toFixed(2)} zł w ${thisMonthExpenses.length} transakcjach.`,
                        priority: 3,
                    },
                ]);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
            setInsights([
                {
                    id: 'error',
                    type: 'tip',
                    icon: '💡',
                    title: 'Wskazówka',
                    description: 'Dodaj więcej wydatków, aby otrzymać spersonalizowane porady AI.',
                    priority: 1,
                },
            ]);
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
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">AI Insights</CardTitle>
                        <p className="text-xs text-slate-500">Powered by Gemini</p>
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
            <CardContent className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {insights
                        .sort((a, b) => b.priority - a.priority)
                        .map((insight, index) => {
                            const IconComponent = typeIcons[insight.type] || Lightbulb;

                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border ${typeStyles[insight.type]} transition-all hover:scale-[1.02]`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                                        <div>
                                            <h4 className="font-medium text-sm">{insight.title}</h4>
                                            <p className="text-sm text-slate-400 mt-0.5">{insight.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                </AnimatePresence>

                {insights.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Dodaj wydatki, aby otrzymać AI insights</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
