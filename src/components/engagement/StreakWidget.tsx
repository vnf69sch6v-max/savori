'use client';

import { motion } from 'framer-motion';
import { Flame, Trophy, Star } from 'lucide-react';

interface StreakWidgetProps {
    currentStreak: number;
    longestStreak: number;
    compact?: boolean;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

export default function StreakWidget({ currentStreak, longestStreak, compact = false }: StreakWidgetProps) {
    const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) || currentStreak + 10;
    const progress = (currentStreak / nextMilestone) * 100;

    const getStreakEmoji = () => {
        if (currentStreak >= 100) return '👑';
        if (currentStreak >= 30) return '🔥';
        if (currentStreak >= 14) return '⚡';
        if (currentStreak >= 7) return '💪';
        if (currentStreak >= 3) return '✨';
        return '🌱';
    };

    const getStreakColor = () => {
        if (currentStreak >= 30) return 'from-orange-500 to-red-500';
        if (currentStreak >= 14) return 'from-amber-500 to-orange-500';
        if (currentStreak >= 7) return 'from-yellow-500 to-amber-500';
        return 'from-emerald-500 to-emerald-600';
    };

    const getMotivation = () => {
        if (currentStreak === 0) return 'Zacznij swój streak!';
        if (currentStreak < 3) return 'Świetny start!';
        if (currentStreak < 7) return 'Tak trzymaj!';
        if (currentStreak < 14) return 'Jesteś niesamowity!';
        if (currentStreak < 30) return 'Legenda w akcji!';
        return 'Absolutny mistrz! 👑';
    };

    if (compact) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${getStreakColor()} cursor-pointer`}
            >
                <Flame className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-sm">{currentStreak}</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: currentStreak > 0 ? [0, 5, -5, 0] : 0
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-3xl"
                    >
                        {getStreakEmoji()}
                    </motion.div>
                    <div>
                        <p className="text-slate-400 text-xs">Aktywny streak</p>
                        <p className="font-bold text-xl">
                            {currentStreak} {currentStreak === 1 ? 'dzień' : 'dni'}
                        </p>
                    </div>
                </div>

                {longestStreak > 0 && (
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <Trophy className="w-3 h-3" />
                            <span>Rekord</span>
                        </div>
                        <p className="font-semibold">{longestStreak} dni</p>
                    </div>
                )}
            </div>

            {/* Progress to next milestone */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{getMotivation()}</span>
                    <span>{currentStreak}/{nextMilestone}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progress)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getStreakColor()} rounded-full`}
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="flex justify-between">
                {STREAK_MILESTONES.slice(0, 5).map((milestone) => (
                    <div
                        key={milestone}
                        className={`flex flex-col items-center ${currentStreak >= milestone ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                        <Star className={`w-4 h-4 ${currentStreak >= milestone ? 'fill-current' : ''}`} />
                        <span className="text-[10px] mt-1">{milestone}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
