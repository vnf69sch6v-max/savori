'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Camera,
    Target,
    PiggyBank,
    Receipt,
    Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, Budget, SavingGoal } from '@/types';
import dynamic from 'next/dynamic';

// Lazy load heavy components for better initial load performance
const AIInsightsWidget = dynamic(() => import('@/components/AIInsightsWidget'), {
    ssr: false,
    loading: () => <div className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />,
});
const PredictiveSpendingWidget = dynamic(() => import('@/components/PredictiveSpendingWidget'), {
    ssr: false,
    loading: () => <div className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />,
});
const GamificationHub = dynamic(() => import('@/components/GamificationHub'), {
    ssr: false,
    loading: () => <div className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />,
});
const AIChatSheet = dynamic(() => import('@/components/AIChatSheet'), {
    ssr: false,
    loading: () => null,
});

import EmptyDashboard from '@/components/EmptyDashboard';
import SafeToSpendCard from '@/components/SafeToSpendCard';
import ActionGrid from '@/components/dashboard/ActionGrid';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MobileDashboard from '@/components/dashboard/MobileDashboard';
import HookChallengeWidget from '@/components/dashboard/HookChallengeWidget';
import SmartExpenseModal from '@/components/SmartExpenseModal';
import GradientExpenseCard from '@/components/GradientExpenseCard';
import ImpulseLockModal from '@/components/dashboard/ImpulseLockModal';
import { recurringExpensesService, getMonthlyEquivalent } from '@/lib/subscriptions/recurring-service';

import SmartSummary from '@/components/dashboard/SmartSummary';
import DailyBonusWidget from '@/components/engagement/DailyBonusWidget';
import FinancialWeatherWidget from '@/components/engagement/FinancialWeatherWidget';
import MoneyWrappedCard from '@/components/engagement/MoneyWrappedCard';
import PendingPurchasesWidget from '@/components/engagement/PendingPurchasesWidget';
import PremiumFeatureGate from '@/components/PremiumFeatureGate';
import ProUpgradeBanner from '@/components/ProUpgradeBanner';
import { useSubscription } from '@/hooks/useSubscription';

const MIN_EXPENSES_FOR_AI = 5;
const MIN_EXPENSES_FOR_PREDICTIONS = 3;

import { useLanguage, useCurrency } from '@/hooks/use-language';

export default function DashboardPage() {
    const router = useRouter();
    const { userData } = useAuth();
    const { isPro } = useSubscription();
    const { t, currency } = useLanguage();
    const { format: formatMoney } = useCurrency(); // Override global formatMoney
    // const userCurrency = (userData?.settings?.currency as string) || 'PLN'; // Deprecated for display

    // ...
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImpulseModalOpen, setIsImpulseModalOpen] = useState(false);
    const [monthlySpent, setMonthlySpent] = useState(0);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t.dashboard.greeting.morning;
        if (hour < 18) return t.dashboard.greeting.afternoon;
        return t.dashboard.greeting.evening;
    };

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

    const displayExpenses = expenses;
    const now = new Date();

    // We use the aggregated value from the budget document now
    const monthlyExpenses = monthlySpent;
    const currentStreak = userData?.stats?.currentStreak ?? 0;
    const defaultBudget = (userData?.settings as any)?.monthlyBudget || 500000;
    const [monthlyBudget, setMonthlyBudget] = useState(defaultBudget);
    const [plannedExpenses, setPlannedExpenses] = useState(0);
    const [widgetPriorities, setWidgetPriorities] = useState({
        prediction: 'low',
        ai: 'low'
    });



    // Guard to prevent repeated recalculation calls
    const hasTriggeredRecalc = useRef(false);

    useEffect(() => {
        if (!userData?.id) return;
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const budgetRef = doc(db, 'users', userData.id, 'budgets', monthKey);

        const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Budget;
                setMonthlyBudget(data.totalLimit);
                setMonthlySpent(data.totalSpent || 0);
            } else {
                // Missing budget doc? Auto-create/repair ONCE
                if (!hasTriggeredRecalc.current) {
                    hasTriggeredRecalc.current = true;
                    import('@/lib/expense-service').then(({ expenseService }) => {
                        expenseService.recalculateMonthlyStats(userData.id);
                    });
                }
            }
        });
        return () => unsubscribe();
    }, [userData?.id]);

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

    const isEmpty = expenses.length === 0;
    const showPredictions = expenses.length >= MIN_EXPENSES_FOR_PREDICTIONS;
    const showAI = expenses.length >= MIN_EXPENSES_FOR_AI;

    const handlePriorityChange = (widget: 'prediction' | 'ai', priority: string) => {
        setWidgetPriorities(prev => {
            if (prev[widget] === priority) return prev;
            return { ...prev, [widget]: priority };
        });
    };

    const isPredictionCritical = widgetPriorities.prediction === 'critical';
    const isAICritical = widgetPriorities.ai === 'critical';

    if (isEmpty && !loading) {
        return <EmptyDashboard userName={userData?.displayName?.split(' ')[0] || 'tam'} />;
    }

    // Desktop Layout
    return (
        <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
            {/* Mobile Layout */}
            <div className="lg:hidden">
                <MobileDashboard
                    spent={monthlySpent}
                    limit={monthlyBudget}
                    loading={loading}
                    expenses={expenses}
                    isPro={isPro}
                    onScanClick={() => router.push('/scan')}
                    onAddClick={() => setIsAddModalOpen(true)}
                    onImpulseClick={() => setIsImpulseModalOpen(true)}
                    onChatClick={() => setIsChatOpen(true)}
                    formatMoney={formatMoney}
                    t={t}
                />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
                <SmartSummary
                    expenses={expenses}
                    userName={userData?.displayName?.split(' ')[0] || 'tam'}
                    currency={currency}
                    budget={monthlyBudget}
                />

                {/* Daily Bonus Widget */}
                <div className="mb-6 grid md:grid-cols-2 gap-4">
                    <PremiumFeatureGate requiredPlan="pro" featureName="Pogoda Finansowa">
                        <FinancialWeatherWidget
                            expenses={expenses}
                            budgets={[{ totalLimit: monthlyBudget, totalSpent: monthlySpent } as any]}
                        />
                    </PremiumFeatureGate>
                    <PremiumFeatureGate requiredPlan="pro" featureName="Money Wrapped">
                        <MoneyWrappedCard expenses={expenses} />
                    </PremiumFeatureGate>
                </div>

                {/* Pending Purchases (Pre-Purchase Pause) */}
                <PremiumFeatureGate requiredPlan="pro" featureName="Pre-Purchase Pause">
                    <PendingPurchasesWidget className="mb-6" />
                </PremiumFeatureGate>

                {/* High Priority Section (Desktop) */}
                {(isPredictionCritical || isAICritical) && (
                    <div className="mb-6 grid grid-cols-1 gap-6">
                        {isPredictionCritical && showPredictions && (
                            <PredictiveSpendingWidget
                                lastUpdate={expenses.length + monthlyExpenses}
                                onPriorityChange={(p) => handlePriorityChange('prediction', p)}
                            />
                        )}
                        {isAICritical && showAI && (
                            <AIInsightsWidget onPriorityChange={(p) => handlePriorityChange('ai', p)} />
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    <SafeToSpendCard spent={monthlySpent} limit={monthlyBudget} loading={loading} />
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

                <div className="mb-6">
                    <PremiumFeatureGate requiredPlan="pro" featureName="AI Quiz">
                        <HookChallengeWidget />
                    </PremiumFeatureGate>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {/* Show Prediction here ONLY if NOT critical */}
                        {!isPredictionCritical && (showPredictions ? (
                            <PremiumFeatureGate requiredPlan="pro" featureName="Prognoza Wydatków">
                                <PredictiveSpendingWidget
                                    lastUpdate={expenses.length + monthlyExpenses}
                                    onPriorityChange={(p) => handlePriorityChange('prediction', p)}
                                />
                            </PremiumFeatureGate>
                        ) : (
                            <Card className="p-6">
                                {/* Placeholder content */}
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
                        ))}
                    </div>

                    <div>
                        {/* Show AI here ONLY if NOT critical */}
                        {!isAICritical && (showAI ? (
                            <PremiumFeatureGate requiredPlan="pro" featureName="AI Insights">
                                <AIInsightsWidget onPriorityChange={(p) => handlePriorityChange('ai', p)} />
                            </PremiumFeatureGate>
                        ) : (
                            <Card className="p-6">
                                {/* Placeholder content */}
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
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                                        <div
                                            className="h-full bg-purple-500 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, (expenses.length / MIN_EXPENSES_FOR_AI) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

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
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
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
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
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
            </div>

            <AIChatSheet
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                context={{
                    expenses: expenses.slice(0, 20), // Pass recent 20
                    budget: { totalLimit: monthlyBudget },
                    userName: userData?.displayName?.split(' ')[0] || 'User'
                }}
            />
            <ImpulseLockModal isOpen={isImpulseModalOpen} onClose={() => setIsImpulseModalOpen(false)} />
            <SmartExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
    );
}
