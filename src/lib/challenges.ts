import { Timestamp } from 'firebase/firestore';

export interface Challenge {
    id: string;
    name: string;
    description: string;
    emoji: string;
    type: 'no_spending' | 'limit' | 'streak' | 'goal';
    target: {
        category?: string;
        amount?: number;
        days?: number;
    };
    reward: {
        points: number;
        badge?: string;
    };
    duration: number; // days
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserChallenge {
    id: string;
    challengeId: string;
    userId: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'active' | 'completed' | 'failed';
    progress: number;
    completedAt?: Timestamp;
}

// Predefined challenges - POSITIVE ACTIONS (not prohibitions)
export const AVAILABLE_CHALLENGES: Challenge[] = [
    // Easy - Fun beginnings
    {
        id: 'home_barista',
        name: 'Domowy Barista',
        description: 'Zrób kawę w domu 5 razy',
        emoji: '☕',
        type: 'goal',
        target: { amount: 5, days: 7 },
        reward: { points: 150, badge: 'barista' },
        duration: 7,
        difficulty: 'easy',
    },
    {
        id: 'streak_7',
        name: 'Tygodniowy Wojownik',
        description: 'Utrzymaj streak przez 7 dni',
        emoji: '🔥',
        type: 'streak',
        target: { days: 7 },
        reward: { points: 100 },
        duration: 7,
        difficulty: 'easy',
    },
    {
        id: 'scan_master',
        name: 'Skanoholik',
        description: 'Zeskanuj 5 paragonów',
        emoji: '📸',
        type: 'goal',
        target: { amount: 5, days: 7 },
        reward: { points: 120 },
        duration: 7,
        difficulty: 'easy',
    },
    {
        id: 'budget_friend',
        name: 'Przyjaciel Budżetu',
        description: 'Dodawaj wydatki codziennie przez 5 dni',
        emoji: '📝',
        type: 'streak',
        target: { days: 5 },
        reward: { points: 100 },
        duration: 5,
        difficulty: 'easy',
    },

    // Medium - Building habits
    {
        id: 'home_chef',
        name: 'Szef Kuchni',
        description: 'Ugotuj 5 posiłków w domu (zapisz wydatki na groceries)',
        emoji: '🍳',
        type: 'goal',
        target: { amount: 5, category: 'groceries', days: 7 },
        reward: { points: 250, badge: 'chef' },
        duration: 7,
        difficulty: 'medium',
    },
    {
        id: 'savings_200',
        name: 'Oszczędność 200',
        description: 'Wpłać 200 zł na cel oszczędnościowy',
        emoji: '🎯',
        type: 'goal',
        target: { amount: 20000 },
        reward: { points: 300 },
        duration: 14,
        difficulty: 'medium',
    },
    {
        id: 'wardrobe_explorer',
        name: 'Odkrywca Szafy',
        description: 'Zrób 7 stylizacji z tego co masz (zapisz w notatce)',
        emoji: '👔',
        type: 'goal',
        target: { amount: 7, days: 14 },
        reward: { points: 300, badge: 'stylist' },
        duration: 14,
        difficulty: 'medium',
    },
    {
        id: 'meal_prep',
        name: 'Meal Prep Pro',
        description: 'Przygotuj posiłki na cały tydzień',
        emoji: '🥗',
        type: 'goal',
        target: { amount: 1, days: 7 },
        reward: { points: 350, badge: 'meal_prepper' },
        duration: 7,
        difficulty: 'medium',
    },

    // Hard - Master level
    {
        id: 'streak_30',
        name: 'Mistrz Miesiąca',
        description: 'Utrzymaj streak przez 30 dni',
        emoji: '👑',
        type: 'streak',
        target: { days: 30 },
        reward: { points: 500, badge: 'month_master' },
        duration: 30,
        difficulty: 'hard',
    },
    {
        id: 'savings_1000',
        name: 'Wielki Oszczędzający',
        description: 'Wpłać 1000 zł na cele w ciągu miesiąca',
        emoji: '💎',
        type: 'goal',
        target: { amount: 100000 },
        reward: { points: 700, badge: 'super_saver' },
        duration: 30,
        difficulty: 'hard',
    },
    {
        id: 'kitchen_master',
        name: 'Kuchenny Mistrz',
        description: 'Ugotuj 20 posiłków w miesiąc',
        emoji: '🏆',
        type: 'goal',
        target: { amount: 20, category: 'groceries', days: 30 },
        reward: { points: 600, badge: 'kitchen_king' },
        duration: 30,
        difficulty: 'hard',
    },
    {
        id: 'zero_waste',
        name: 'Zero Marnowania',
        description: 'Wykorzystaj wszystkie produkty przed datą ważności (30 dni)',
        emoji: '♻️',
        type: 'goal',
        target: { days: 30 },
        reward: { points: 800, badge: 'eco_warrior' },
        duration: 30,
        difficulty: 'hard',
    },
];

// Helper functions
export function getDifficultyColor(difficulty: Challenge['difficulty']): string {
    switch (difficulty) {
        case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
}

export function getDifficultyLabel(difficulty: Challenge['difficulty']): string {
    switch (difficulty) {
        case 'easy': return 'Łatwe';
        case 'medium': return 'Średnie';
        case 'hard': return 'Trudne';
    }
}

export function getChallengeProgress(
    challenge: Challenge,
    currentData: { streak?: number; spent?: number; saved?: number }
): number {
    switch (challenge.type) {
        case 'streak':
            return Math.min(100, ((currentData.streak || 0) / (challenge.target.days || 7)) * 100);
        case 'goal':
            return Math.min(100, ((currentData.saved || 0) / (challenge.target.amount || 10000)) * 100);
        case 'no_spending':
            // Progress is inverse - 100% if no spending detected
            return currentData.spent === 0 ? 100 : 0;
        case 'limit':
            return 50; // Placeholder - would need daily tracking
        default:
            return 0;
    }
}
