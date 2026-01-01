'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Lightbulb, Brain, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Challenge {
    type: 'challenge' | 'insight' | 'quiz';
    emoji: string;
    title: string;
    description: string;
    progress?: { current: number; total: number };
    xp?: number;
    link?: string;
}

// Sample challenges/insights (will be replaced with real data)
const SAMPLE_HOOKS: Challenge[] = [
    {
        type: 'challenge',
        emoji: '🔥',
        title: 'Twój Streak',
        description: '3 dni bez fastfoodów. Wytrzymasz do jutra?',
        progress: { current: 3, total: 7 },
        xp: 50,
        link: '/challenges',
    },
    {
        type: 'insight',
        emoji: '💡',
        title: 'Wykryto zmianę',
        description: 'Netflix podrożał o 4 zł. Anulujemy?',
        link: '/subscriptions',
    },
    {
        type: 'quiz',
        emoji: '🧠',
        title: 'Pytanie dnia',
        description: 'Co to jest procent składany?',
        xp: 10,
        link: '/challenges',
    },
    {
        type: 'challenge',
        emoji: '🍕',
        title: 'Mniej fastfoodów',
        description: 'Ogranicz jedzenie na mieście',
        progress: { current: 5, total: 10 },
        xp: 100,
        link: '/challenges',
    },
];

export default function HookChallengeWidget() {
    const [hooks, setHooks] = useState<Challenge[]>(SAMPLE_HOOKS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoRotating, setIsAutoRotating] = useState(true);

    const currentHook = hooks[currentIndex];

    // Fetch AI Quiz
    useEffect(() => {
        fetch('/api/ai-quiz')
            .then(res => res.json())
            .then(quiz => {
                if (quiz && quiz.question) {
                    setHooks(prev => prev.map(h =>
                        h.type === 'quiz'
                            ? {
                                ...h,
                                title: 'Quiz Dnia AI',
                                description: quiz.question,
                                link: '/quiz' // Assuming we'll have a quiz page
                            }
                            : h
                    ));
                }
            })
            .catch(console.error);
    }, []);

    // Auto-rotate every 8 seconds
    useEffect(() => {
        if (!isAutoRotating) return;

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
            default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'challenge': return 'WYZWANIE';
            case 'insight': return 'INSIGHT AI';
            case 'quiz': return 'QUIZ';
            default: return 'NOWOŚĆ';
        }
    };

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case 'challenge': return 'bg-orange-500/10 border-orange-500/20';
            case 'insight': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'quiz': return 'bg-purple-500/10 border-purple-500/20';
            default: return 'bg-emerald-500/10 border-emerald-500/20';
        }
    };

    return (
        <Card className={`overflow-hidden border ${getTypeBgColor(currentHook.type)}`}>
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
                            <h3 className="font-semibold text-white">{currentHook.title}</h3>
                            <p className="text-sm text-slate-400 mt-0.5">{currentHook.description}</p>

                            {/* Progress bar for challenges */}
                            {currentHook.progress && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Postęp</span>
                                        <span>{currentHook.progress.current}/{currentHook.progress.total} dni</span>
                                    </div>
                                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(currentHook.progress.current / currentHook.progress.total) * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
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
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </motion.div>
                            </Link>
                        )}
                    </div>

                    {/* Dots indicator */}
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
                </motion.div>
            </AnimatePresence>
        </Card>
    );
}
