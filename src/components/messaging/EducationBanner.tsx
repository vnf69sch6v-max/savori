'use client';

/**
 * EducationBanner - Friendly tips and financial education
 * Rotates through helpful insights to educate users
 * Tone: "Mądry Przyjaciel" - supportive, never scary
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronRight, Sparkles } from 'lucide-react';

interface Tip {
    emoji: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionUrl?: string;
}

const TIPS: Tip[] = [
    {
        emoji: '💡',
        title: 'Wiedziałeś, że...',
        description: 'Przeciętny Polak nie wie dokąd idzie 30% jego wypłaty. Z Savori masz pełną kontrolę!',
    },
    {
        emoji: '📱',
        title: 'Pro tip',
        description: 'Możesz importować wydatki z wyciągu bankowego PDF. To zajmuje 30 sekund!',
        actionLabel: 'Importuj',
        actionUrl: '/import',
    },
    {
        emoji: '🎯',
        title: 'Cel = Motywacja',
        description: 'Użytkownicy z celami oszczędnościowymi oszczędzają 2x więcej. Ustaw swój cel!',
        actionLabel: 'Ustaw cel',
        actionUrl: '/goals',
    },
    {
        emoji: '🔔',
        title: 'Bądź na bieżąco',
        description: 'Włącz powiadomienia, a przypomnimy Ci o zbliżających się subskrypcjach.',
        actionLabel: 'Ustawienia',
        actionUrl: '/settings',
    },
    {
        emoji: '🏆',
        title: 'Rywalizuj z innymi',
        description: 'Sprawdź ranking oszczędzających i zmotywuj się do lepszych wyników!',
        actionLabel: 'Ranking',
        actionUrl: '/leaderboard',
    },
    {
        emoji: '🔒',
        title: 'Twoje dane są bezpieczne',
        description: 'Wszystko jest szyfrowane. W przeciwieństwie do banków, nie sprzedajemy Twoich danych.',
    },
];

interface EducationBannerProps {
    className?: string;
    variant?: 'full' | 'compact';
    onDismiss?: () => void;
}

export default function EducationBanner({
    className = '',
    variant = 'full',
    onDismiss
}: EducationBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Rotate tips every 10 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TIPS.length);
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    const currentTip = TIPS[currentIndex];

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 ${className}`}
            >
                <span className="text-xl">{currentTip.emoji}</span>
                <p className="text-sm text-slate-300 flex-1">{currentTip.description}</p>
                {currentTip.actionUrl && (
                    <a href={currentTip.actionUrl} className="text-xs text-purple-400 hover:text-purple-300">
                        {currentTip.actionLabel} →
                    </a>
                )}
            </motion.div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm ${className}`}
            >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Lightbulb className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                                {currentTip.title}
                            </span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{currentTip.emoji}</span>
                        <div className="flex-1">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {currentTip.description}
                            </p>
                            {currentTip.actionUrl && (
                                <a
                                    href={currentTip.actionUrl}
                                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    {currentTip.actionLabel}
                                    <ChevronRight className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {TIPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-purple-400' : 'bg-slate-600'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
