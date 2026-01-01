'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Lightbulb, Brain, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { engagementService } from '@/lib/engagement/xp-system';

interface Challenge {
    type: 'challenge' | 'insight' | 'quiz' | 'stats';
    emoji: string;
    title: string;
    description: string;
    progress?: { current: number; total: number };
    xp?: number;
    link?: string;
}

// Initial fallback mock data
const INITIAL_HOOKS: Challenge[] = [
    {
        type: 'quiz',
        emoji: '🧠',
        title: 'Ładowanie wiedzy...',
        description: 'Przygotowujemy dla Ciebie zagadkę finansową.',
        xp: 10,
        link: '/challenges',
    },
];

export default function HookChallengeWidget() {
    const { user: userData } = useAuth();
    const [hooks, setHooks] = useState<Challenge[]>(INITIAL_HOOKS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoRotating, setIsAutoRotating] = useState(true);

    const currentHook = hooks[currentIndex] || INITIAL_HOOKS[0];

    // load Data
    useEffect(() => {
        async function loadData() {
            const newHooks: Challenge[] = [];

            // 1. Get Engagement Data (Streak & Weekly XP)
            if (userData?.uid) {
                try {
                    const engagement = await engagementService.getEngagement(userData.uid);

                    // Streak Card
                    newHooks.push({
                        type: 'challenge',
                        emoji: '🔥',
                        title: 'Twój Streak',
                        description: engagement.currentStreak > 0
                            ? `${engagement.currentStreak} dni z rzędu! Utrzymaj to do jutra.`
                            : 'Zacznij nową serię logując się codziennie!',
                        progress: { current: engagement.currentStreak, total: Math.max(7, engagement.currentStreak + (7 - (engagement.currentStreak % 7))) },
                        xp: 50,
                        link: '/leaderboard?tab=streak',
                    });

                    // Weekly XP Card (Nudge)
                    newHooks.push({
                        type: 'stats',
                        emoji: '📊',
                        title: 'Tygodniowe XP',
                        description: `Zdobyłeś ${engagement.weeklyXP} XP w tym tygodniu.`,
                        progress: { current: engagement.weeklyXP, total: 1000 }, // Example goal
                        link: '/leaderboard?sort=weekly_xp',
                    });

                } catch (e) {
                    console.error('Error fetching engagement:', e);
                }
            }

            // 2. Add static / random insights
            newHooks.push({
                type: 'insight',
                emoji: '💡',
                title: 'Wykryto zmianę',
                description: 'Netflix podrożał o 4 zł. Sprawdź subskrypcje.',
                link: '/subscriptions',
            });

            // 3. Fetch AI Quiz
            try {
                const res = await fetch('/api/ai-quiz');
                const quiz = await res.json();
                if (quiz && quiz.question) {
                    newHooks.push({
                        type: 'quiz',
                        emoji: '🧠',
                        title: 'Quiz Dnia AI',
                        description: quiz.question,
                        xp: 20,
                        link: '/quiz' // Assuming /quiz exists or handles this
                    });
                }
            } catch (e) {
                console.error('Quiz fetch error:', e);
                // Fallback quiz if fetch fails
                newHooks.push({
                    type: 'quiz',
                    emoji: '🧠',
                    title: 'Pytanie dnia',
                    description: 'Co to jest procent składany?',
                    xp: 10,
                    link: '/challenges',
                });
            }

            setHooks(newHooks);
        }

        loadData();
    }, [userData?.uid]);

    // Auto-rotate every 8 seconds
    useEffect(() => {
        if (!isAutoRotating || hooks.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % hooks.length);
        }, 8000);

        return () => clearInterval(timer);
    }, [isAutoRotating, hooks.length]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'challenge': return <Flame className="w-5 h-5 text-orange-400" />;
            case 'insight': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
            case 'quiz': return <Brain className="w-5 h-5 text-purple-400" />;
            case 'stats': return <TrendingUp className="w-5 h-5 text-blue-400" />;
            default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'challenge': return 'STREAK';
            case 'insight': return 'INSIGHT AI';
            case 'quiz': return 'QUIZ';
            case 'stats': return 'STATYSTYKI';
            default: return 'NOWOŚĆ';
        }
    };

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case 'challenge': return 'bg-orange-500/10 border-orange-500/20';
            case 'insight': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'quiz': return 'bg-purple-500/10 border-purple-500/20';
            case 'stats': return 'bg-blue-500/10 border-blue-500/20';
            default: return 'bg-emerald-500/10 border-emerald-500/20';
        }
    };

    if (hooks.length === 0) return null;

    return (
        <Card className={`overflow-hidden border ${getTypeBgColor(currentHook.type)} transition-colors duration-500`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-4"
                    onMouseEnter={() => setIsAutoRotating(false)}
                    onMouseLeave={() => setIsAutoRotating(true)}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {getIcon(currentHook.type)}
                            <span className="text-xs font-semibold tracking-wider text-slate-400">
                                {getTypeLabel(currentHook.type)}
                            </span>
                        </div>
                        {currentHook.xp && (
                            <span className="text-xs font-bold text-emerald-400">
                                +{currentHook.xp} XP
                            </span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{currentHook.emoji}</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{currentHook.title}</h3>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{currentHook.description}</p>

                            {/* Progress bar for challenges/stats */}
                            {currentHook.progress && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Postęp</span>
                                        <span>{currentHook.progress.current}/{currentHook.progress.total}</span>
                                    </div>
                                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (currentHook.progress.current / currentHook.progress.total) * 100)}%` }}
                                            transition={{ duration: 0.5 }}
                                            className={`h-full rounded-full ${currentHook.type === 'stats'
                                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                                }`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action */}
                        {currentHook.link && (
                            <Link href={currentHook.link}>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </motion.div>
                            </Link>
                        )}
                    </div>

                    {/* Dots indicator */}
                    {hooks.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                            {hooks.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-slate-600'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </Card>
    );
}
