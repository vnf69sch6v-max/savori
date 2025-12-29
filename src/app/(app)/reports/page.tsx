'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    TrendingUp,
    TrendingDown,
    Target,
    Trophy,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Share2,
    Sparkles,
    Loader2,
    PiggyBank,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget, SavingGoal } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { UserProgress, ACHIEVEMENTS } from '@/lib/gamification';

interface MonthlyStats {
    totalSpent: number;
    expenseCount: number;
    avgDaily: number;
    topCategory: { name: string; amount: number } | null;
    topMerchant: { name: string; amount: number; count: number } | null;
    previousMonthSpent: number;
    categories: { name: string; amount: number; percent: number }[];
    goalsProgress: { name: string; current: number; target: number; added: number }[];
    newAchievements: string[];
    streak: number;
    points: number;
    level: number;
}

export default function ReportsPage() {
    const { userData } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [stats, setStats] = useState<MonthlyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [loadingAI, setLoadingAI] = useState(false);

    const monthKey = format(currentMonth, 'yyyy-MM');
    const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: pl });

    // Fetch monthly data
    useEffect(() => {
        if (!userData?.id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);

            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const prevMonthStart = startOfMonth(subMonths(currentMonth, 1));
            const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));

            // Fetch expenses
            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            const expensesSnap = await getDocs(query(expensesRef, orderBy('date', 'desc')));
            const allExpenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];

            // Filter by month
            const monthExpenses = allExpenses.filter(e => {
                const date = e.date?.toDate?.();
                return date && date >= monthStart && date <= monthEnd;
            });

            const prevMonthExpenses = allExpenses.filter(e => {
                const date = e.date?.toDate?.();
                return date && date >= prevMonthStart && date <= prevMonthEnd;
            });

            // Calculate stats
            const totalSpent = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const previousMonthSpent = prevMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const daysInMonth = monthEnd.getDate();
            const avgDaily = totalSpent / daysInMonth;

            // Categories
            const categoryTotals: Record<string, number> = {};
            monthExpenses.forEach(e => {
                const cat = e.merchant?.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
            });

            const categories = Object.entries(categoryTotals)
                .map(([name, amount]) => ({
                    name,
                    amount,
                    percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                }))
                .sort((a, b) => b.amount - a.amount);

            const topCategory = categories[0] || null;

            // Top merchant
            const merchantTotals: Record<string, { amount: number; count: number }> = {};
            monthExpenses.forEach(e => {
                const name = e.merchant?.name || 'Nieznany';
                if (!merchantTotals[name]) merchantTotals[name] = { amount: 0, count: 0 };
                merchantTotals[name].amount += e.amount || 0;
                merchantTotals[name].count++;
            });

            const topMerchant = Object.entries(merchantTotals)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.amount - a.amount)[0] || null;

            // Goals progress
            const goalsRef = collection(db, 'users', userData.id, 'goals');
            const goalsSnap = await getDocs(goalsRef);
            const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SavingGoal[];

            const goalsProgress = goals
                .filter(g => g.status === 'active')
                .map(g => ({
                    name: g.name,
                    current: g.currentAmount,
                    target: g.targetAmount,
                    added: 0, // Would need contribution tracking
                }));

            // Gamification progress
            const progressRef = doc(db, 'users', userData.id, 'gamification', 'progress');
            const progressSnap = await getDoc(progressRef);
            const progress = progressSnap.exists() ? progressSnap.data() as UserProgress : null;

            setStats({
                totalSpent,
                expenseCount: monthExpenses.length,
                avgDaily,
                topCategory: topCategory ? { name: topCategory.name, amount: topCategory.amount } : null,
                topMerchant,
                previousMonthSpent,
                categories: categories.slice(0, 5),
                goalsProgress,
                newAchievements: progress?.unlockedAchievements || [],
                streak: progress?.streak || 0,
                points: progress?.points || 0,
                level: progress?.level || 1,
            });

            setLoading(false);

            // Fetch AI summary
            generateAISummary();
        };

        fetchData();
    }, [userData?.id, currentMonth]);

    const generateAISummary = async () => {
        if (!stats) return;

        setLoadingAI(true);
        try {
            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chart_commentary',
                    data: {
                        chartType: 'monthly_report',
                        currentData: {
                            month: monthLabel,
                            total: stats.totalSpent / 100,
                            avgDaily: stats.avgDaily / 100,
                            topCategory: stats.topCategory?.name,
                            change: stats.previousMonthSpent > 0
                                ? (((stats.totalSpent - stats.previousMonthSpent) / stats.previousMonthSpent) * 100).toFixed(0)
                                : 0,
                        },
                    },
                }),
            });

            const result = await response.json();
            if (result.success && result.data) {
                setAiSummary(typeof result.data === 'string' ? result.data : 'Świetny miesiąc dla Twoich finansów!');
            }
        } catch (error) {
            console.error('AI Summary error:', error);
        } finally {
            setLoadingAI(false);
        }
    };

    const changeMonth = (direction: number) => {
        setCurrentMonth(prev => direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    const changePercent = stats && stats.previousMonthSpent > 0
        ? ((stats.totalSpent - stats.previousMonthSpent) / stats.previousMonthSpent) * 100
        : 0;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Raport miesięczny</h1>
                        <p className="text-slate-400">Podsumowanie Twoich finansów</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Udostępnij
                    </Button>
                </div>
            </div>

            {/* Month selector */}
            <div className="flex items-center justify-center gap-4 mb-6">
                <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium capitalize">{monthLabel}</span>
                </div>
                <button
                    onClick={() => changeMonth(1)}
                    disabled={format(currentMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            ) : stats ? (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                            <p className="text-2xl font-bold text-rose-400">{formatMoney(stats.totalSpent)}</p>
                            <p className="text-xs text-slate-400">Wydatki</p>
                            {changePercent !== 0 && (
                                <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${changePercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {changePercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(changePercent).toFixed(0)}%
                                </div>
                            )}
                        </Card>

                        <Card className="p-4 text-center">
                            <p className="text-2xl font-bold">{stats.expenseCount}</p>
                            <p className="text-xs text-slate-400">Transakcji</p>
                        </Card>

                        <Card className="p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400">{stats.streak} 🔥</p>
                            <p className="text-xs text-slate-400">Streak</p>
                        </Card>

                        <Card className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-400">Lv.{stats.level}</p>
                            <p className="text-xs text-slate-400">{stats.points.toLocaleString()} pkt</p>
                        </Card>
                    </div>

                    {/* AI Summary */}
                    <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-indigo-400 font-medium mb-1">AI Podsumowanie</p>
                                    {loadingAI ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-slate-400">Generowanie...</span>
                                        </div>
                                    ) : (
                                        <p className="text-slate-300">{aiSummary || `W ${monthLabel} wydałeś ${formatMoney(stats.totalSpent)} w ${stats.expenseCount} transakcjach.`}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kategorie wydatków</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {stats.categories.map((cat, i) => (
                                <div key={cat.name} className="flex items-center gap-3">
                                    <span className="text-xl">{CATEGORY_ICONS[cat.name] || '📦'}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm">{CATEGORY_LABELS[cat.name] || cat.name}</span>
                                            <span className="text-sm text-slate-400">{formatMoney(cat.amount)}</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.percent}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 w-12 text-right">{cat.percent.toFixed(0)}%</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Top merchant */}
                    {stats.topMerchant && (
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Najczęściej odwiedzany</p>
                                    <p className="font-medium">{stats.topMerchant.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{formatMoney(stats.topMerchant.amount)}</p>
                                    <p className="text-xs text-slate-400">{stats.topMerchant.count} wizyt</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Goals */}
                    {stats.goalsProgress.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-emerald-400" />
                                    Postęp celów
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {stats.goalsProgress.map((goal) => {
                                    const progress = (goal.current / goal.target) * 100;
                                    return (
                                        <div key={goal.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm">{goal.name}</span>
                                                <span className="text-xs text-slate-400">
                                                    {formatMoney(goal.current)} / {formatMoney(goal.target)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Achievements unlocked */}
                    {stats.newAchievements.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    Odblokowane osiągnięcia
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {stats.newAchievements.slice(0, 6).map((achievementId) => {
                                        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
                                        if (!achievement) return null;
                                        return (
                                            <div
                                                key={achievementId}
                                                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                                            >
                                                <span className="text-xl">{achievement.icon}</span>
                                                <span className="text-sm">{achievement.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Brak danych dla tego miesiąca</p>
                </Card>
            )}
        </div>
    );
}
