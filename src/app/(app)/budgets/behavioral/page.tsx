'use client';

/**
 * Behavioral Budget Page
 * Kakeibo 2.0 - Fortress vs Life split view with psychological categories
 * ULTRA PLAN ONLY
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Sparkles, Crown, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, BehavioralCategory } from '@/types';
import {
    getFortressCategories,
    getLifeCategories,
    suggestBehavioralCategory,
    BEHAVIORAL_CATEGORIES,
} from '@/lib/behavioral-categories';
import { Button } from '@/components/ui';

// Demo budget limits (in grosze)
const DEFAULT_LIMITS: Record<BehavioralCategory, number> = {
    fortress: 200000,
    shield: 50000,
    fuel: 80000,
    dopamine: 50000,
    micro_joy: 30000,
    xp_points: 60000,
    for_me: 40000,
    social_glue: 60000,
    love_language: 30000,
    tribe_tax: 20000,
    chaos_tax: 10000,
    impulse_zone: 40000,
};

// Simple Category Row Component (inlined to fix layout)
function CategoryRow({
    categoryId,
    spent,
    limit
}: {
    categoryId: BehavioralCategory;
    spent: number;
    limit: number;
}) {
    const meta = BEHAVIORAL_CATEGORIES[categoryId];
    const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const remaining = Math.max(0, limit - spent);
    const isOver = spent > limit;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${isOver
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-slate-700/50 bg-slate-800/40'
                }`}
        >
            <div className="flex items-center gap-4">
                {/* Emoji */}
                <div className="w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center text-2xl">
                    {meta.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{meta.name}</h3>
                        <span className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>
                            {(spent / 100).toFixed(0)} zł
                            <span className="text-slate-500 font-normal"> / {(limit / 100).toFixed(0)}</span>
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">{meta.description}</p>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isOver ? 'bg-red-500' :
                                percentage >= 80 ? 'bg-amber-500' :
                                    'bg-emerald-500'
                                }`}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function BehavioralBudgetPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // ULTRA ONLY CHECK
    const isUltra = userData?.subscription?.plan === 'ultra';

    const fortressCategories = getFortressCategories();
    const lifeCategories = getLifeCategories();

    // Fetch current month expenses
    useEffect(() => {
        if (!userData?.id || !isUltra) {
            setLoading(false);
            return;
        }

        const fetchExpenses = async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            const q = query(
                expensesRef,
                where('date', '>=', Timestamp.fromDate(startOfMonth)),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];

            setExpenses(data);
            setLoading(false);
        };

        fetchExpenses();
    }, [userData?.id, isUltra]);

    // Calculate spent per behavioral category
    const spentByCategory = useMemo(() => {
        const result: Record<BehavioralCategory, number> = {} as Record<BehavioralCategory, number>;

        Object.keys(DEFAULT_LIMITS).forEach(cat => {
            result[cat as BehavioralCategory] = 0;
        });

        expenses.forEach(expense => {
            const mccCategory = expense.merchant?.category || 'other';
            const behavioralCat = suggestBehavioralCategory(mccCategory);
            result[behavioralCat] = (result[behavioralCat] || 0) + expense.amount;
        });

        return result;
    }, [expenses]);

    // Calculate totals
    const fortressTotal = useMemo(() => {
        return fortressCategories.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0);
    }, [fortressCategories, spentByCategory]);

    const lifeTotal = useMemo(() => {
        return lifeCategories.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0);
    }, [lifeCategories, spentByCategory]);

    const totalBudget = Object.values(DEFAULT_LIMITS).reduce((a, b) => a + b, 0);
    const totalSpent = fortressTotal + lifeTotal;
    const remaining = totalBudget - totalSpent;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // ULTRA GATE - Show upgrade prompt if not Ultra
    if (!isUltra) {
        return (
            <div className="min-h-screen bg-slate-950 pb-24 overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
                    <div className="max-w-lg mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/budgets" className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">Budżet Behawioralny</h1>
                                <p className="text-sm text-slate-400">Kakeibo 2.0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-6">
                    {/* Animated Demo Preview (Blurred) */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 z-10 pointer-events-none" />
                        <div className="blur-[2px] opacity-60 pointer-events-none">
                            {/* Fake Summary Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 
                                          border border-slate-700/50 mb-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Budżet miesięczny</p>
                                        <p className="text-2xl font-bold text-white">5 000 zł</p>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">
                                        💰 3 420 zł
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '32%' }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    />
                                </div>
                            </motion.div>

                            {/* Fake Fortress Section */}
                            <div className="space-y-2">
                                {[
                                    { emoji: '🏰', name: 'Twierdza', spent: 1200, limit: 2000, delay: 0.1 },
                                    { emoji: '🛡️', name: 'Spokojny Sen', spent: 300, limit: 500, delay: 0.2 },
                                    { emoji: '⛽', name: 'Paliwo', spent: 580, limit: 800, delay: 0.3 },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: item.delay }}
                                        className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.emoji}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-white">{item.name}</span>
                                                    <span className="text-xs text-slate-400">{item.spent} / {item.limit} zł</span>
                                                </div>
                                                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.spent / item.limit) * 100}%` }}
                                                        transition={{ duration: 1, delay: item.delay + 0.5 }}
                                                        className="h-full rounded-full bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
                        className="relative p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                                  border border-purple-500/40 backdrop-blur-xl overflow-hidden"
                    >
                        {/* Animated glow */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"
                        />

                        <div className="relative z-10 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.7, type: 'spring', damping: 15 }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                                          flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30"
                            >
                                <Crown className="w-8 h-8 text-white" />
                            </motion.div>

                            <h2 className="text-xl font-bold text-white mb-2">
                                Odblokuj Budżet Behawioralny
                            </h2>
                            <p className="text-sm text-slate-300 mb-5">
                                Psychologiczne kategorie, które pomagają zrozumieć <em>dlaczego</em> wydajesz
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {['🏰 Twierdza vs Życie', '🧠 12 kategorii', '😊 Emocje'].map((feature, i) => (
                                    <motion.span
                                        key={feature}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 + i * 0.1 }}
                                        className="px-3 py-1.5 text-xs bg-slate-800/80 text-slate-300 
                                                  rounded-full border border-slate-700/50"
                                    >
                                        {feature}
                                    </motion.span>
                                ))}
                            </div>

                            <Link href="/settings/billing">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 px-6 rounded-2xl font-semibold text-white
                                              bg-gradient-to-r from-purple-500 to-pink-500 
                                              shadow-lg shadow-purple-500/25 
                                              flex items-center justify-center gap-2"
                                >
                                    <Crown className="w-5 h-5" />
                                    Ulepsz do Ultra
                                </motion.button>
                            </Link>

                            <p className="text-xs text-slate-500 mt-3">
                                Tylko 29 zł/mies. • Anuluj kiedy chcesz
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/budgets" className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">Budżet Behawioralny</h1>
                            <p className="text-sm text-slate-400">Kakeibo 2.0</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                            ULTRA
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 
                              border border-slate-700/50 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-400">Budżet miesięczny</p>
                            <p className="text-3xl font-bold text-white">
                                {(totalBudget / 100).toLocaleString('pl-PL')} zł
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl ${remaining >= 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}>
                            <p className="text-sm font-medium">
                                {remaining >= 0 ? '💰 Zostało' : '⚠️ Przekroczono'}
                            </p>
                            <p className="text-lg font-bold">
                                {(Math.abs(remaining) / 100).toLocaleString('pl-PL')} zł
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${totalSpent > totalBudget
                                ? 'bg-red-500'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                        />
                    </div>
                </motion.div>

                {/* 🏰 TWIERDZA Section */}
                <section>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">🏰 Twierdza</h2>
                            <p className="text-xs text-slate-500">Koszty stałe • {(fortressTotal / 100).toLocaleString('pl-PL')} zł</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {fortressCategories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <CategoryRow
                                    categoryId={cat.id}
                                    spent={spentByCategory[cat.id] || 0}
                                    limit={DEFAULT_LIMITS[cat.id]}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 🌈 ŻYCIE Section */}
                <section>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">🌈 Życie</h2>
                            <p className="text-xs text-slate-500">Twoje wybory • {(lifeTotal / 100).toLocaleString('pl-PL')} zł</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {lifeCategories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + index * 0.05 }}
                            >
                                <CategoryRow
                                    categoryId={cat.id}
                                    spent={spentByCategory[cat.id] || 0}
                                    limit={DEFAULT_LIMITS[cat.id]}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
