'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Flame,
    Star,
    Zap,
    Lock,
    ChevronRight,
    TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
    ACHIEVEMENTS,
    UserProgress,
    calculateLevel,
    getPointsForNextLevel,
    getStreakMultiplier,
    getRarityColor,
    getRarityLabel,
    Achievement,
} from '@/lib/gamification';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AchievementsPage() {
    const { userData } = useAuth();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRarity, setSelectedRarity] = useState<string>('all');

    // Fetch progress
    useEffect(() => {
        if (!userData?.id) {
            setLoading(false);
            return;
        }

        const progressRef = doc(db, 'users', userData.id, 'gamification', 'progress');

        const unsubscribe = onSnapshot(progressRef, (doc) => {
            if (doc.exists()) {
                setProgress(doc.data() as UserProgress);
            } else {
                setProgress({
                    points: 0,
                    level: 1,
                    streak: 0,
                    lastActiveDate: null,
                    unlockedAchievements: [],
                    stats: {
                        totalScans: 0,
                        totalGoals: 0,
                        goalsCompleted: 0,
                        totalSaved: 0,
                        budgetsMaintained: 0,
                    },
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    if (loading) {
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

    const points = progress?.points || 0;
    const level = progress?.level || calculateLevel(points);
    const streak = progress?.streak || 0;
    const nextLevelPoints = getPointsForNextLevel(level);
    const currentLevelPoints = getPointsForNextLevel(level - 1);
    const progressToNextLevel = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    const multiplier = getStreakMultiplier(streak);

    const unlockedCount = progress?.unlockedAchievements?.length || 0;
    const totalCount = ACHIEVEMENTS.length;

    // Filter achievements
    const filteredAchievements = selectedRarity === 'all'
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter(a => a.rarity === selectedRarity);

    return (
        <div className="max-w-4xl mx-auto">
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
                    <p className="text-3xl font-bold">{level}</p>
                    <p className="text-xs text-slate-400">Poziom</p>
                </Card>

                {/* Points */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold">{points.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Punkty</p>
                </Card>

                {/* Streak */}
                <Card className="p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                    <p className="text-3xl font-bold">{streak}</p>
                    <p className="text-xs text-slate-400">
                        Dni z rzędu
                        {multiplier > 1 && <span className="text-emerald-400"> (×{multiplier})</span>}
                    </p>
                </Card>

                {/* Achievements */}
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
                        <span className="text-sm text-slate-400">Postęp do poziomu {level + 1}</span>
                        <span className="text-sm text-slate-400">
                            {points.toLocaleString()} / {nextLevelPoints.toLocaleString()} pkt
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNextLevel}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                            Potrzebujesz jeszcze <strong className="text-white">{(nextLevelPoints - points).toLocaleString()}</strong> punktów
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['all', 'common', 'rare', 'epic', 'legendary'].map((rarity) => (
                    <button
                        key={rarity}
                        onClick={() => setSelectedRarity(rarity)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedRarity === rarity
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {rarity === 'all' ? 'Wszystkie' : getRarityLabel(rarity as Achievement['rarity'])}
                    </button>
                ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {filteredAchievements.map((achievement, i) => {
                    const isUnlocked = progress?.unlockedAchievements?.includes(achievement.id);

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className={`p-4 ${!isUnlocked ? 'opacity-60' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isUnlocked
                                            ? getRarityColor(achievement.rarity)
                                            : 'bg-slate-800 grayscale'
                                        }`}>
                                        {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-slate-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{achievement.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityColor(achievement.rarity)}`}>
                                                {getRarityLabel(achievement.rarity)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{achievement.description}</p>

                                        {/* Progress for non-unlocked */}
                                        {!isUnlocked && progress && (
                                            <div className="mt-2">
                                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-slate-500 rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, getAchievementProgress(achievement, progress) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isUnlocked && (
                                        <div className="text-emerald-400">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function getAchievementProgress(achievement: Achievement, progress: UserProgress): number {
    switch (achievement.category) {
        case 'scans':
            return progress.stats.totalScans / achievement.target;
        case 'goals':
            return progress.stats.totalGoals / achievement.target;
        case 'goals_completed':
            return progress.stats.goalsCompleted / achievement.target;
        case 'streak':
            return progress.streak / achievement.target;
        case 'savings':
            return progress.stats.totalSaved / achievement.target;
        default:
            return 0;
    }
}
