'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatMoney, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/utils';
import { ExpenseCategory } from '@/types';

interface EnrichedTransactionProps {
    id: string;
    merchantName: string;
    category: ExpenseCategory;
    amount: number;
    date: Date;
    isRecurring?: boolean;
    frequency?: number; // How many times this month
    context?: string; // e.g., "3rd visit this week"
}

// Merchant logo mapping (can be expanded)
const MERCHANT_LOGOS: Record<string, string> = {
    'McDonald\'s': '🍔',
    'KFC': '🍗',
    'Starbucks': '☕',
    'Żabka': '🐸',
    'Biedronka': '🐞',
    'Lidl': '🛒',
    'Auchan': '🛒',
    'Orlen': '⛽',
    'BP': '⛽',
    'Shell': '⛽',
    'Netflix': '📺',
    'Spotify': '🎵',
    'Uber': '🚗',
    'Bolt': '⚡',
    'Allegro': '📦',
    'Amazon': '📦',
};

function getMerchantEmoji(merchantName: string, category: ExpenseCategory): string {
    // Check for known merchants
    for (const [merchant, emoji] of Object.entries(MERCHANT_LOGOS)) {
        if (merchantName.toLowerCase().includes(merchant.toLowerCase())) {
            return emoji;
        }
    }
    // Fallback to category icon
    return CATEGORY_ICONS[category] || '📦';
}

export default function EnrichedTransaction({
    id,
    merchantName,
    category,
    amount,
    date,
    isRecurring,
    frequency,
    context
}: EnrichedTransactionProps) {
    const emoji = getMerchantEmoji(merchantName, category);
    const categoryLabel = CATEGORY_LABELS[category] || 'Inne';
    const categoryColor = CATEGORY_COLORS[category] || '#64748b';

    // Format relative time
    const formatRelativeDate = (d: Date): string => {
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours < 1) return 'Przed chwilą';
            return `${hours}h temu`;
        }
        if (days === 1) return 'Wczoraj';
        if (days < 7) return `${days} dni temu`;
        return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            className="group relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-700/50"
        >
            {/* Merchant Logo/Emoji */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${categoryColor}20` }}
            >
                {emoji}
            </div>

            {/* Transaction Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{merchantName}</p>
                    {isRecurring && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded-full">
                            Stałe
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                            backgroundColor: `${categoryColor}15`,
                            color: categoryColor
                        }}
                    >
                        {categoryLabel}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeDate(date)}</span>
                    {context && (
                        <>
                            <span>•</span>
                            <span className="text-amber-400">{context}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right">
                <p className="font-semibold text-rose-400">
                    -{formatMoney(amount)}
                </p>
                {frequency && frequency > 1 && (
                    <p className="text-[10px] text-slate-500">
                        {frequency}x w tym miesiącu
                    </p>
                )}
            </div>

            {/* Hover action hint */}
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-xs text-slate-400">→</span>
                </div>
            </div>
        </motion.div>
    );
}

// Helper to analyze transaction context
export function getTransactionContext(
    merchantName: string,
    allExpenses: Array<{ merchant?: { name: string }; date: any }>
): { frequency: number; context?: string } {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count visits this week
    const weeklyVisits = allExpenses.filter(e => {
        if (e.merchant?.name !== merchantName) return false;
        const expenseDate = typeof e.date?.toDate === 'function'
            ? e.date.toDate()
            : new Date(e.date);
        return expenseDate >= weekAgo;
    }).length;

    // Count visits this month
    const monthlyVisits = allExpenses.filter(e => {
        if (e.merchant?.name !== merchantName) return false;
        const expenseDate = typeof e.date?.toDate === 'function'
            ? e.date.toDate()
            : new Date(e.date);
        return expenseDate >= monthStart;
    }).length;

    let context: string | undefined;
    if (weeklyVisits >= 3) {
        context = `${weeklyVisits}. wizyta w tym tygodniu`;
    } else if (monthlyVisits >= 5) {
        context = `Częsty zakup`;
    }

    return { frequency: monthlyVisits, context };
}
