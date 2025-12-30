'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatMoney, formatDate, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils';
import { Expense } from '@/types';

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
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {formatDate(new Date(dateStr), 'long')}
                                </span>
                            </div>
                            <span className="text-sm text-slate-500">
                                {formatMoney(dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                            </span>
                        </div>

                        <Card className="divide-y divide-slate-700/50 overflow-hidden">
                            <AnimatePresence mode='popLayout'>
                                {dayExpenses.map((expense) => (
                                    <ExpenseItem
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function ExpenseItem({ expense, onDelete }: { expense: Expense; onDelete: (id: string) => void }) {
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100) {
            onDelete(expense.id);
        }
    };

    return (
        <motion.div
            layout
            exit={{ height: 0, opacity: 0 }}
            className="relative"
        >
            {/* Background with trash icon */}
            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-end px-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
            </div>

            {/* Foreground content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.5, right: 0.1 }} // Allow dragging left (delete) but resist right
                onDragEnd={handleDragEnd}
                className="relative bg-slate-900 flex items-center gap-4 p-4 z-10"
                style={{ touchAction: 'pan-y' }} // Allow vertical scrolling
                whileDrag={{ x: -50 }} // Visual feedback while dragging
            >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {CATEGORY_ICONS[expense.merchant?.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expense.merchant?.name || 'Nieznany'}</p>
                    <p className="text-sm text-slate-400">
                        {CATEGORY_LABELS[expense.merchant?.category] || 'Inne'}
                        {expense.items && expense.items.length > 0 && (
                            <span className="ml-2 text-slate-500">
                                • {expense.items.length} produktów
                            </span>
                        )}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-medium text-rose-400">
                        -{formatMoney(expense.amount)}
                    </p>
                    {expense.metadata?.source === 'scan' && (
                        <span className="text-xs text-emerald-400">AI</span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
