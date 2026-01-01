'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function SafeToSpendCard() {
    const { user } = useAuth();
    const [limit, setLimit] = useState(300000); // Default 3000 PLN in grosze
    const [spent, setSpent] = useState(0); // in grosze
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. Subscribe to Budget Limit & Spent
        const budgetRef = doc(db, 'users', user.uid, 'budgets', monthKey);
        const unsubscribeBudget = onSnapshot(budgetRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.totalLimit) setLimit(data.totalLimit);
                setSpent(data.totalSpent || 0); // Use aggregated value
            }
            setLoading(false);
        });

        return () => {
            unsubscribeBudget();
        };
    }, [user]);

    // Derived Stats
    const safeToSpend = (limit - spent) / 100;
    const spentPLN = spent / 100;
    const limitPLN = limit / 100;
    const percentageUsed = (spent / limit) * 100;

    // Days remaining
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDay.getDate() - today.getDate());
    const dailySafe = safeToSpend / daysRemaining;

    if (loading) {
        return <div className="h-64 rounded-3xl bg-slate-800/50 animate-pulse" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="bg-[#003c3c] rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/5">
                {/* Ambient Glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 text-gray-300 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center backdrop-blur-sm">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-medium text-sm">Bezpiecznie do wydania</span>
                </div>

                {/* Main Number */}
                <div className="mb-1 relative z-10">
                    <h2 className="text-4xl font-bold text-emerald-400 tracking-tight">
                        {safeToSpend.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                    </h2>
                </div>

                {/* Subtext */}
                <p className="text-sm text-gray-400 mb-6 font-medium relative z-10">
                    ~{dailySafe.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł <span className="text-gray-500">dziennie do końca miesiąca</span>
                </p>

                {/* AI Insight Pill */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-start gap-3 mb-6 relative z-10 backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {percentageUsed < 80
                            ? "Świetnie Ci idzie! Stać Cię na lepszy obiad ☕️"
                            : "Uważaj, zbliżasz się do limitu budżetu! 📉"
                        }
                    </p>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-xs font-medium text-gray-400 mb-2">
                        <span>Wykorzystany budżet</span>
                        <span>{Math.round(percentageUsed)}%</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, percentageUsed)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute top-0 left-0 h-full rounded-full ${percentageUsed > 100 ? 'bg-red-500' : 'bg-emerald-400'}`}
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs mt-3">
                        <div className="flex items-center gap-1.5 text-red-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>Wydatki: {spentPLN.toLocaleString('pl-PL')} zł</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <ArrowRight className="w-3 h-3" />
                            <span>Limit: {limitPLN.toLocaleString('pl-PL')} zł</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
