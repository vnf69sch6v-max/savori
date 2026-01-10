'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Wallet,
    Plus,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Settings,
    Loader2,
    X,
    Brain,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, formatMoneyShort, CATEGORY_LABELS, CATEGORY_ICONS, parseMoneyToCents } from '@/lib/utils';
import { collection, doc, getDoc, setDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Budget, ExpenseCategory, Expense } from '@/types';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES: ExpenseCategory[] = [
    'groceries', 'restaurants', 'transport', 'utilities', 'entertainment',
    'shopping', 'health', 'education', 'subscriptions', 'other',
];

export default function BudgetsPage() {
    const { userData } = useAuth();
    const { t, language } = useLanguage();
    const dateLocale = language === 'en' ? enUS : pl;
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [budget, setBudget] = useState<Budget | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const monthKey = format(currentMonth, 'yyyy-MM');

    // Fetch budget for current month
    // Guard to prevent repeated recalculation calls
    const hasTriggeredRecalc = useRef(false);

    useEffect(() => {
        if (!userData?.id) {
            setLoading(false);
            return;
        }

        // Reset recalc flag when month changes
        hasTriggeredRecalc.current = false;

        const budgetRef = doc(db, 'users', userData.id, 'budgets', monthKey);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        // Budget listener
        const unsubscribeBudget = onSnapshot(budgetRef, async (docSnap) => {
            if (docSnap.exists()) {
                const budgetData = { id: docSnap.id, ...docSnap.data() } as Budget;
                setBudget(budgetData);

                // Self-healing: ONLY trigger once per session to avoid loops
                if (!hasTriggeredRecalc.current &&
                    (budgetData.totalSpent === undefined || budgetData.totalSpent === 0) &&
                    budgetData.totalLimit > 0) {
                    hasTriggeredRecalc.current = true;
                    import('@/lib/expense-service').then(({ expenseService }) => {
                        expenseService.recalculateMonthlyStats(userData.id);
                    });
                }
            } else {
                setBudget(null);
                // No budget doc - trigger creation ONCE
                if (!hasTriggeredRecalc.current) {
                    hasTriggeredRecalc.current = true;
                    import('@/lib/expense-service').then(({ expenseService }) => {
                        expenseService.recalculateMonthlyStats(userData.id);
                    });
                }
            }
            setLoading(false);
        });

        // Expenses listener for category calculation
        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        const expensesQuery = query(
            expensesRef,
            where('date', '>=', Timestamp.fromDate(monthStart)),
            where('date', '<=', Timestamp.fromDate(monthEnd))
        );

        const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
            const expensesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
            setExpenses(expensesList);
        });

        return () => {
            unsubscribeBudget();
            unsubscribeExpenses();
        };
    }, [userData?.id, monthKey, currentMonth]);

    // Calculate spent per category - Memoized
    const spentByCategory = useMemo(() => {
        return expenses.reduce((acc, expense) => {
            const category = expense.merchant?.category || 'other';
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [expenses]);

    // Use budget.totalSpent directly if available, otherwise calculate from expenses
    const totalSpent = useMemo(() => {
        if (budget?.totalSpent !== undefined && budget.totalSpent > 0) {
            return budget.totalSpent;
        }
        return Object.values(spentByCategory).reduce((sum, v) => sum + v, 0);
    }, [budget?.totalSpent, spentByCategory]);

    // Navigation
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const [now] = useState(() => Date.now());

    // Days remaining in month
    const daysRemaining = Math.ceil((endOfMonth(currentMonth).getTime() - now) / (1000 * 60 * 60 * 24));
    const dailyBudget = budget && daysRemaining > 0
        ? Math.max(0, (budget.totalLimit - totalSpent) / daysRemaining)
        : 0;

    const utilizationPercent = budget ? Math.min(100, (totalSpent / budget.totalLimit) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto pb-24 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">{t('budgets.title')}</h1>
                        <p className="text-slate-400">{t('budgets.subtitle')}</p>
                    </div>
                </div>

                {/* Month Navigation - Glassmorphism - centered on mobile */}
                <div className="flex items-center justify-center w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-xl p-1">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 py-2 min-w-[160px] text-center font-medium capitalize text-emerald-400">
                            {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
                        </div>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 🧠 Behavioral Budget Link */}
            <Link href="/budgets/behavioral">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 
                              border border-purple-500/30 flex items-center gap-4 cursor-pointer
                              hover:border-purple-500/50 transition-colors"
                >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 
                                  flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            Behavioral Budget
                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 flex items-center gap-1">
                                <span className="text-[10px]">👑</span> ULTRA
                            </span>
                        </h3>
                        <p className="text-sm text-slate-400">
                            Kakeibo 2.0 • Fortress vs Life • Emotion Tagging
                        </p>
                    </div>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                </motion.div>
            </Link>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
            ) : !budget ? (
                // No budget set
                <Card className="p-12 text-center bg-slate-900/30 border-slate-800/50 border-dashed">
                    <Wallet className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t('budgets.noBudget')}</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        {t('budgets.noBudgetDesc')}
                    </p>
                    <Button onClick={() => setShowEditModal(true)} icon={<Plus className="w-5 h-5" />}>
                        {t('budgets.createBudget')}
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Total Budget Card - Deep Blue Theme */}
                    <div className="mb-6 p-6 rounded-3xl bg-[#0F172A] border border-slate-800 relative overflow-hidden">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-slate-400 font-medium">{t('budgets.totalBudget')}</span>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative h-4 bg-slate-800/80 rounded-full overflow-hidden mb-3 border border-slate-700/30">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${utilizationPercent}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`absolute inset-y-0 left-0 rounded-full ${utilizationPercent >= 100
                                                ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                : utilizationPercent >= 80
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                }`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                            {formatMoney(totalSpent)} <span className="text-sm sm:text-base text-slate-500 font-normal">/ {formatMoney(budget.totalLimit)}</span>
                                        </span>
                                        <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${utilizationPercent >= 100
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : utilizationPercent >= 80
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            }`}>
                                            {Math.round(utilizationPercent)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{formatMoney(budget.totalLimit - totalSpent)}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('budgets.remaining')}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{daysRemaining > 0 ? daysRemaining : 0}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('budgets.days')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Alert if over budget */}
                            {utilizationPercent >= 100 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 backdrop-blur-sm"
                                >
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-200">
                                        {t('budgets.exceededBy')} <strong className="text-red-100">{formatMoney(totalSpent - budget.totalLimit)}</strong>!
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Category Budgets */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">{t('budgets.categoryExpenses')}</h2>
                    </div>

                    <div className="grid gap-3">
                        {CATEGORIES.map((cat, i) => {
                            const categoryBudget = budget.categoryLimits?.[cat];
                            // Use pre-aggregated spent from budget doc, fallback to calculated
                            const spent = categoryBudget?.spent || spentByCategory[cat] || 0;
                            const limit = categoryBudget?.limit || 0;
                            const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                            const isOver = spent > limit && limit > 0;
                            const isWarning = percent >= 80 && percent < 100;

                            return (
                                <motion.div
                                    key={cat}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className={`p-4 rounded-2xl bg-slate-900/40 border transition-all hover:bg-slate-800/50 ${isOver ? 'border-red-500/30' : 'border-slate-800'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <span className="font-medium text-slate-200 truncate">{CATEGORY_LABELS[cat]}</span>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-sm font-medium whitespace-nowrap">
                                                            {formatMoneyShort(spent)}
                                                            {limit > 0 && <span className="text-slate-500"> / {formatMoneyShort(limit)}</span>}
                                                        </span>
                                                        {isOver && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                                        {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                                    </div>
                                                </div>
                                                {limit > 0 && (
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            transition={{ duration: 0.5, delay: i * 0.05 }}
                                                            className={`h-full rounded-full ${isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Edit Budget Modal */}
            <BudgetModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                existingBudget={budget}
                monthKey={monthKey}
            />
        </div>
    );
}

// Budget Modal Component
interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingBudget: Budget | null;
    monthKey: string;
}

function BudgetModal({ isOpen, onClose, existingBudget, monthKey }: BudgetModalProps) {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [totalLimit, setTotalLimit] = useState('');
    const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
    const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set());
    const [customCategory, setCustomCategory] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>([]);

    useEffect(() => {
        if (existingBudget) {
            setTotalLimit((existingBudget.totalLimit / 100).toString());
            const limits: Record<string, string> = {};
            const enabled = new Set<string>();
            Object.entries(existingBudget.categoryLimits || {}).forEach(([cat, data]) => {
                if (data?.limit) {
                    limits[cat] = (data.limit / 100).toString();
                    enabled.add(cat);
                }
            });
            setCategoryLimits(limits);
            setEnabledCategories(enabled);
        } else {
            setTotalLimit('3000');
            setCategoryLimits({});
            setEnabledCategories(new Set());
        }
    }, [existingBudget, isOpen]);

    const toggleCategory = (cat: string) => {
        setEnabledCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cat)) {
                newSet.delete(cat);
                setCategoryLimits(p => {
                    const { [cat]: _, ...rest } = p;
                    return rest;
                });
            } else {
                newSet.add(cat);
            }
            return newSet;
        });
    };

    const addCustomCategory = () => {
        if (!customCategory.trim()) return;
        const id = customCategory.toLowerCase().replace(/\s+/g, '_');
        if (!customCategories.includes(id)) {
            setCustomCategories([...customCategories, id]);
            setEnabledCategories(prev => new Set(prev).add(id));
        }
        setCustomCategory('');
    };

    const handleSave = async () => {
        if (!userData?.id) return;

        setLoading(true);

        try {
            const budgetData: Omit<Budget, 'id'> = {
                userId: userData.id,
                month: monthKey,
                totalLimit: parseMoneyToCents(totalLimit),
                totalSpent: existingBudget?.totalSpent || 0,
                categoryLimits: {},
                alertsEnabled: true,
                createdAt: existingBudget?.createdAt || Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Add only enabled category limits
            enabledCategories.forEach(cat => {
                const limitStr = categoryLimits[cat] || '0';
                const limit = parseMoneyToCents(limitStr);
                if (limit > 0) {
                    budgetData.categoryLimits[cat as ExpenseCategory] = {
                        limit,
                        spent: existingBudget?.categoryLimits?.[cat as ExpenseCategory]?.spent || 0,
                        alertThreshold: 0.8,
                    };
                }
            });

            const budgetRef = doc(db, 'users', userData.id, 'budgets', monthKey);
            await setDoc(budgetRef, budgetData);

            toast.success(existingBudget ? 'Budget updated' : 'Budget created');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save budget');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const allCategories = [...CATEGORIES, ...customCategories];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl"
            >
                <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b border-slate-800 z-10">
                    <h2 className="text-xl font-semibold">
                        {existingBudget ? 'Edit Budget' : 'Create Budget'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Total Limit */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Monthly Total Limit
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">zł</span>
                            <input
                                type="number"
                                value={totalLimit}
                                onChange={(e) => setTotalLimit(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Select categories to track
                        </label>
                        <p className="text-xs text-slate-500 mb-4">
                            Click a category to enable it and set a limit
                        </p>
                        <div className="space-y-2">
                            {allCategories.map((cat) => {
                                const isEnabled = enabledCategories.has(cat);
                                const isCustom = customCategories.includes(cat);

                                return (
                                    <div
                                        key={cat}
                                        className={`p-3 rounded-xl border transition-all ${isEnabled
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Toggle */}
                                            <button
                                                onClick={() => toggleCategory(cat)}
                                                className={`w-10 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: isEnabled ? 16 : 0 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow"
                                                />
                                            </button>

                                            <span className="text-xl">{CATEGORY_ICONS[cat] || '📁'}</span>
                                            <span className="flex-1 text-sm font-medium">
                                                {CATEGORY_LABELS[cat] || cat}
                                                {isCustom && <span className="text-xs text-slate-500 ml-2">(custom)</span>}
                                            </span>

                                            {/* Limit input when enabled */}
                                            {isEnabled && (
                                                <div className="relative w-28">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={categoryLimits[cat] || ''}
                                                        onChange={(e) => setCategoryLimits(prev => ({
                                                            ...prev,
                                                            [cat]: e.target.value
                                                        }))}
                                                        className="w-full px-3 py-1.5 bg-slate-800 border border-emerald-500/30 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">zł</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Custom Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Add custom category
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="e.g. Coffee, Gym..."
                                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addCustomCategory}
                                disabled={!customCategory.trim()}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Summary */}
                    {enabledCategories.size > 0 && (
                        <div className="p-4 bg-slate-800/50 rounded-xl">
                            <p className="text-sm text-slate-400">
                                Tracking <strong className="text-white">{enabledCategories.size}</strong> categories
                                {Object.values(categoryLimits).some(v => parseFloat(v) > 0) && (
                                    <> with total limit <strong className="text-emerald-400">
                                        {(Object.values(categoryLimits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)).toFixed(0)} zł
                                    </strong></>
                                )}
                            </p>
                        </div>
                    )}

                    <Button onClick={handleSave} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Budget'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
