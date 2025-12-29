'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Camera,
    Plus,
    Target,
    Flame,
    PiggyBank,
    Receipt,
    Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense } from '@/types';
import AIInsightsWidget from '@/components/AIInsightsWidget';
import PredictiveSpendingWidget from '@/components/PredictiveSpendingWidget';

// Empty state defaults for new users
const emptyStats = {
    monthlyExpenses: 0,
    monthlySaved: 0,
    streak: 0,
    expenseChange: 0,
    savedChange: 0,
};

interface StatCardProps {
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    color: 'emerald' | 'amber' | 'rose' | 'blue';
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
    const colors = {
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
        rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    };

    const iconColors = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400',
        blue: 'text-blue-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className={`bg-gradient-to-br ${colors[color]} border`}>
                <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-slate-400">{title}</p>
                        <div className={iconColors[color]}>{icon}</div>
                    </div>
                    <p className="text-3xl font-bold mb-2">{value}</p>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{Math.abs(change)}% vs poprzedni miesiąc</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function DashboardPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Dzień dobry';
        if (hour < 18) return 'Cześć';
        return 'Dobry wieczór';
    };

    // Listen for recent expenses
    useEffect(() => {
        if (!userData?.id) {
            setLoading(false);
            return;
        }

        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        const q = query(expensesRef, orderBy('createdAt', 'desc'), limit(5));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Listen for goals
    useEffect(() => {
        if (!userData?.id) return;

        const goalsRef = collection(db, 'users', userData.id, 'goals');
        const q = query(goalsRef, orderBy('createdAt', 'desc'), limit(3));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGoals(data);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Use real data only - no fallback to demo
    const displayExpenses = expenses;
    const userStats = userData?.stats;
    const monthlyExpenses = userStats?.totalExpenses ?? 0;
    const monthlySaved = userStats?.totalSaved ?? 0;
    const currentStreak = userStats?.currentStreak ?? 0;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {getGreeting()}, {userData?.displayName?.split(' ')[0] || 'tam'}! 👋
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Oto podsumowanie Twoich finansów
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/scan">
                        <Button icon={<Camera className="w-5 h-5" />}>
                            Skanuj paragon
                        </Button>
                    </Link>
                    <Link href="/expenses">
                        <Button variant="outline" icon={<Plus className="w-5 h-5" />}>
                            Dodaj ręcznie
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Wydatki w tym miesiącu"
                    value={formatMoney(monthlyExpenses)}
                    icon={<Receipt className="w-5 h-5" />}
                    color="rose"
                />
                <StatCard
                    title="Zaoszczędzone"
                    value={formatMoney(monthlySaved)}
                    icon={<PiggyBank className="w-5 h-5" />}
                    color="emerald"
                />
                <StatCard
                    title="Aktywny streak"
                    value={`${currentStreak} dni 🔥`}
                    icon={<Flame className="w-5 h-5" />}
                    color="amber"
                />
                <StatCard
                    title="Cele w trakcie"
                    value={`${goals.length} aktywne`}
                    icon={<Target className="w-5 h-5" />}
                    color="blue"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Predictive Spending Widget */}
                <div className="lg:col-span-2">
                    <PredictiveSpendingWidget />
                </div>

                {/* AI Insights Widget */}
                <div>
                    <AIInsightsWidget />
                </div>

                {/* Goals Progress */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Cele oszczędnościowe</CardTitle>
                            <Link href="/goals">
                                <Button variant="ghost" size="sm">
                                    Zobacz wszystkie
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {goals.map((goal: any, i: number) => {
                                    const progress = (goal.current / goal.target) * 100;
                                    return (
                                        <motion.div
                                            key={goal.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{goal.emoji}</span>
                                                    <div>
                                                        <p className="font-medium">{goal.name}</p>
                                                        <p className="text-sm text-slate-400">
                                                            {formatMoney(goal.current)} / {formatMoney(goal.target)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-400">
                                                    {Math.round(progress)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {goals.length === 0 && (
                                    <div className="text-center py-8">
                                        <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400">Brak aktywnych celów</p>
                                        <Link href="/goals">
                                            <Button variant="outline" size="sm" className="mt-3">
                                                Stwórz pierwszy cel
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Expenses */}
                <div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Ostatnie wydatki</CardTitle>
                            <Link href="/expenses">
                                <Button variant="ghost" size="sm">
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {displayExpenses.slice(0, 5).map((expense: any, i: number) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="text-xl">
                                            {CATEGORY_ICONS[expense.category || expense.merchant?.category] || '📦'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {expense.merchant?.name || expense.merchant}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {CATEGORY_LABELS[expense.category || expense.merchant?.category] || 'Inne'}
                                            </p>
                                        </div>
                                        <p className="font-medium text-rose-400">
                                            -{formatMoney(expense.amount)}
                                        </p>
                                    </motion.div>
                                ))}

                                {displayExpenses.length === 0 && (
                                    <div className="text-center py-6">
                                        <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">Brak wydatków</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
