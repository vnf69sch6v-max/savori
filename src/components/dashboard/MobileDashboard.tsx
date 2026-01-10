'use client';

/**
 * MOBILE DASHBOARD v2 - COMPLETELY REBUILT
 * 
 * Design principles:
 * - 100% width container, NO horizontal scroll
 * - Fixed padding (16px sides)
 * - 2-column grid with gap, NOT flex with wrapping
 * - All text with proper truncation
 * - Touch-friendly tap targets (min 44px)
 */

import Link from 'next/link';
import {
    PiggyBank,
    Menu,
    Wallet,
    ScanLine,
    Plus,
    ShieldAlert,
    MessageSquare,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import OmniSearch from '@/components/OmniSearch';
import NotificationCenter from '@/components/NotificationCenter';
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

// Category emoji map
const CATEGORY_EMOJI: Record<string, string> = {
    groceries: '🛒',
    restaurants: '🍽️',
    transport: '🚗',
    utilities: '💡',
    entertainment: '🎬',
    shopping: '🛍️',
    health: '💊',
    education: '📚',
    subscriptions: '📱',
    other: '📦'
};

// Clean merchant name - remove bank transaction noise
function cleanMerchantName(name: string): string {
    if (!name) return 'Transaction';

    // Common patterns to clean
    const cleanPatterns = [
        /PRZY UŻYCIU KARTY\s*/gi,
        /JMP\s*S\.?A\.?\s*/gi,
        /APPLE\.COM\/BILL\s*/gi,
        /\s*\/[A-Z]{2,}\s*$/gi, // Remove trailing /KOSC etc
        /\s+/g // Multiple spaces to single
    ];

    let cleaned = name;
    cleanPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    cleaned = cleaned.trim();

    // If still too long, truncate
    if (cleaned.length > 20) {
        cleaned = cleaned.substring(0, 20) + '...';
    }

    return cleaned || 'Transaction';
}

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
    formatMoney,
    t
}: MobileDashboardProps) {
    const { openSidebar } = useUIStore();

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Calculate safe to spend
    const safeToSpend = Math.max(0, limit - spent);
    const percentUsed = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

    // Days remaining in month
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDay.getDate() - today.getDate());
    const dailySafe = safeToSpend / daysRemaining;

    // Recent transactions (max 4)
    const recentExpenses = expenses.slice(0, 4);

    // Quick action buttons
    const actions = [
        { id: 'scan', label: 'Scan', icon: ScanLine, color: '#34d399', onClick: onScanClick },
        { id: 'add', label: 'Add', icon: Plus, color: '#60a5fa', onClick: onAddClick },
        { id: 'impulse', label: 'Impulse', icon: ShieldAlert, color: '#fbbf24', onClick: onImpulseClick },
        { id: 'chat', label: 'AI', icon: MessageSquare, color: '#a78bfa', onClick: onChatClick },
    ];

    return (
        <div className="w-full px-4 pb-28 overflow-x-hidden">

            {/* ===== HEADER ===== */}
            <header className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Savori</span>
                </div>
                <div className="flex items-center gap-2">
                    <OmniSearch />
                    <NotificationCenter />
                    <button
                        onClick={openSidebar}
                        className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center"
                    >
                        <Menu className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </header>

            {/* ===== SAFE TO SPEND CARD ===== */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 rounded-2xl p-4 border border-emerald-500/20 mb-4">
                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Safe to Spend</span>
                </div>

                {/* Main amount */}
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                    {formatMoney(safeToSpend)}
                </div>
                <div className="text-sm text-slate-500 mb-4">
                    ~{formatMoney(Math.round(dailySafe))} daily
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Budget</span>
                    <span>Spent: {formatMoney(spent)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-rose-500' :
                                percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                        style={{ width: `${percentUsed}%` }}
                    />
                </div>
            </div>

            {/* ===== QUICK ACTIONS GRID (2x2) ===== */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={action.onClick}
                        className="flex flex-col items-center justify-center py-4 rounded-xl border border-white/10 active:scale-95 transition-transform"
                        style={{ backgroundColor: `${action.color}15` }}
                    >
                        <action.icon
                            className="w-6 h-6 mb-2"
                            style={{ color: action.color }}
                            strokeWidth={2}
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: action.color }}
                        >
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* ===== RECENT TRANSACTIONS ===== */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Recent transactions</h2>
                <Link
                    href="/expenses"
                    className="text-xs text-emerald-400 flex items-center gap-1"
                >
                    See all <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-2">
                {recentExpenses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No transactions yet
                    </div>
                ) : (
                    recentExpenses.map((expense) => {
                        const category = expense.merchant?.category || 'other';
                        const emoji = CATEGORY_EMOJI[category] || '📦';
                        const name = cleanMerchantName(expense.merchant?.name || '');

                        return (
                            <div
                                key={expense.id}
                                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5"
                            >
                                {/* Emoji */}
                                <span className="text-xl flex-shrink-0">{emoji}</span>

                                {/* Name - with proper truncation */}
                                <span className="flex-1 text-sm text-white truncate min-w-0">
                                    {name}
                                </span>

                                {/* Amount */}
                                <span className="text-sm font-medium text-white flex-shrink-0">
                                    -{formatMoney(expense.amount)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ===== PRO UPGRADE BANNER ===== */}
            {!isPro && (
                <Link href="/subscriptions" className="block mt-5">
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400">
                            Unlock Pro for spending forecasts
                        </span>
                    </div>
                </Link>
            )}
        </div>
    );
}
