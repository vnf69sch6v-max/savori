'use client';

/**
 * DailyBonusWidget
 * Shows and allows claiming daily login bonus
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Flame, Star, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dailyBonusService } from '@/lib/engagement/daily-bonus';
import confetti from 'canvas-confetti';

interface DailyBonusWidgetProps {
    compact?: boolean;
}

export default function DailyBonusWidget({ compact = false }: DailyBonusWidgetProps) {
    const { userData } = useAuth();
    const [canClaim, setCanClaim] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [todaysXP, setTodaysXP] = useState(10);
    const [isWeeklyBonus, setIsWeeklyBonus] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            if (!userData?.id) return;

            try {
                const status = await dailyBonusService.getStatus(userData.id);
                setCanClaim(status.canClaim);
                setCurrentStreak(status.currentStreak);
                setTodaysXP(status.todaysReward.xp);
                setIsWeeklyBonus(status.todaysReward.isWeeklyBonus || status.todaysReward.isMonthlyBonus);
            } catch (error) {
                console.error('Failed to get daily bonus status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [userData?.id]);

    const handleClaim = async () => {
        if (!userData?.id || !canClaim || claiming) return;

        setClaiming(true);
        try {
            const result = await dailyBonusService.claim(userData.id);

            if (result.success) {
                setClaimed(true);
                setCanClaim(false);
                setCurrentStreak(result.newStreak);

                // Fire confetti for weekly/monthly bonus
                if (result.bonusType !== 'daily') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#10B981', '#8B5CF6', '#F59E0B'],
                    });
                }
            }
        } catch (error) {
            console.error('Failed to claim daily bonus:', error);
        } finally {
            setClaiming(false);
        }
    };

    if (loading || !userData?.id) {
        return (
            <div className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
        );
    }

    if (compact) {
        return (
            <AnimatePresence mode="wait">
                {canClaim ? (
                    <motion.button
                        key="claim"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={handleClaim}
                        disabled={claiming}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow"
                    >
                        <Gift className="w-5 h-5" />
                        <span>+{todaysXP} XP</span>
                        {isWeeklyBonus && <Star className="w-4 h-4 text-yellow-200" />}
                    </motion.button>
                ) : (
                    <motion.div
                        key="claimed"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl text-slate-400"
                    >
                        <Check className="w-5 h-5 text-emerald-400" />
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>{currentStreak}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl p-4 ${canClaim
                    ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}
        >
            {/* Animated glow for claimable */}
            {canClaim && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${canClaim ? 'bg-amber-500/20' : 'bg-slate-700/50'
                        }`}>
                        {canClaim ? (
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            >
                                <Gift className="w-6 h-6 text-amber-400" />
                            </motion.div>
                        ) : (
                            <Check className="w-6 h-6 text-emerald-400" />
                        )}
                    </div>

                    <div>
                        <p className="font-semibold text-white">
                            {canClaim ? 'Dzienny Bonus' : 'Bonus odebrany!'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span>{currentStreak} dni z rzędu</span>
                            {isWeeklyBonus && (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                    Bonus tygodniowy!
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {canClaim ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClaim}
                        disabled={claiming}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold shadow-lg shadow-amber-500/25 disabled:opacity-50"
                    >
                        {claiming ? (
                            <Sparkles className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>+{todaysXP}</span>
                                <span className="text-amber-200">XP</span>
                            </>
                        )}
                    </motion.button>
                ) : (
                    <div className="text-emerald-400 font-medium">
                        ✓ +{todaysXP} XP
                    </div>
                )}
            </div>
        </motion.div>
    );
}
