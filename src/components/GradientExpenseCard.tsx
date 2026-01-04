'use client';

import { motion, PanInfo } from 'framer-motion';
import { Trash2, Pencil, Camera, CreditCard, RefreshCw } from 'lucide-react';
import { Expense } from '@/types';
import { getMerchantIcon, cleanMerchantName, CATEGORY_GRADIENTS } from '@/lib/merchant-icons';
import { useHaptic } from '@/hooks/use-haptic';
import { useCurrency } from '@/hooks/use-language';

// Source badge configs
const SOURCE_BADGES = {
    manual: { icon: Pencil, color: 'bg-amber-500', label: 'Ręcznie' },
    scan: { icon: Camera, color: 'bg-emerald-500', label: 'AI' },
    import: { icon: CreditCard, color: 'bg-blue-500', label: 'Karta' },
    recurring: { icon: RefreshCw, color: 'bg-purple-500', label: 'Cykliczna' },
} as const;

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

interface GradientExpenseCardProps {
    expense: Expense;
    onDelete?: (id: string) => void;
}

export default function GradientExpenseCard({ expense, onDelete }: GradientExpenseCardProps) {
    const { format: formatMoney } = useCurrency();
    const category = expense.merchant?.category || 'other';
    const source = expense.metadata?.source || 'manual';
    const merchantName = cleanMerchantName(expense.merchant?.name || 'Nieznany');
    const merchantIcon = getMerchantIcon(merchantName, category);
    const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.other;
    const sourceConfig = SOURCE_BADGES[source as keyof typeof SOURCE_BADGES] || SOURCE_BADGES.manual;

    const expenseDate = expense.date?.toDate?.() || new Date();
    const relativeDate = formatRelativeDate(expenseDate);

    // Handle swipe to delete
    const { trigger } = useHaptic();
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100 && onDelete) {
            trigger('medium');
            onDelete(expense.id);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, height: 0 }}
            className="relative w-full max-w-full"
        >
            {/* Delete background */}
            <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-end px-6 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-400" />
            </div>

            {/* Main card */}
            <motion.div
                drag={!!onDelete ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.3, right: 0.1 }}
                onDragEnd={handleDragEnd}
                style={{ touchAction: 'pan-y' }}
                className={`relative rounded-2xl p-3.5 overflow-hidden ${gradient} backdrop-blur-xl border border-white/10 w-full max-w-full`}
            >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="relative flex items-start justify-between">
                    {/* Left: Large emoji + name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Large emoji icon */}
                        <div className="text-3xl drop-shadow-lg shrink-0">
                            {merchantIcon}
                        </div>

                        <div className="min-w-0 flex-1">
                            {/* Merchant name */}
                            <h3 className="font-bold text-sm text-white drop-shadow-sm truncate pr-2">
                                {merchantName}
                            </h3>

                            {/* Category badge + source */}
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="px-1.5 py-0.5 bg-black/20 backdrop-blur rounded-full text-[9px] text-white/80 whitespace-nowrap">
                                    {category === 'groceries' ? 'Spożywcze' :
                                        category === 'restaurants' ? 'Jedzenie' :
                                            category === 'transport' ? 'Transport' :
                                                category === 'subscriptions' ? 'Subskrypcje' :
                                                    category === 'entertainment' ? 'Rozrywka' :
                                                        category === 'shopping' ? 'Zakupy' :
                                                            category === 'health' ? 'Zdrowie' :
                                                                category === 'education' ? 'Edukacja' :
                                                                    category === 'utilities' ? 'Opłaty' : 'Inne'}
                                </span>

                                {/* Source badge */}
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] text-white ${sourceConfig.color}/60 whitespace-nowrap`}>
                                    <sourceConfig.icon className="w-2.5 h-2.5" />
                                    {sourceConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Amount + date */}
                    <div className="text-right shrink-0 ml-2">
                        <p className="text-lg font-bold text-white drop-shadow-sm tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            -{formatMoney(expense.amount)}
                        </p>
                        <p className="text-[10px] text-white/60 mt-0.5">
                            {relativeDate}
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
