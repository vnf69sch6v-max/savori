'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, TrendingUp, Wallet, Flame, Target, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

interface ExpenseAnalysisProps {
    isOpen: boolean;
    onClose: () => void;
    expense: {
        merchant: string;
        amount: number;
        category: string;
    };
    analysis?: {
        aiComment: string;
        budgetRemaining?: number;
        streak?: number;
        xp?: number;
    };
    loading?: boolean;
}

export default function ExpenseAnalysisCard({
    isOpen,
    onClose,
    expense,
    analysis,
    loading = false,
}: ExpenseAnalysisProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                        >
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </motion.div>
                        <h3 className="text-xl font-semibold mb-1">Wydatek zapisany!</h3>
                        <p className="text-slate-400">
                            {expense.merchant} • <span className="text-rose-400">{formatMoney(expense.amount)}</span>
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                <span className="ml-3 text-slate-400">AI analizuje wydatek...</span>
                            </div>
                        ) : analysis ? (
                            <>
                                {/* AI Comment */}
                                {analysis.aiComment && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-purple-400 font-medium mb-1">AI Analysis</p>
                                                <p className="text-sm text-slate-300">{analysis.aiComment}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {analysis.budgetRemaining !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="p-3 rounded-xl bg-slate-800/50 text-center"
                                        >
                                            <Wallet className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                            <p className="text-sm font-medium">{formatMoney(analysis.budgetRemaining)}</p>
                                            <p className="text-xs text-slate-500">pozostało</p>
                                        </motion.div>
                                    )}

                                    {analysis.streak !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="p-3 rounded-xl bg-slate-800/50 text-center"
                                        >
                                            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                                            <p className="text-sm font-medium">{analysis.streak} dni</p>
                                            <p className="text-xs text-slate-500">streak 🔥</p>
                                        </motion.div>
                                    )}

                                    {analysis.xp !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="p-3 rounded-xl bg-slate-800/50 text-center"
                                        >
                                            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                                            <p className="text-sm font-medium">
                                                +{analysis.xp} XP
                                            </p>
                                            <p className="text-xs text-slate-500">zdobyte</p>
                                        </motion.div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-400 text-sm">Dodaj więcej wydatków, aby otrzymać analizę AI</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-800">
                        <Button onClick={onClose} className="w-full">
                            Kontynuuj
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
