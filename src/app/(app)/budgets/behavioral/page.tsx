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
            <div className="min-h-screen bg-slate-950 pb-24">
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

                {/* Ultra Required */}
                <div className="max-w-lg mx-auto px-4 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 
                                  border border-purple-500/30 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                            <Crown className="w-10 h-10 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Funkcja Ultra
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Budżet Behawioralny z kategoriami psychologicznymi i śledzeniem emocji
                            jest dostępny tylko w planie Ultra.
                        </p>
                        <div className="space-y-3 text-left mb-8 p-4 bg-slate-800/50 rounded-2xl">
                            <div className="flex items-center gap-3 text-sm">
                                <span>🏰</span>
                                <span className="text-slate-300">Twierdza vs Życie - podział Kakeibo</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span>🧠</span>
                                <span className="text-slate-300">12 kategorii psychologicznych</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span>😊</span>
                                <span className="text-slate-300">Tagowanie emocji (HALT)</span>
                            </div>
                        </div>
                        <Link href="/settings/billing">
                            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                                <Crown className="w-4 h-4 mr-2" />
                                Ulepsz do Ultra
                            </Button>
                        </Link>
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
