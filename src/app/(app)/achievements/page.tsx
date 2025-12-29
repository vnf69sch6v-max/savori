'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Flame,
    Star,
    Zap,
    Lock,
    TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { UserGamification } from '@/types';
import {
    BADGES,
    engagementService,
} from '@/lib/engagement/xp-system';

export default function AchievementsPage() {
    const { userData } = useAuth();
    const [selectedRarity, setSelectedRarity] = useState<string>('all');

    if (!userData) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }


    const gamification: UserGamification = userData.gamification || {
        xp: 0,
        level: 1,
        points: 0,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        achievementsUnlocked: [],
        totalScans: 0,
        totalExpenses: 0
    };

    // Get level info and progress
    const levelInfo = engagementService.getLevelForXP(gamification.xp);
    const progressInfo = engagementService.getProgressToNextLevel(gamification.xp);

    const unlockedBadgeIds = gamification.badges || [];
    const unlockedCount = unlockedBadgeIds.length;
    const totalCount = BADGES.length;

    // Filter achievements
    const filteredBadges = selectedRarity === 'all'
        ? BADGES
        : BADGES.filter(b => b.rarity === selectedRarity);

    // Rarity helpers
    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-slate-400 bg-slate-500/20';
            case 'rare': return 'text-blue-400 bg-blue-500/20';
            case 'epic': return 'text-purple-400 bg-purple-500/20';
            case 'legendary': return 'text-amber-400 bg-amber-500/20';
            default: return 'text-slate-400';
        }
    };

    const getRarityLabel = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'Zwykłe';
            case 'rare': return 'Rzadkie';
            case 'epic': return 'Epickie';
            case 'legendary': return 'Legendarne';
            default: return rarity;
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Osiągnięcia</h1>
                    <p className="text-slate-400">Zdobywaj punkty i odznaki</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Level */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold">{levelInfo.level}</p>
                    <p className="text-xs text-slate-400">{levelInfo.name}</p>
                </Card>

                {/* XP */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold">{gamification.xp.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">XP</p>
                </Card>

                {/* Streak */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                    <p className="text-3xl font-bold">{gamification.currentStreak}</p>
                    <p className="text-xs text-slate-400">
                        Top: {gamification.longestStreak} dni
                    </p>
                </Card>

                {/* Badges */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold">{unlockedCount}/{totalCount}</p>
                    <p className="text-xs text-slate-400">Odznaki</p>
                </Card>
            </div>

            {/* Level Progress */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Postęp do poziomu {levelInfo.level + 1}</span>
                        <span className="text-sm text-slate-400">
                            {progressInfo.current.toLocaleString()} / {progressInfo.needed.toLocaleString()} XP
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressInfo.percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                            Potrzebujesz jeszcze <strong className="text-white">{(progressInfo.needed - progressInfo.current).toLocaleString()}</strong> XP
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'common', 'rare', 'epic', 'legendary'].map((rarity) => (
                    <button
                        key={rarity}
                        onClick={() => setSelectedRarity(rarity)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedRarity === rarity
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {getRarityLabel(rarity)}
                    </button>
                ))}
            </div>

            {/* Badges Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {filteredBadges.map((badge, i) => {
                    const isUnlocked = unlockedBadgeIds.includes(badge.id);

                    return (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className={`p-4 ${!isUnlocked ? 'opacity-60 grayscale' : ''} h-full`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 ${isUnlocked
                                        ? getRarityColor(badge.rarity)
                                        : 'bg-slate-800'
                                        }`}>
                                        {isUnlocked ? badge.emoji : <Lock className="w-6 h-6 text-slate-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold truncate">{badge.name}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRarityColor(badge.rarity)}`}>
                                                {getRarityLabel(badge.rarity)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
