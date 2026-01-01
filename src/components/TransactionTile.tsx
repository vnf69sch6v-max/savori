'use client';

import { motion, PanInfo } from 'framer-motion';
import { Trash2, Edit3, Pencil, Camera, CreditCard, RefreshCw, Link2 } from 'lucide-react';
import { Expense } from '@/types';
import { formatMoney, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils';

// Source type configuration
const SOURCE_CONFIG = {
    manual: { icon: Pencil, label: 'Ręcznie', color: 'amber', emoji: '✏️' },
    scan: { icon: Camera, label: 'Skan AI', color: 'emerald', emoji: '📷' },
    import: { icon: Link2, label: 'Import', color: 'slate', emoji: '🔗' },
    card: { icon: CreditCard, label: 'Karta', color: 'blue', emoji: '💳' },
    recurring: { icon: RefreshCw, label: 'Cykliczna', color: 'purple', emoji: '🔄' },
} as const;

// BLIK badge component
const BlikBadge = () => (
    <div className="flex items-center gap-0.5">
        <div className="w-3 h-3 rounded-sm bg-[#e52329] flex items-center justify-center">
            <span className="text-[6px] font-bold text-white">B</span>
        </div>
        <span>BLIK</span>
    </div>
);

// Format relative date
function formatRelativeDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) {
        const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        return days[date.getDay()];
    }

    const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Clean merchant name (enrichment)
function cleanMerchantName(name: string): string {
    if (!name) return 'Nieznany';

    // Common Polish merchant patterns
    const cleanups = [
        /\s*sp\.?\s*z\s*o\.?o\.?/gi,
        /\s*s\.?a\.?$/gi,
        /\s*polska?\s*/gi,
        /\s*\d{5,}/g, // Remove long numbers
        /\s+ul\.?\s+[\w\s]+\d*/gi, // Remove addresses
        /\s+\d+\s*$/g, // Trailing numbers
        /\s{2,}/g, // Multiple spaces
    ];

    let cleaned = name;
    for (const pattern of cleanups) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // Capitalize first letter of each word
    cleaned = cleaned.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    // Known brand fixes
    const brandFixes: Record<string, string> = {
        'Zabka': 'Żabka',
        'Mcdonalds': "McDonald's",
        'Mcdonald': "McDonald's",
        'Kfc': 'KFC',
        'Lidl': 'Lidl',
        'Biedronka': 'Biedronka',
        'Orlen': 'Orlen',
    };

    for (const [from, to] of Object.entries(brandFixes)) {
        if (cleaned.toLowerCase().includes(from.toLowerCase())) {
            cleaned = to;
        }
    }

    return cleaned || 'Nieznany';
}

interface TransactionTileProps {
    expense: Expense;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    showDate?: boolean;
}

export default function TransactionTile({
    expense,
    onDelete,
    onEdit,
    showDate = true
}: TransactionTileProps) {
    const category = expense.merchant?.category || 'other';
    const source = expense.metadata?.source || 'manual';
    const sourceConfig = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG] || SOURCE_CONFIG.manual;

    // Determine if BLIK (would come from payment method field)
    const isBlik = expense.metadata?.paymentMethod === 'blik';

    // Format date
    const expenseDate = expense.date?.toDate?.() || new Date();
    const relativeDate = showDate ? formatRelativeDate(expenseDate) : '';

    // Clean merchant name
    const merchantName = cleanMerchantName(expense.merchant?.name || '');

    // Handle swipe to delete
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100 && onDelete) {
            onDelete(expense.id);
        }
    };

    return (
        <motion.div
            layout
            className="relative"
        >
            {/* Delete background */}
            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-end px-4 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-500" />
            </div>

            {/* Main content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.5, right: 0.1 }}
                onDragEnd={handleDragEnd}
                className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 z-10 border border-slate-700/50"
                style={{ touchAction: 'pan-y' }}
            >
                <div className="flex items-center gap-4">
                    {/* Zone A: Avatar with source badge */}
                    <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl`}>
                            {CATEGORY_ICONS[category] || '📦'}
                        </div>

                        {/* Source badge on avatar */}
                        {source === 'manual' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                                <Pencil className="w-2.5 h-2.5 text-amber-400" />
                            </div>
                        )}
                        {source === 'scan' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                                <Camera className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                        )}
                    </div>

                    {/* Zone B: Text content */}
                    <div className="flex-1 min-w-0">
                        {/* Merchant name */}
                        <p className="font-semibold text-white truncate">
                            {merchantName}
                        </p>

                        {/* Metadata line: Category • Source • Date */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span>{CATEGORY_LABELS[category] || 'Inne'}</span>
                            <span className="text-slate-600">•</span>

                            {/* Source indicator */}
                            {isBlik ? (
                                <BlikBadge />
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span>{sourceConfig.emoji}</span>
                                    <span>{sourceConfig.label}</span>
                                </span>
                            )}

                            {relativeDate && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <span>{relativeDate}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Zone C: Amount */}
                    <div className="text-right shrink-0">
                        <p
                            className="font-semibold text-white tabular-nums"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                            -{formatMoney(expense.amount)}
                        </p>

                        {/* Status badge (if pending) */}
                        {expense.metadata?.pending && (
                            <span className="text-[10px] text-amber-400">Oczekująca</span>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Export helper functions for use elsewhere
export { formatRelativeDate, cleanMerchantName };
