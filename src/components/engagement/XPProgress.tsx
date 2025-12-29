'use client';

import { motion } from 'framer-motion';
import { Zap, ChevronUp } from 'lucide-react';
import { engagementService, LEVELS } from '@/lib/engagement/xp-system';

interface XPProgressProps {
    xp: number;
    level: number;
    showLevelUp?: boolean;
    compact?: boolean;
}

export default function XPProgress({ xp, level, showLevelUp = false, compact = false }: XPProgressProps) {
    const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === level + 1);

    const xpInLevel = xp - currentLevel.minXP;
    const xpNeeded = nextLevel ? nextLevel.minXP - currentLevel.minXP : 1;
    const progress = Math.min(100, (xpInLevel / xpNeeded) * 100);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{level}</span>
                </div>
                <div className="flex-1">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-1 text-purple-400 text-xs">
                    <Zap className="w-3 h-3" />
                    <span>{xp}</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30"
        >
            {/* Level Badge */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={showLevelUp ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: showLevelUp ? Infinity : 0, duration: 1 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
                    >
                        <span className="text-white text-xl font-bold">{level}</span>
                    </motion.div>
                    <div>
                        <p className="font-bold">{currentLevel.name}</p>
                        <p className="text-slate-400 text-sm">{xp} XP</p>
                    </div>
                </div>

                {nextLevel && (
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-purple-400 text-sm">
                            <ChevronUp className="w-4 h-4" />
                            <span>Lvl {nextLevel.level}</span>
                        </div>
                        <p className="text-slate-500 text-xs">{nextLevel.minXP - xp} XP</p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                    >
                        {showLevelUp && (
                            <motion.div
                                animate={{ x: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-sm"
                            />
                        )}
                    </motion.div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{xpInLevel} XP</span>
                    <span>{xpNeeded} XP</span>
                </div>
            </div>

            {/* Perks */}
            {currentLevel.perks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {currentLevel.perks.map((perk, i) => (
                        <span
                            key={i}
                            className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs"
                        >
                            ✨ {perk}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
