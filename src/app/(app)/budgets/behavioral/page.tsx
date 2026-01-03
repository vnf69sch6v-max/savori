'use client';

/**
 * Behavioral Budget Page
 * Kakeibo 2.0 - Fortress vs Life split view with psychological categories
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, TrendingUp, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, BehavioralCategory } from '@/types';
import {
    getFortressCategories,
    getLifeCategories,
    suggestBehavioralCategory,
    BehavioralCategoryMeta
} from '@/lib/behavioral-categories';
import BehavioralBudgetCard from '@/components/behavioral/BehavioralBudgetCard';

// Demo budget limits (in grosze)
const DEFAULT_LIMITS: Record<BehavioralCategory, number> = {
    fortress: 200000,  // 2000 zł
    shield: 50000,     // 500 zł
    fuel: 80000,       // 800 zł
    dopamine: 50000,   // 500 zł
    micro_joy: 30000,  // 300 zł
    xp_points: 60000,  // 600 zł
    for_me: 40000,     // 400 zł
    social_glue: 60000,// 600 zł
    love_language: 30000, // 300 zł
    tribe_tax: 20000,  // 200 zł
    chaos_tax: 10000,  // 100 zł
    impulse_zone: 40000, // 400 zł
};

export default function BehavioralBudgetPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const fortressCategories = getFortressCategories();
    const lifeCategories = getLifeCategories();

    // Fetch current month expenses
    useEffect(() => {
        if (!userData?.id) return;

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
    }, [userData?.id]);

    // Calculate spent per behavioral category
    const spentByCategory = useMemo(() => {
        const result: Record<BehavioralCategory, number> = {} as Record<BehavioralCategory, number>;

        // Initialize all to 0
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
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
                        <div>
                            <h1 className="text-xl font-bold text-white">Budżet Behawioralny</h1>
                            <p className="text-sm text-slate-400">Kakeibo 2.0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">🏰 Twierdza</h2>
                            <p className="text-sm text-slate-500">Koszty stałe • {(fortressTotal / 100).toLocaleString('pl-PL')} zł</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {fortressCategories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <BehavioralBudgetCard
                                    category={cat.id}
                                    spent={spentByCategory[cat.id] || 0}
                                    limit={DEFAULT_LIMITS[cat.id]}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 🌈 ŻYCIE Section */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">🌈 Życie</h2>
                            <p className="text-sm text-slate-500">Twoje wybory • {(lifeTotal / 100).toLocaleString('pl-PL')} zł</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {lifeCategories.map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                <BehavioralBudgetCard
                                    category={cat.id}
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
