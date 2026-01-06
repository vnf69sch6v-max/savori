'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    PiggyBank,
    Menu,
    Wallet,
    ScanLine,
    Plus,
    ShieldAlert,
    MessageSquare,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import OmniSearch from '@/components/OmniSearch';
import NotificationCenter from '@/components/NotificationCenter';
import { formatMoney } from '@/lib/utils';
import { Expense } from '@/types';

interface MobileDashboardProps {
    spent: number;
    limit: number;
    loading: boolean;
    expenses: Expense[];
    isPro: boolean;
    onScanClick: () => void;
    onAddClick: () => void;
    onImpulseClick: () => void;
    onChatClick: () => void;
    formatMoney: (amount: number) => string;
    t: {
        dashboard: {
            recentTransactions: string;
            seeAll: string;
        };
    };
}

// ============ INLINE COMPONENTS ============

function CompactHeader() {
    const { openSidebar } = useUIStore();

    return (
        <header className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-400 flex items-center justify-center text-white">
                    <PiggyBank className="w-5 h-5" />
                </div>
                <h1 className="font-bold text-xl text-white">Savori</h1>
            </div>
            <div className="flex gap-2 items-center">
                <OmniSearch />
                <NotificationCenter />
                <button
                    onClick={openSidebar}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400"
                >
                    <Menu className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}

interface SpendCardProps {
    spent: number;
    limit: number;
    formatMoney: (amount: number) => string;
}

function CompactSpendCard({ spent, limit, formatMoney }: SpendCardProps) {
    const safeToSpend = limit - spent;
    const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDay.getDate() - today.getDate());
    const dailySafe = safeToSpend / daysRemaining;

    return (
        <div className="bg-[#003c3c] rounded-2xl p-4 relative overflow-hidden border border-white/5">
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Bezpiecznie do wydania</span>
                </div>

                {/* Amount */}
                <h2 className="text-2xl font-bold text-emerald-400 mb-0.5">
                    {formatMoney(safeToSpend)}
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                    ~{formatMoney(dailySafe).replace(/,00..$/, '')} dziennie
                </p>

                {/* Progress */}
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Budżet</span>
                    <span>{Math.round(percentageUsed)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, percentageUsed)}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${percentageUsed > 90 ? 'bg-red-400' : 'bg-emerald-400'}`}
                    />
                </div>

                {/* Stats row */}
                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-red-400">Wydane: {formatMoney(spent)}</span>
                    <span className="text-slate-400">Limit: {formatMoney(limit)}</span>
                </div>
            </div>
        </div>
    );
}

interface QuickActionsProps {
    onScan: () => void;
    onAdd: () => void;
    onImpulse: () => void;
    onChat: () => void;
}

function QuickActions({ onScan, onAdd, onImpulse, onChat }: QuickActionsProps) {
    const actions = [
        { label: 'Skanuj', icon: ScanLine, color: 'text-emerald-400', bg: 'bg-emerald-500/10', onClick: onScan },
        { label: 'Dodaj', icon: Plus, color: 'text-blue-400', bg: 'bg-blue-500/10', onClick: onAdd },
        { label: 'Impuls', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', onClick: onImpulse },
        { label: 'Czat AI', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', onClick: onChat },
    ];

    return (
        <div className="grid grid-cols-4 gap-2">
            {actions.map((action, i) => (
                <button
                    key={i}
                    onClick={action.onClick}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl ${action.bg} border border-white/5`}
                >
                    <action.icon className={`w-5 h-5 ${action.color} mb-1`} />
                    <span className={`text-[10px] ${action.color}`}>{action.label}</span>
                </button>
            ))}
        </div>
    );
}

interface ExpenseItemProps {
    expense: Expense;
    formatMoney: (amount: number) => string;
}

function ExpenseItem({ expense, formatMoney }: ExpenseItemProps) {
    const category = expense.merchant?.category || 'other';
    const merchantName = expense.merchant?.name || 'Transakcja';

    const categoryEmojis: Record<string, string> = {
        groceries: '🛒', restaurants: '🍽️', transport: '🚗', utilities: '💡',
        entertainment: '🎬', shopping: '🛍️', health: '💊', education: '📚',
        subscriptions: '📱', other: '📦'
    };

    const categoryColors: Record<string, string> = {
        groceries: 'from-green-600/40 to-green-800/40',
        restaurants: 'from-orange-600/40 to-orange-800/40',
        transport: 'from-blue-600/40 to-blue-800/40',
        other: 'from-slate-600/40 to-slate-800/40'
    };

    return (
        <div className={`rounded-xl p-3 bg-gradient-to-r ${categoryColors[category] || categoryColors.other} border border-white/5`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl shrink-0">{categoryEmojis[category] || '📦'}</span>
                    <span className="text-sm text-white truncate">{merchantName}</span>
                </div>
                <span className="text-sm font-medium text-white shrink-0 ml-2">
                    -{formatMoney(expense.amount)}
                </span>
            </div>
        </div>
    );
}

// ============ MAIN COMPONENT ============

export default function MobileDashboard({
    spent,
    limit,
    loading,
    expenses,
    isPro,
    onScanClick,
    onAddClick,
    onImpulseClick,
    onChatClick,
    formatMoney: formatMoneyFn,
    t
}: MobileDashboardProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const displayExpenses = expenses.slice(0, 3);

    return (
        <div className="flex flex-col gap-3 px-4 pb-24">
            <CompactHeader />

            <CompactSpendCard
                spent={spent}
                limit={limit}
                formatMoney={formatMoneyFn}
            />

            <QuickActions
                onScan={onScanClick}
                onAdd={onAddClick}
                onImpulse={onImpulseClick}
                onChat={onChatClick}
            />

            {/* Transactions Section */}
            <div className="flex items-center justify-between mt-1">
                <h2 className="text-sm font-medium text-white">Ostatnie transakcje</h2>
                <Link href="/expenses" className="text-xs text-emerald-400 flex items-center gap-0.5">
                    Wszystkie <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="flex flex-col gap-2">
                {displayExpenses.map(expense => (
                    <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        formatMoney={formatMoneyFn}
                    />
                ))}
                {displayExpenses.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">Brak transakcji</p>
                )}
            </div>

            {!isPro && (
                <Link href="/subscriptions">
                    <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-center">
                        <p className="text-xs text-emerald-400">✨ Odblokuj Pro i zobacz prognozę wydatków</p>
                    </div>
                </Link>
            )}
        </div>
    );
}
