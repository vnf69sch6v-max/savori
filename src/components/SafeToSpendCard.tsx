'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Info, Sparkles } from 'lucide-react';

interface SafeToSpendCardProps {
    totalBalance: number;       // Total available balance (in grosz)
    plannedExpenses: number;    // Planned recurring expenses (in grosz)
    spentThisMonth: number;     // Already spent this month (in grosz)
    budgetLimit?: number;       // Monthly budget limit (in grosz)
}

// AI trigger messages based on financial health
function getAIMessage(budgetUsedPercent: number, dailyBudget: number): string {
    if (budgetUsedPercent < 50) {
        const extras = ['kawę', 'lepszy obiad', 'mały prezent dla siebie'];
        return `Świetnie Ci idzie! Stać Cię na ${extras[Math.floor(Math.random() * extras.length)]} ☕`;
    }
    if (budgetUsedPercent < 70) {
        return `Jesteś na dobrej drodze! ${Math.round(100 - budgetUsedPercent)}% budżetu przed Tobą 💪`;
    }
    if (budgetUsedPercent < 85) {
        return `Uważaj na wydatki. Zostało ${dailyBudget.toFixed(0)} zł dziennie ⚠️`;
    }
    if (budgetUsedPercent < 95) {
        return `Limit blisko! Rozważ ograniczenie wydatków do końca miesiąca 🚨`;
    }
    return `Przekroczono budżet. Porozmawiajmy o planie naprawczym 💬`;
}

export default function SafeToSpendCard({
    totalBalance,
    plannedExpenses,
    spentThisMonth,
    budgetLimit
}: SafeToSpendCardProps) {
    // Safe to spend is already calculated as (budget - spent) passed as totalBalance
    const safeToSpend = Math.max(0, totalBalance);
    const safeToSpendDisplay = (safeToSpend / 100).toFixed(2);

    // Calculate days remaining in month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - now.getDate() + 1);

    // Daily budget
    const dailyBudget = safeToSpend / 100 / daysRemaining;

    // Calculate percentage of budget used
    const budgetUsedPercent = budgetLimit ? Math.min(100, (spentThisMonth / budgetLimit) * 100) : 0;

    // Determine status
    const isHealthy = budgetUsedPercent < 70;
    const isWarning = budgetUsedPercent >= 70 && budgetUsedPercent < 90;
    const isDanger = budgetUsedPercent >= 90;

    // Status colors
    const statusColor = isHealthy ? 'emerald' : isWarning ? 'amber' : 'red';
    const bgGradient = isHealthy
        ? 'from-emerald-500/20 to-teal-500/20'
        : isWarning
            ? 'from-amber-500/20 to-orange-500/20'
            : 'from-red-500/20 to-pink-500/20';
    const borderColor = isHealthy
        ? 'border-emerald-500/30'
        : isWarning
            ? 'border-amber-500/30'
            : 'border-red-500/30';
    const textColor = isHealthy
        ? 'text-emerald-400'
        : isWarning
            ? 'text-amber-400'
            : 'text-red-400';

    // AI Message
    const aiMessage = getAIMessage(budgetUsedPercent, dailyBudget);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} border ${borderColor} p-6`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-${statusColor}-500/20`}>
                            <Wallet className={`w-5 h-5 ${textColor}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Bezpiecznie do wydania</span>
                    </div>
                    <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Co to znaczy?">
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Amount */}
                <div className="mb-2">
                    <p className={`text-4xl font-bold ${textColor} tabular-nums`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {safeToSpendDisplay} <span className="text-lg">zł</span>
                    </p>
                    {/* Daily budget - key psychological insight */}
                    <p className="text-sm text-slate-400 mt-1">
                        <span className="font-medium text-white">~{dailyBudget.toFixed(0)} zł</span> dziennie do końca miesiąca
                    </p>
                </div>

                {/* AI Trigger Bubble */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50"
                >
                    <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300">{aiMessage}</p>
                    </div>
                </motion.div>

                {/* Progress bar with marker */}
                {budgetLimit && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Wykorzystany budżet</span>
                            <span>{budgetUsedPercent.toFixed(0)}%</span>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${budgetUsedPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${isHealthy ? 'bg-emerald-500' :
                                    isWarning ? 'bg-amber-500' :
                                        'bg-red-500'
                                    }`}
                            />
                            {/* "Tu jesteś" marker */}
                            <motion.div
                                initial={{ left: 0 }}
                                animate={{ left: `${Math.min(budgetUsedPercent, 95)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-slate-900"
                            />
                        </div>
                    </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span>Wydatki: {(spentThisMonth / 100).toFixed(0)} zł</span>
                    </div>
                    {plannedExpenses > 0 && (
                        <div className="flex items-center gap-1 text-slate-400">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span>Planowane: {(plannedExpenses / 100).toFixed(0)} zł</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

