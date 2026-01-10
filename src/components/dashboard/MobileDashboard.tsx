'use client';

/**
 * ULTRA MINIMAL MOBILE DASHBOARD
 * - No complex flex/grid layouts
 * - Fixed pixel spacing (no relative units that can cascade)
 * - Each section is a simple block
 * - All widths constrained to 100%
 */

import Link from 'next/link';
import { PiggyBank, Menu, Wallet, ScanLine, Plus, ShieldAlert, MessageSquare, ChevronRight } from 'lucide-react';
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div style={{ width: 24, height: 24, border: '2px solid #34d399', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const safeToSpend = limit - spent;
    const percentageUsed = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, lastDay.getDate() - today.getDate());
    const dailySafe = safeToSpend / daysRemaining;

    const displayExpenses = expenses.slice(0, 3);

    const categoryEmojis: Record<string, string> = {
        groceries: '🛒', restaurants: '🍽️', transport: '🚗', utilities: '💡',
        entertainment: '🎬', shopping: '🛍️', health: '💊', education: '📚',
        subscriptions: '📱', other: '📦'
    };

    return (
        <div style={{
            paddingTop: 0,
            paddingBottom: 100,
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: '100%',
            overflowX: 'hidden'
        }}>

            {/* === HEADER === */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 36, height: 36,
                        backgroundColor: '#34d399',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <PiggyBank style={{ width: 20, height: 20, color: 'white' }} />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Savori</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OmniSearch />
                    <NotificationCenter />
                    <button
                        onClick={openSidebar}
                        style={{
                            width: 36, height: 36,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Menu style={{ width: 16, height: 16, color: '#94a3b8' }} />
                    </button>
                </div>
            </div>

            {/* === SPEND CARD === */}
            <div style={{
                backgroundColor: '#003c3c',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Wallet style={{ width: 14, height: 14, color: '#34d399' }} />
                    <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Bezpiecznie do wydania
                    </span>
                </div>

                {/* Amount */}
                <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                    {formatMoney(safeToSpend)}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                    ~{formatMoney(dailySafe).replace(/,00.*$/, '')} dziennie
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                    <span>Budżet</span>
                    <span>{Math.round(percentageUsed)}%</span>
                </div>
                <div style={{
                    height: 6,
                    backgroundColor: '#1e293b',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 8
                }}>
                    <div style={{
                        width: `${percentageUsed}%`,
                        height: '100%',
                        backgroundColor: percentageUsed > 90 ? '#f87171' : '#34d399',
                        borderRadius: 3,
                        transition: 'width 0.5s ease'
                    }} />
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#f87171' }}>Wydane: {formatMoney(spent)}</span>
                    <span style={{ color: '#64748b' }}>Limit: {formatMoney(limit)}</span>
                </div>
            </div>

            {/* === QUICK ACTIONS (2x2 GRID) === */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 16,
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {[
                    { label: 'Skanuj', icon: ScanLine, color: '#34d399', bg: 'rgba(52,211,153,0.1)', onClick: onScanClick },
                    { label: 'Dodaj', icon: Plus, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', onClick: onAddClick },
                    { label: 'Impuls', icon: ShieldAlert, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', onClick: onImpulseClick },
                    { label: 'Czat AI', icon: MessageSquare, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', onClick: onChatClick },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '14px 0',
                            backgroundColor: action.bg,
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            cursor: 'pointer'
                        }}
                    >
                        <action.icon style={{ width: 20, height: 20, color: action.color, marginBottom: 4 }} />
                        <span style={{ fontSize: 11, color: action.color }}>{action.label}</span>
                    </button>
                ))}
            </div>

            {/* === TRANSACTIONS HEADER === */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
            }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>Ostatnie transakcje</span>
                <Link href="/expenses" style={{
                    fontSize: 11,
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                }}>
                    Wszystkie <ChevronRight style={{ width: 12, height: 12, marginLeft: 2 }} />
                </Link>
            </div>

            {/* === TRANSACTIONS LIST === */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayExpenses.map(expense => {
                    const category = expense.merchant?.category || 'other';
                    const merchantName = expense.merchant?.name || 'Transakcja';

                    return (
                        <div
                            key={expense.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 12,
                                backgroundColor: 'rgba(30,41,59,0.5)',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{categoryEmojis[category] || '📦'}</span>
                                <span style={{
                                    fontSize: 13,
                                    color: 'white',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {merchantName}
                                </span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'white', flexShrink: 0, marginLeft: 8 }}>
                                -{formatMoney(expense.amount)}
                            </span>
                        </div>
                    );
                })}
                {displayExpenses.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>
                        Brak transakcji
                    </div>
                )}
            </div>

            {/* === PRO BANNER === */}
            {!isPro && (
                <Link href="/subscriptions" style={{ textDecoration: 'none' }}>
                    <div style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 12,
                        background: 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(20,184,166,0.15))',
                        border: '1px solid rgba(52,211,153,0.3)',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: 11, color: '#34d399' }}>✨ Odblokuj Pro i zobacz prognozę wydatków</span>
                    </div>
                </Link>
            )}
        </div>
    );
}
