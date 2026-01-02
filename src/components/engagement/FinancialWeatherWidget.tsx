'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { financialWeatherService } from '@/lib/engagement/financial-weather';
import { formatMoney } from '@/lib/utils';
import { Expense, Budget } from '@/types';

interface FinancialWeatherWidgetProps {
    expenses: Expense[];
    budgets: Budget[];
    className?: string;
    compact?: boolean;
}

const RISK_CONFIG = {
    low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Niskie' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Średnie' },
    high: { color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Wysokie' },
};

export default function FinancialWeatherWidget({
    expenses,
    budgets,
    className = '',
    compact = false
}: FinancialWeatherWidgetProps) {
    // Generate forecast
    const forecast = useMemo(() => {
        return financialWeatherService.generateForecast(expenses, budgets);
    }, [expenses, budgets]);

    const riskConfig = RISK_CONFIG[forecast.riskLevel];

    // Compact version for dashboard header
    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${forecast.color} ${className}`}
            >
                <span className="text-2xl">{forecast.emoji}</span>
                <div>
                    <p className="text-sm font-medium text-white">{forecast.title}</p>
                    <p className="text-xs text-white/70">{forecast.subtitle}</p>
                </div>
            </motion.div>
        );
    }

    // Full widget
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border border-slate-700/50 ${className}`}
        >
            {/* Header with gradient */}
            <div className={`relative p-6 bg-gradient-to-br ${forecast.color}`}>
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/20 rounded-full blur-2xl" />

                <div className="relative flex items-start justify-between">
                    <div>
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            className="text-6xl mb-3"
                        >
                            {forecast.emoji}
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-1">{forecast.title}</h3>
                        <p className="text-white/80">{forecast.subtitle}</p>
                    </div>

                    {/* Risk indicator */}
                    <div className={`px-3 py-1.5 rounded-full ${riskConfig.bg} backdrop-blur-sm`}>
                        <span className={`text-xs font-medium ${riskConfig.color}`}>
                            Ryzyko: {riskConfig.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats section */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/80">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Safe to spend */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-400">Bezpieczny limit</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            {formatMoney(forecast.safeToSpend)}
                        </p>
                    </motion.div>

                    {/* Expected spending */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-slate-400">Prognoza</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            ~{formatMoney(forecast.expectedSpending)}
                        </p>
                    </motion.div>
                </div>

                {/* Advice */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-slate-800/30 to-slate-800/10 border border-slate-700/30"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <AlertCircle className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200 mb-1">Rada na dziś</p>
                            <p className="text-sm text-slate-400">{forecast.advice}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Upcoming expenses if any */}
                {forecast.upcomingExpenses.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4"
                    >
                        <p className="text-xs text-slate-500 mb-2">Nadchodzące wydatki:</p>
                        <div className="space-y-2">
                            {forecast.upcomingExpenses.map((expense, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">{expense.name}</span>
                                    <span className="text-white font-medium">
                                        {formatMoney(expense.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
