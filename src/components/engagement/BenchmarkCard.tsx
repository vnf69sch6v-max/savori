'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Sparkles, ChevronRight } from 'lucide-react';
import { formatMoney, CATEGORY_ICONS } from '@/lib/utils';
import { BenchmarkSummary, BenchmarkResult } from '@/lib/engagement/benchmarks';

interface BenchmarkCardProps {
    benchmark: BenchmarkSummary;
    onViewDetails?: () => void;
}

const STATUS_CONFIG = {
    excellent: {
        color: 'from-emerald-500/20 to-emerald-500/5',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'Doskonale',
        icon: '🏆',
    },
    good: {
        color: 'from-blue-500/20 to-blue-500/5',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        label: 'Dobrze',
        icon: '👍',
    },
    average: {
        color: 'from-amber-500/20 to-amber-500/5',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Średnio',
        icon: '📊',
    },
    high: {
        color: 'from-rose-500/20 to-rose-500/5',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        label: 'Wysoko',
        icon: '⚠️',
    },
};

// Individual category benchmark bar
function CategoryBenchmarkBar({ result, index }: { result: BenchmarkResult; index: number }) {
    const config = STATUS_CONFIG[result.status];
    const icon = CATEGORY_ICONS[result.category] || '📦';

    // Calculate bar width relative to highest (average or user)
    const maxAmount = Math.max(result.userAmount, result.avgAmount);
    const userWidth = maxAmount > 0 ? (result.userAmount / maxAmount) * 100 : 0;
    const avgWidth = maxAmount > 0 ? (result.avgAmount / maxAmount) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
            className="group"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-slate-200">{result.categoryLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">
                        {formatMoney(result.userAmount)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.text} bg-white/5`}>
                        {result.percentile}%
                    </span>
                </div>
            </div>

            {/* Double bar visualization */}
            <div className="relative h-6 bg-slate-800/50 rounded-lg overflow-hidden">
                {/* Average marker line */}
                <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `${avgWidth}%` }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 z-10"
                />

                {/* User bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userWidth}%` }}
                    transition={{ delay: index * 0.05 + 0.1, duration: 0.6, ease: 'easeOut' }}
                    className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${config.color} ${config.border} border`}
                />

                {/* Labels inside bar */}
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px]">
                    <span className="text-white/70">Ty</span>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.5 }}
                        className="text-slate-500"
                    >
                        Średnia: {formatMoney(result.avgAmount)}
                    </motion.span>
                </div>
            </div>

            {/* Insight text */}
            {result.potentialSavings > 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                    className="text-xs text-slate-500 mt-1 pl-7"
                >
                    💡 Potencjał: -{formatMoney(result.potentialSavings)}/msc
                </motion.p>
            )}
        </motion.div>
    );
}

export default function BenchmarkCard({ benchmark, onViewDetails }: BenchmarkCardProps) {
    const overallStatus = benchmark.overallPercentile <= 25 ? 'excellent'
        : benchmark.overallPercentile <= 50 ? 'good'
            : benchmark.overallPercentile <= 75 ? 'average'
                : 'high';

    const config = STATUS_CONFIG[overallStatus];

    // Show top 4 categories with highest potential savings
    const topCategories = benchmark.categories
        .filter(c => c.userAmount > 0)
        .slice(0, 4);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 p-6"
        >
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-lg">Jak wypadasz?</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                        Porównanie z użytkownikami w Twojej grupie wiekowej
                    </p>
                </div>

                {/* Overall percentile badge */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl bg-gradient-to-br ${config.color} ${config.border} border`}
                >
                    <span className="text-2xl">{config.icon}</span>
                    <span className={`text-xs font-medium ${config.text}`}>
                        Top {100 - benchmark.overallPercentile}%
                    </span>
                </motion.div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                    <p className="text-xs text-slate-500 mb-1">Twoje wydatki</p>
                    <p className="text-xl font-bold text-white">
                        {formatMoney(benchmark.totalUserSpending)}
                        <span className="text-sm font-normal text-slate-400">/msc</span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                    <p className="text-xs text-slate-500 mb-1">Średnia grupy</p>
                    <p className="text-xl font-bold text-slate-300">
                        {formatMoney(benchmark.totalAvgSpending)}
                        <span className="text-sm font-normal text-slate-500">/msc</span>
                    </p>
                </motion.div>
            </div>

            {/* Potential savings highlight */}
            {benchmark.yearlyPotentialSavings > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-300 font-medium">
                                Potencjalne oszczędności
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {formatMoney(benchmark.yearlyPotentialSavings)}
                                <span className="text-sm font-normal text-slate-400">/rok</span>
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Gdybyś osiągnął poziom top 25% użytkowników w każdej kategorii
                    </p>
                </motion.div>
            )}

            {/* Category breakdown */}
            <div className="space-y-4 mb-4">
                <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Kategorie z największym potencjałem
                </p>
                {topCategories.map((result, index) => (
                    <CategoryBenchmarkBar key={result.category} result={result} index={index} />
                ))}
            </div>

            {/* View details button */}
            {onViewDetails && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewDetails}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all group"
                >
                    <span className="text-sm font-medium">Zobacz wszystkie kategorie</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            )}
        </motion.div>
    );
}
