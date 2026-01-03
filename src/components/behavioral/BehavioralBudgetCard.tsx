'use client';

/**
 * BehavioralBudgetCard
 * Apple HIG styled category card with progress ring and expand functionality
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BehavioralCategory, EmotionTag } from '@/types';
import { getCategoryMeta, getEmotionMeta, BehavioralCategoryMeta } from '@/lib/behavioral-categories';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: Date;
    emotion?: EmotionTag;
    merchantName?: string;
}

interface BehavioralBudgetCardProps {
    category: BehavioralCategory;
    spent: number;
    limit: number;
    transactions?: Transaction[];
    onTransactionClick?: (transaction: Transaction) => void;
}

export default function BehavioralBudgetCard({
    category,
    spent,
    limit,
    transactions = [],
    onTransactionClick,
}: BehavioralBudgetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const meta = getCategoryMeta(category);

    const percentage = Math.min(100, Math.round((spent / limit) * 100));
    const remaining = Math.max(0, limit - spent);
    const isOverBudget = spent > limit;

    // Progress ring calculations
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <motion.div
            layout
            className={`rounded-3xl overflow-hidden backdrop-blur-xl border transition-all ${isOverBudget
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-slate-700/50 bg-slate-800/40'
                }`}
        >
            {/* Header - Always Visible */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-5 flex items-center gap-4 text-left"
                whileTap={{ scale: 0.98 }}
            >
                {/* Progress Ring */}
                <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        {/* Background circle */}
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-slate-700/50"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="url(#gradient)"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ strokeDasharray: circumference }}
                        />
                        <defs>
                            <linearGradient id={`gradient-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" className={`text-${meta.gradient[0]}`} stopColor="currentColor" />
                                <stop offset="100%" className={`text-${meta.gradient[1]}`} stopColor="currentColor" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Emoji in center */}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                        {meta.emoji}
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg truncate">
                        {meta.name}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">
                        {meta.shortDesc}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
                            {(spent / 100).toFixed(0)} zł
                        </span>
                        <span className="text-slate-500 text-sm">
                            / {(limit / 100).toFixed(0)} zł
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </motion.button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-3">
                            {/* Remaining Badge */}
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isOverBudget
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                {isOverBudget ? (
                                    <>⚠️ Przekroczono o {(Math.abs(remaining) / 100).toFixed(0)} zł</>
                                ) : (
                                    <>💰 Zostało {(remaining / 100).toFixed(0)} zł</>
                                )}
                            </div>

                            {/* Transactions List */}
                            {transactions.length > 0 ? (
                                <div className="space-y-2">
                                    {transactions.slice(0, 5).map((tx) => (
                                        <motion.button
                                            key={tx.id}
                                            onClick={() => onTransactionClick?.(tx)}
                                            className="w-full p-3 rounded-2xl bg-slate-800/60 border border-slate-700/30
                                                     flex items-center gap-3 text-left hover:bg-slate-700/50 transition-colors"
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Emotion Badge */}
                                            {tx.emotion && (
                                                <span className="text-lg">
                                                    {getEmotionMeta(tx.emotion).emoji}
                                                </span>
                                            )}

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {tx.merchantName || tx.description}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {tx.date.toLocaleDateString('pl-PL', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                    {tx.emotion && (
                                                        <span className={`ml-2 text-${getEmotionMeta(tx.emotion).color}-400`}>
                                                            {getEmotionMeta(tx.emotion).name}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Amount */}
                                            <span className="text-sm font-semibold text-white">
                                                {(tx.amount / 100).toFixed(0)} zł
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    Brak transakcji w tej kategorii
                                </p>
                            )}

                            {/* Psych Trigger Footer */}
                            <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/30">
                                💡 {meta.psychTrigger}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
