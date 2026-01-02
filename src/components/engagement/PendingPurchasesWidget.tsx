'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, AlertTriangle, TrendingDown, Sparkles } from 'lucide-react';
import { PendingPurchase, prePurchasePauseService, PauseStats } from '@/lib/engagement/pre-purchase-pause';
import { formatMoney, CATEGORY_ICONS } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PendingPurchaseCardProps {
    purchase: PendingPurchase;
    onApprove: (id: string) => void;
    onCancel: (id: string) => void;
}

// Individual pending purchase card
function PendingPurchaseItem({ purchase, onApprove, onCancel }: PendingPurchaseCardProps) {
    const [timeRemaining, setTimeRemaining] = useState(
        prePurchasePauseService.formatTimeRemaining(purchase)
    );
    const [isExpired, setIsExpired] = useState(() =>
        prePurchasePauseService.getTimeRemaining(purchase).expired
    );

    // Update countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const { expired } = prePurchasePauseService.getTimeRemaining(purchase);
            setTimeRemaining(prePurchasePauseService.formatTimeRemaining(purchase));
            setIsExpired(expired);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [purchase]);

    const icon = purchase.category ? CATEGORY_ICONS[purchase.category] : '🛒';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`relative overflow-hidden p-4 rounded-xl border ${isExpired
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30'
                : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50'
                }`}
        >
            {/* Pulsing indicator for expired */}
            {isExpired && (
                <div className="absolute top-2 right-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </span>
                </div>
            )}

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl">{icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{purchase.description}</p>
                    </div>

                    <p className="text-xl font-bold text-white mb-2">
                        {formatMoney(purchase.amount)}
                    </p>

                    {/* Timer or decision prompt */}
                    {isExpired ? (
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Nadal chcesz to kupić?</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Pozostało: {timeRemaining}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action buttons - only show when expired */}
            {isExpired && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 mt-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCancel(purchase.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Nie kupuję
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onApprove(purchase.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        Kupuję
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
    );
}

// Main widget showing all pending purchases
interface PendingPurchasesWidgetProps {
    className?: string;
}

export default function PendingPurchasesWidget({ className = '' }: PendingPurchasesWidgetProps) {
    const { userData } = useAuth();
    const [purchases, setPurchases] = useState<PendingPurchase[]>([]);
    const [stats, setStats] = useState<PauseStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch pending purchases
    useEffect(() => {
        if (!userData?.id) return;

        const fetchData = async () => {
            try {
                const [pendingData, statsData] = await Promise.all([
                    prePurchasePauseService.getPendingPurchases(userData.id),
                    prePurchasePauseService.getPauseStats(userData.id),
                ]);
                setPurchases(pendingData);
                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch pending purchases:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData?.id]);

    // Handle approve
    const handleApprove = async (id: string) => {
        if (!userData?.id) return;

        try {
            await prePurchasePauseService.approvePurchase(userData.id, id);
            setPurchases(prev => prev.filter(p => p.id !== id));
            toast.success('Zakup zatwierdzony');
        } catch (error) {
            console.error('Failed to approve:', error);
            toast.error('Błąd podczas zatwierdzania');
        }
    };

    // Handle cancel
    const handleCancel = async (id: string) => {
        if (!userData?.id) return;

        const purchase = purchases.find(p => p.id === id);

        try {
            await prePurchasePauseService.cancelPurchase(userData.id, id);
            setPurchases(prev => prev.filter(p => p.id !== id));

            if (purchase) {
                toast.success(
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Zaoszczędzono {formatMoney(purchase.amount)}!</span>
                    </div>
                );
            }

            // Refresh stats
            const newStats = await prePurchasePauseService.getPauseStats(userData.id);
            setStats(newStats);
        } catch (error) {
            console.error('Failed to cancel:', error);
            toast.error('Błąd podczas anulowania');
        }
    };

    // Don't render if no pending purchases and no stats
    if (!loading && purchases.length === 0 && (!stats || stats.totalPaused === 0)) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-700/50 p-6 ${className}`}
        >
            {/* Background */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Pre-Purchase Pause</h3>
                        <p className="text-xs text-slate-400">Przemyśl przed zakupem</p>
                    </div>
                </div>

                {/* Stats badge */}
                {stats && stats.moneySaved > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">
                            {formatMoney(stats.moneySaved)} saved
                        </span>
                    </div>
                )}
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
                    ))}
                </div>
            ) : purchases.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {purchases.map(purchase => (
                            <PendingPurchaseItem
                                key={purchase.id}
                                purchase={purchase}
                                onApprove={handleApprove}
                                onCancel={handleCancel}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                /* Empty state with stats */
                stats && (
                    <div className="text-center py-4">
                        <p className="text-slate-400 text-sm mb-3">
                            Brak oczekujących zakupów
                        </p>
                        {stats.cancelRate > 0 && (
                            <p className="text-xs text-slate-500">
                                {stats.cancelRate}% Twoich dużych zakupów zostało anulowanych po przemyśleniu
                            </p>
                        )}
                    </div>
                )
            )}

            {/* Info footer */}
            <div className="relative mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center">
                    Zakupy powyżej {formatMoney(prePurchasePauseService.getThreshold())} mają 24h pauzy na przemyślenie
                </p>
            </div>
        </motion.div>
    );
}
