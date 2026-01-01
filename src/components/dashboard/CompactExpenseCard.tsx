'use client';

import { motion, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Expense } from '@/types';
import { formatMoney } from '@/lib/utils';
import { getMerchantIcon, cleanMerchantName } from '@/lib/merchant-icons';

// Category colors for left border
const CATEGORY_COLORS: Record<string, string> = {
    groceries: 'bg-emerald-500',
    restaurants: 'bg-orange-500',
    transport: 'bg-blue-500',
    utilities: 'bg-yellow-500',
    entertainment: 'bg-purple-500',
    shopping: 'bg-pink-500',
    health: 'bg-red-500',
    education: 'bg-indigo-500',
    subscriptions: 'bg-violet-500',
    other: 'bg-slate-500',
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
    groceries: 'Spożywcze',
    restaurants: 'Jedzenie',
    transport: 'Transport',
    utilities: 'Opłaty',
    entertainment: 'Rozrywka',
    shopping: 'Zakupy',
    health: 'Zdrowie',
    education: 'Edukacja',
    subscriptions: 'Subskrypcje',
    other: 'Inne',
};

// Source icons and labels
const SOURCE_CONFIG: Record<string, { emoji: string; label: string }> = {
    manual: { emoji: '✏️', label: 'Ręcznie' },
    scan: { emoji: '📷', label: 'AI' },
    import: { emoji: '💳', label: 'Karta' },
    card: { emoji: '💳', label: 'Karta' },
    blik: { emoji: '🅱️', label: 'BLIK' },
    recurring: { emoji: '🔄', label: 'Cykliczna' },
};

// Format relative date
function formatRelativeDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) {
        const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
        return days[date.getDay()];
    }

    const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

interface CompactExpenseCardProps {
    expense: Expense;
    onDelete?: (id: string) => void;
    showDate?: boolean;
    aiContext?: string; // e.g., "To Twoje 3. wyjście w tym tygodniu"
}

export default function CompactExpenseCard({
    expense,
    onDelete,
    showDate = true,
    aiContext
}: CompactExpenseCardProps) {
    const category = expense.merchant?.category || 'other';
    const source = expense.metadata?.source || 'manual';
    const paymentMethod = expense.metadata?.paymentMethod;

    const merchantName = cleanMerchantName(expense.merchant?.name || 'Nieznany');
    const merchantIcon = getMerchantIcon(merchantName, category);
    const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
    const categoryLabel = CATEGORY_LABELS[category] || 'Inne';

    // Get source display
    let sourceDisplay = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
    if (paymentMethod === 'blik') {
        sourceDisplay = SOURCE_CONFIG.blik;
    } else if (paymentMethod === 'card' || source === 'import') {
        sourceDisplay = SOURCE_CONFIG.card;
    }

    const expenseDate = expense.date?.toDate?.() || new Date();
    const relativeDate = formatRelativeDate(expenseDate);

    // Handle swipe to delete
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100 && onDelete) {
            onDelete(expense.id);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, height: 0 }}
            className="relative"
        >
            {/* Delete background */}
            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-end px-4 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-400" />
            </div>

            {/* Main card with colored left border */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.3, right: 0.1 }}
                onDragEnd={handleDragEnd}
                style={{ touchAction: 'pan-y' }}
                className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50"
            >
                {/* Colored left border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${categoryColor}`} />

                <div className="flex items-center gap-3 p-3 pl-4">
                    {/* Large emoji icon */}
                    <div className="text-3xl shrink-0">
                        {merchantIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Merchant name */}
                        <p className="font-semibold text-white truncate">
                            {merchantName}
                        </p>

                        {/* Meta line: Category • Source • Date */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span>{categoryLabel}</span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-0.5">
                                <span>{sourceDisplay.emoji}</span>
                                <span>{sourceDisplay.label}</span>
                            </span>
                            {showDate && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <span>{relativeDate}</span>
                                </>
                            )}
                        </div>

                        {/* AI Context if provided */}
                        {aiContext && (
                            <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                                <span>💡</span>
                                {aiContext}
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                        <p
                            className="font-bold text-white tabular-nums"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            -{formatMoney(expense.amount)}
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
