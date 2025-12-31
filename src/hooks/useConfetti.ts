'use client';

import confetti from 'canvas-confetti';
import { useCallback } from 'react';

type ConfettiType = 'success' | 'celebration' | 'milestone' | 'goal';

const confettiConfigs: Record<ConfettiType, confetti.Options> = {
    success: {
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
    },
    celebration: {
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#fbbf24'],
    },
    milestone: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
    },
    goal: {
        particleCount: 200,
        spread: 120,
        startVelocity: 45,
        origin: { y: 0.5 },
        colors: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899'],
    },
};

export function useConfetti() {
    const fire = useCallback((type: ConfettiType = 'success') => {
        if (typeof window === 'undefined') return;

        const config = confettiConfigs[type];

        // Fire confetti
        confetti(config);

        // For celebration and goal, add extra bursts
        if (type === 'celebration' || type === 'goal') {
            setTimeout(() => {
                confetti({
                    ...config,
                    origin: { x: 0.2, y: 0.6 },
                    particleCount: 50,
                });
            }, 150);

            setTimeout(() => {
                confetti({
                    ...config,
                    origin: { x: 0.8, y: 0.6 },
                    particleCount: 50,
                });
            }, 300);
        }
    }, []);

    const fireEmoji = useCallback((emoji: string = '🎉') => {
        if (typeof window === 'undefined') return;

        const scalar = 2;
        const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

        confetti({
            shapes: [emojiShape],
            scalar,
            particleCount: 30,
            spread: 60,
            origin: { y: 0.7 },
        });
    }, []);

    return { fire, fireEmoji };
}

// Standalone fire function for non-hook contexts
export function fireConfetti(type: ConfettiType = 'success') {
    if (typeof window === 'undefined') return;

    const config = confettiConfigs[type];
    confetti(config);
}

export function fireGoalConfetti() {
    fireConfetti('goal');
}

export function fireMilestoneConfetti() {
    fireConfetti('milestone');
}
