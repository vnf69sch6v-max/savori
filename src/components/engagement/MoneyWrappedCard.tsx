'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Calendar, TrendingUp } from 'lucide-react';
import { wrappedService, MoneyWrapped } from '@/lib/engagement/wrapped';
import MoneyWrappedModal from './MoneyWrappedModal';
import { Expense } from '@/types';
import { formatMoney } from '@/lib/utils';

interface MoneyWrappedCardProps {
    expenses: Expense[];
    className?: string;
    compact?: boolean;
}

export default function MoneyWrappedCard({ expenses, className = '', compact = false }: MoneyWrappedCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [wrapped, setWrapped] = useState<MoneyWrapped | null>(null);

    const handleOpen = (selectedMode: 'month' | 'week') => {
        const generated = selectedMode === 'month'
            ? wrappedService.generateMonthlyWrapped(expenses)
            : wrappedService.generateWeeklyPulse(expenses);
        setWrapped(generated);
        setIsOpen(true);
    };

    // Quick preview stats
    const monthlyWrapped = wrappedService.generateMonthlyWrapped(expenses);

    if (compact) {
        return (
            <>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpen('month')}
                    className={`relative min-w-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 p-3 h-full flex flex-col justify-between ${className}`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/20">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold text-white/90">Wrapped</span>
                    </div>

                    <div>
                        <p className="text-lg font-bold text-white leading-tight">
                            {formatMoney(monthlyWrapped.totalSpent)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {monthlyWrapped.totalTransactions} transakcji
                        </p>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-purple-400 text-[10px] font-medium">
                        <span>Zobacz teraz</span>
                        <Play className="w-2.5 h-2.5" />
                    </div>
                </motion.div>

                {isOpen && wrapped && (
                    <MoneyWrappedModal
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        wrapped={wrapped}
                    />
                )}
            </>
        );
    }

    // Full widget logic continues here...
    const weeklyWrapped = wrappedService.generateWeeklyPulse(expenses);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/20 p-6 ${className}`}
            >
                {/* Background effects */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

                {/* Header */}
                <div className="relative flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white">Money Wrapped</h3>
                        <p className="text-sm text-slate-400">Twoje podsumowanie finansowe</p>
                    </div>
                </div>

                {/* Two cards: Monthly and Weekly */}
                <div className="relative grid grid-cols-2 gap-3">
                    {/* Monthly Card */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpen('month')}
                        className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-600/10 border border-purple-500/30 text-left group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-purple-300 font-medium">Miesiąc</span>
                        </div>

                        <p className="text-xl font-bold text-white mb-1">
                            {formatMoney(monthlyWrapped.totalSpent)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {monthlyWrapped.totalTransactions} transakcji
                        </p>

                        <div className="flex items-center gap-1 mt-3 text-purple-400">
                            <Play className="w-4 h-4" />
                            <span className="text-xs font-medium">Zobacz</span>
                        </div>
                    </motion.button>

                    {/* Weekly Card */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpen('week')}
                        className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-cyan-600/30 to-cyan-600/10 border border-cyan-500/30 text-left group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-cyan-300 font-medium">Tydzień</span>
                        </div>

                        <p className="text-xl font-bold text-white mb-1">
                            {formatMoney(weeklyWrapped.totalSpent)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {weeklyWrapped.totalTransactions} transakcji
                        </p>

                        <div className="flex items-center gap-1 mt-3 text-cyan-400">
                            <Play className="w-4 h-4" />
                            <span className="text-xs font-medium">Pulse</span>
                        </div>
                    </motion.button>
                </div>

                {/* Hint */}
                <p className="relative text-xs text-slate-500 text-center mt-4">
                    Kliknij aby zobaczyć pełne podsumowanie w stylu Stories
                </p>
            </motion.div>

            {/* Modal */}
            {wrapped && (
                <MoneyWrappedModal
                    key={wrapped.periodLabel}
                    wrapped={wrapped}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
