'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SavoriPetProps {
    level: number;
    mood: 'happy' | 'neutral' | 'sad' | 'excited';
    streak: number;
    onInteract?: () => void;
}

const PET_STAGES = [
    { emoji: '🥚', name: 'Jajko', minLevel: 1 },
    { emoji: '🐣', name: 'Pisklę', minLevel: 2 },
    { emoji: '🐥', name: 'Kurczaczek', minLevel: 5 },
    { emoji: '🐤', name: 'Żółtek', minLevel: 10 },
    { emoji: '🐔', name: 'Kurka', minLevel: 20 },
    { emoji: '🦚', name: 'Paw', minLevel: 50 },
    { emoji: '🦅', name: 'Orzeł', minLevel: 100 },
];

const MOOD_ANIMATIONS = {
    happy: {
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
    },
    excited: {
        scale: [1, 1.2, 1, 1.2, 1],
        y: [0, -10, 0, -10, 0],
    },
    neutral: {
        scale: [1, 1.02, 1],
    },
    sad: {
        scale: [1, 0.95, 1],
        y: [0, 2, 0],
    },
};

const MOOD_COLORS = {
    happy: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    excited: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    neutral: 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
    sad: 'from-blue-500/20 to-slate-500/20 border-blue-500/30',
};

const SPEECH_BUBBLES = {
    happy: [
        'Świetnie oszczędzasz! 🎉',
        'Tak trzymaj! 💪',
        'Jestem z Ciebie dumny! ⭐',
        'Rośniesz w siłę! 🌱',
    ],
    excited: [
        'WOW! Nowy rekord! 🏆',
        'Niesamowite! 🚀',
        'Jesteś LEGENDĄ! 👑',
        'MEGA oszczędności! 💎',
    ],
    neutral: [
        'Hej, dodaj wydatek! 📝',
        'Co dziś zaoszczędzisz? 🤔',
        'Zeskanuj paragon! 📸',
    ],
    sad: [
        'Tęsknię za Tobą... 😢',
        'Wróć do oszczędzania! 🥺',
        'Nie zapominaj o mnie! 💔',
    ],
};

export default function SavoriPet({ level, mood, streak, onInteract }: SavoriPetProps) {
    const [showSpeech, setShowSpeech] = useState(false);
    const [speech, setSpeech] = useState('');
    const [hearts, setHearts] = useState<number[]>([]);

    // Get current pet stage
    const currentStage = PET_STAGES.reduce((prev, curr) =>
        level >= curr.minLevel ? curr : prev
        , PET_STAGES[0]);

    // Progress to next stage
    const nextStage = PET_STAGES.find(s => s.minLevel > level);
    const progressToNext = nextStage
        ? ((level - currentStage.minLevel) / (nextStage.minLevel - currentStage.minLevel)) * 100
        : 100;

    // Random speech on mood change
    useEffect(() => {
        const speeches = SPEECH_BUBBLES[mood];
        setSpeech(speeches[Math.floor(Math.random() * speeches.length)]);
        setShowSpeech(true);
        const timer = setTimeout(() => setShowSpeech(false), 4000);
        return () => clearTimeout(timer);
    }, [mood]);

    // Handle pet interaction
    const handleClick = () => {
        // Add floating heart
        setHearts(prev => [...prev, Date.now()]);
        setTimeout(() => setHearts(prev => prev.slice(1)), 1000);

        // Random speech
        const speeches = SPEECH_BUBBLES[mood];
        setSpeech(speeches[Math.floor(Math.random() * speeches.length)]);
        setShowSpeech(true);

        onInteract?.();
    };

    return (
        <div className="relative">
            {/* Pet Container */}
            <motion.div
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${MOOD_COLORS[mood]} border cursor-pointer`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClick}
            >
                {/* Speech Bubble */}
                <AnimatePresence>
                    {showSpeech && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.8 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 whitespace-nowrap z-10"
                        >
                            <span className="text-sm">{speech}</span>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/10" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Hearts */}
                <AnimatePresence>
                    {hearts.map((id) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 1, y: 0, x: 0 }}
                            animate={{
                                opacity: 0,
                                y: -50,
                                x: Math.random() * 40 - 20
                            }}
                            exit={{ opacity: 0 }}
                            className="absolute top-1/2 left-1/2 text-2xl pointer-events-none"
                        >
                            ❤️
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Pet Emoji */}
                <div className="flex flex-col items-center">
                    <motion.div
                        animate={MOOD_ANIMATIONS[mood]}
                        transition={{
                            duration: mood === 'excited' ? 0.5 : 2,
                            repeat: Infinity,
                            repeatType: 'reverse'
                        }}
                        className="text-6xl mb-3"
                    >
                        {currentStage.emoji}
                    </motion.div>

                    {/* Pet Name & Level */}
                    <h3 className="font-bold text-lg">{currentStage.name}</h3>
                    <p className="text-sm text-slate-400">Poziom {level}</p>

                    {/* Progress Bar to Next Stage */}
                    {nextStage && (
                        <div className="w-full mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>{currentStage.emoji}</span>
                                <span>{nextStage.emoji}</span>
                            </div>
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNext}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Streak Badge */}
                    {streak > 0 && (
                        <div className="mt-3 flex items-center gap-1 px-3 py-1 bg-orange-500/20 rounded-full">
                            <span>🔥</span>
                            <span className="text-sm font-medium text-orange-400">{streak} dni</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Tip */}
            <p className="text-center text-xs text-slate-500 mt-2">
                Kliknij, żeby pogłaskać! 💕
            </p>
        </div>
    );
}
