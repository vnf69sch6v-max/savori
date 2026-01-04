'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useCurrency } from '@/hooks/use-language';

interface SafeToSpendCardProps {
    spent: number;      // in cents/grosze
    limit: number;      // in cents/grosze
    loading?: boolean;
}

export default function SafeToSpendCard({ spent, limit, loading = false }: SafeToSpendCardProps) {
    const { format: formatMoney } = useCurrency();

    // Derived Stats (in cents)
    const safeToSpend = limit - spent;
    const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;

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
            <div className="bg-[#003c3c] rounded-3xl p-4 shadow-xl relative overflow-hidden border border-white/5">
                {/* Ambient Glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex items-center gap-2 mb-2 text-gray-300 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center backdrop-blur-sm">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-medium text-xs uppercase tracking-wide opacity-80">Bezpiecznie do wydania</span>
                </div>

                <div className="mb-2 relative z-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight tabular-nums">
                        {formatMoney(safeToSpend)}
                    </h2>
                </div>

                {/* Subtext */}
                <p className="text-xs text-gray-400 mb-6 font-medium relative z-10">
                    ~{formatMoney(dailySafe).replace(/,00..$/, '')} <span className="text-gray-500">dziennie</span>
                </p>

                {/* Insight Pill removed for compact mobile layout matching Budgets screen */}

                {/* Progress Bar Section */}

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

                    <div className="flex flex-wrap justify-between items-center text-xs mt-3 gap-y-1">
                        <div className="flex items-center gap-1.5 text-red-400">
                            <TrendingUp className="w-3 h-3 shrink-0" />
                            <span className="whitespace-nowrap">Wydatki: {formatMoney(spent)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <ArrowRight className="w-3 h-3 shrink-0" />
                            <span className="whitespace-nowrap">Limit: {formatMoney(limit)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
