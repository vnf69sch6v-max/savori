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
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget, SavingGoal } from '@/types';
import AIInsightsWidget from '@/components/AIInsightsWidget';
import PredictiveSpendingWidget from '@/components/PredictiveSpendingWidget';
import EmptyDashboard from '@/components/EmptyDashboard';
import SafeToSpendCard from '@/components/SafeToSpendCard';
import GamificationHub from '@/components/GamificationHub';
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import HookChallengeWidget from '@/components/dashboard/HookChallengeWidget';
import AIChatSheet from '@/components/AIChatSheet';
import { recurringExpensesService, getMonthlyEquivalent } from '@/lib/subscriptions/recurring-service';

// Minimum thresholds for showing advanced features
const MIN_EXPENSES_FOR_AI = 5;
const MIN_EXPENSES_FOR_PREDICTIONS = 3;

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
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
            setTimeout(() => setLoading(false), 0);
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
            })) as SavingGoal[];
            setGoals(data);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Calculate stats from actual expenses (not userData.stats which isn't updated)
    const displayExpenses = expenses;

    // Calculate total from current month expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpensesTotal = expenses
        .filter(e => {
            if (!e.date) return true; // Include if no date
            const expenseDate = typeof e.date.toDate === 'function'
                ? e.date.toDate()
                : new Date(e.date as unknown as string);
            return expenseDate >= startOfMonth;
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const monthlyExpenses = monthlyExpensesTotal;
    const monthlySaved = userData?.stats?.totalSaved ?? 0;
    const currentStreak = userData?.stats?.currentStreak ?? 0;

    // Budget calculations for Safe-to-Spend card
    // Default to settings or 5000 PLN if no budget set
    const defaultBudget = (userData?.settings as any)?.monthlyBudget || 500000;
    const [monthlyBudget, setMonthlyBudget] = useState(defaultBudget);
    const [plannedExpenses, setPlannedExpenses] = useState(0);

    // Fetch budget for current month
    useEffect(() => {
        if (!userData?.id) return;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const budgetRef = doc(db, 'users', userData.id, 'budgets', monthKey);

        const unsubscribe = onSnapshot(budgetRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as Budget;
                setMonthlyBudget(data.totalLimit);
            }
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Fetch recurring expenses for planned amount (real-time sync)
    useEffect(() => {
        if (!userData?.id) return;

        const unsubscribe = recurringExpensesService.subscribe(userData.id, (expenses) => {
            const total = expenses.reduce((sum, exp) => {
                return sum + getMonthlyEquivalent(exp.amount, exp.frequency);
            }, 0);
            setPlannedExpenses(Math.round(total));
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Check if user has enough data
    const isEmpty = expenses.length === 0;
    const showAI = expenses.length >= MIN_EXPENSES_FOR_AI;
    const showPredictions = expenses.length >= MIN_EXPENSES_FOR_PREDICTIONS;

    // EMPTY STATE: Show guided onboarding dashboard
    if (isEmpty && !loading) {
        return (
            <EmptyDashboard
                userName={userData?.displayName?.split(' ')[0] || 'tam'}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            {/* Personal Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">
                    {getGreeting()}, {userData?.displayName?.split(' ')[0] || 'tam'}! 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    Dziś wydałeś <span className="text-white font-medium">{formatMoney(monthlyExpensesTotal)}</span>. Trzymaj tak dalej!
                </p>
            </div>

            {/* Hero Section - Safe to Spend + Gamification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <SafeToSpendCard
                    totalBalance={Math.max(0, monthlyBudget - monthlyExpenses)} // Actual safe-to-spend
                    plannedExpenses={plannedExpenses}
                    spentThisMonth={monthlyExpenses}
                    budgetLimit={monthlyBudget}
                />
                <GamificationHub
                    xp={userData?.gamification?.xp || 0}
                    level={userData?.gamification?.level || 1}
                    levelName="Nowicjusz"
                    xpToNextLevel={((userData?.gamification?.level || 1) + 1) * 500}
                    currentLevelXP={(userData?.gamification?.level || 1) * 500}
                    streak={currentStreak}
                    points={userData?.gamification?.points || 0}
                    recentBadge={userData?.gamification?.badges?.slice(-1)[0] ? {
                        name: userData.gamification.badges.slice(-1)[0],
                        emoji: '🏅'
                    } : undefined}
                />
            </div>

            {/* Quick Actions Bar - thumb-friendly */}
            <div className="mb-6 md:hidden">
                <QuickActionsBar
                    onOpenChat={() => setIsChatOpen(true)}
                />
            </div>

            {/* Hook Challenge Widget - Variable Reward Zone */}
            <div className="mb-6">
                <HookChallengeWidget />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Predictive Spending Widget - show only if enough data */}
                <div className="lg:col-span-2">
                    {showPredictions ? (
                        <PredictiveSpendingWidget lastUpdate={expenses.length + monthlyExpenses} />
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Prognoza wydatków</h3>
                                    <p className="text-sm text-slate-400">Wymaga min. {MIN_EXPENSES_FOR_PREDICTIONS} wydatków</p>
                                </div>
                            </div>
                            <div className="text-center py-8">
                                <p className="text-slate-500 mb-4">Dodaj jeszcze {MIN_EXPENSES_FOR_PREDICTIONS - expenses.length} wydatek(ów) aby odblokować prognozy AI</p>
                                <Link href="/scan">
                                    <Button size="sm">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Zeskanuj paragon
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>

                {/* AI Insights Widget - show only if enough data */}
                <div>
                    {showAI ? (
                        <AIInsightsWidget />
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">AI Insights</h3>
                                    <p className="text-sm text-slate-400">Wymaga min. {MIN_EXPENSES_FOR_AI} wydatków</p>
                                </div>
                            </div>
                            <div className="text-center py-4">
                                <p className="text-slate-500 text-sm">
                                    {expenses.length}/{MIN_EXPENSES_FOR_AI} wydatków
                                </p>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (expenses.length / MIN_EXPENSES_FOR_AI) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
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
                                {displayExpenses.slice(0, 5).map((expense: Expense, i: number) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="text-xl">
                                            {CATEGORY_ICONS[expense.merchant?.category] || '📦'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {expense.merchant?.name || 'Nieznany'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {CATEGORY_LABELS[expense.merchant?.category] || 'Inne'}
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

            {/* AI Chat Bottom Sheet */}
            <AIChatSheet
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
}
