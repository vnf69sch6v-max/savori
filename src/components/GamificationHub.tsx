'use client';

import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface GamificationHubProps {
    xp: number;
    level: number;
    levelName: string;
    xpToNextLevel: number;
    currentLevelXP: number;
    streak: number;
    points: number;
    recentBadge?: {
        name: string;
        emoji: string;
    };
}

// Level names for display
const LEVEL_NAMES: Record<number, string> = {
    1: 'Nowicjusz',
    2: 'Początkujący',
    3: 'Oszczędzacz',
    4: 'Planista',
    5: 'Strateg',
    6: 'Ekspert',
    7: 'Mistrz',
    8: 'Guru',
    9: 'Legenda',
    10: 'Savori Master',
};

export default function GamificationHub({
    xp,
    level,
    levelName,
    xpToNextLevel,
    currentLevelXP,
    streak,
    points,
    recentBadge
}: GamificationHubProps) {
    // Calculate XP progress percentage
    const xpProgress = xpToNextLevel > 0
        ? ((xp - currentLevelXP) / (xpToNextLevel - currentLevelXP)) * 100
        : 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-5"
        >
            {/* Background decoration */}
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
                {/* Header with link */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300">Twój Postęp</h3>
                    <Link href="/achievements" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        Zobacz więcej <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Level & XP */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {level}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{LEVEL_NAMES[level] || levelName}</p>
                            <p className="text-xs text-slate-400">{xp.toLocaleString()} XP</p>
                        </div>
                    </div>

                    {/* XP Progress bar */}
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, xpProgress)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-1">
                            <Zap className="w-3 h-3 text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-right">
                        {xpToNextLevel - xp > 0 ? `${xpToNextLevel - xp} XP do poziomu ${level + 1}` : 'Max level!'}
                    </p>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3">
                    {/* Streak */}
                    <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50">
                        <div className={`p-1.5 rounded-lg ${streak > 0 ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
                            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                            <p className={`font-bold ${streak > 0 ? 'text-orange-400' : 'text-slate-500'}`}>{streak}</p>
                            <p className="text-[10px] text-slate-500">dni</p>
                        </div>
                    </div>

                    {/* Points */}
                    <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50">
                        <div className="p-1.5 rounded-lg bg-amber-500/20">
                            <Star className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-400">{points.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500">pkt.</p>
                        </div>
                    </div>

                    {/* Recent badge */}
                    {recentBadge ? (
                        <div className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50">
                            <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                <span className="text-lg">{recentBadge.emoji}</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 truncate max-w-[60px]">{recentBadge.name}</p>
                            </div>
                        </div>
                    ) : (
                        <Link href="/challenges" className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Wyzwania</span>
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
