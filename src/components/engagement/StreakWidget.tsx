'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Wallet, Ban } from 'lucide-react';

interface StreakWidgetProps {
    currentStreak: number;
    longestStreak: number;
    noSpendStreak?: number;
    longestNoSpendStreak?: number;
    compact?: boolean;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];
const NO_SPEND_MILESTONES = [1, 3, 7, 14, 30];

type TabType = 'activity' | 'no-spend';

export default function StreakWidget({
    currentStreak,
    longestStreak,
    noSpendStreak = 0,
    longestNoSpendStreak = 0,
    compact = false
}: StreakWidgetProps) {
    const [activeTab, setActiveTab] = useState<TabType>('activity');

    const isNoSpend = activeTab === 'no-spend';
    const streak = isNoSpend ? noSpendStreak : currentStreak;
    const longest = isNoSpend ? longestNoSpendStreak : longestStreak;
    const milestones = isNoSpend ? NO_SPEND_MILESTONES : STREAK_MILESTONES;

    const nextMilestone = milestones.find(m => m > streak) || streak + 10;
    const progress = (streak / nextMilestone) * 100;

    const getStreakEmoji = () => {
        if (isNoSpend) {
            if (streak >= 30) return '🧘';
            if (streak >= 14) return '🥷';
            if (streak >= 7) return '💪';
            if (streak >= 3) return '✨';
            if (streak >= 1) return '🎯';
            return '💰';
        }
        if (streak >= 100) return '👑';
        if (streak >= 30) return '🔥';
        if (streak >= 14) return '⚡';
        if (streak >= 7) return '💪';
        if (streak >= 3) return '✨';
        return '🌱';
    };

    const getStreakColor = () => {
        if (isNoSpend) {
            if (streak >= 14) return 'from-purple-500 to-violet-500';
            if (streak >= 7) return 'from-indigo-500 to-purple-500';
            if (streak >= 3) return 'from-blue-500 to-indigo-500';
            return 'from-slate-500 to-blue-500';
        }
        if (streak >= 30) return 'from-orange-500 to-red-500';
        if (streak >= 14) return 'from-amber-500 to-orange-500';
        if (streak >= 7) return 'from-yellow-500 to-amber-500';
        return 'from-emerald-500 to-emerald-600';
    };

    const getMotivation = () => {
        if (isNoSpend) {
            if (streak === 0) return 'Zacznij dzień bez wydatków!';
            if (streak < 3) return 'Świetny start oszczędzania!';
            if (streak < 7) return 'Kontrola finansów!';
            if (streak < 14) return 'Mistrz oszczędności!';
            return 'Legenda finansów! 🧘';
        }
        if (streak === 0) return 'Zacznij swój streak!';
        if (streak < 3) return 'Świetny start!';
        if (streak < 7) return 'Tak trzymaj!';
        if (streak < 14) return 'Jesteś niesamowity!';
        if (streak < 30) return 'Legenda w akcji!';
        return 'Absolutny mistrz! 👑';
    };

    if (compact) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${getStreakColor()} cursor-pointer`}
            >
                {isNoSpend ? <Ban className="w-4 h-4 text-white" /> : <Flame className="w-4 h-4 text-white" />}
                <span className="font-bold text-white text-sm">{streak}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
        >
            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-700/50 rounded-xl mb-4">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'activity'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Flame className="w-4 h-4" />
                    Aktywność
                </button>
                <button
                    onClick={() => setActiveTab('no-spend')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'no-spend'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Wallet className="w-4 h-4" />
                    No-Spend
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        key={`${activeTab}-${streak}`}
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: streak > 0 ? [0, 5, -5, 0] : 0
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-3xl"
                    >
                        {getStreakEmoji()}
                    </motion.div>
                    <div>
                        <p className="text-slate-400 text-xs">
                            {isNoSpend ? 'Dni bez wydatków' : 'Aktywny streak'}
                        </p>
                        <p className="font-bold text-xl">
                            {streak} {streak === 1 ? 'dzień' : 'dni'}
                        </p>
                    </div>
                </div>

                {longest > 0 && (
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <Trophy className="w-3 h-3" />
                            <span>Rekord</span>
                        </div>
                        <p className="font-semibold">{longest} dni</p>
                    </div>
                )}
            </div>

            {/* Progress to next milestone */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{getMotivation()}</span>
                    <span>{streak}/{nextMilestone}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        key={`progress-${activeTab}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progress)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getStreakColor()} rounded-full`}
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="flex justify-between">
                {milestones.slice(0, 5).map((milestone) => (
                    <div
                        key={milestone}
                        className={`flex flex-col items-center ${streak >= milestone ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                        <Star className={`w-4 h-4 ${streak >= milestone ? 'fill-current' : ''}`} />
                        <span className="text-[10px] mt-1">{milestone}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

