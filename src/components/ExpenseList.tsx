'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/utils';
import { Expense } from '@/types';
import TransactionTile from './TransactionTile';

interface ExpenseListProps {
    expenses: Record<string, Expense[]>;
    onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
    return (
        <div className="space-y-6">
            <AnimatePresence mode='popLayout'>
                {Object.entries(expenses).map(([dateStr, dayExpenses], groupIndex) => (
                    <motion.div
                        key={dateStr}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        layout
                    >
                        {/* Date header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {formatDate(new Date(dateStr), 'long')}
                                </span>
                            </div>
                            <span className="text-sm text-slate-500 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatMoney(dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                            </span>
                        </div>

                        {/* Transaction tiles */}
                        <div className="space-y-2">
                            <AnimatePresence mode='popLayout'>
                                {dayExpenses.map((expense) => (
                                    <TransactionTile
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={onDelete}
                                        showDate={false}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

