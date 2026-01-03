/**
 * Behavioral Categories Service
 * Kakeibo 2.0 - Psychological spending categorization
 */

import { BehavioralCategory, EmotionTag, ExpenseCategory } from '@/types';

// ============ CATEGORY METADATA ============

export interface BehavioralCategoryMeta {
    id: BehavioralCategory;
    emoji: string;
    name: string;
    description: string;
    group: 'fortress' | 'life';
    subgroup: 'survival' | 'dopamine' | 'social' | 'chaos';
    gradient: [string, string]; // Tailwind from/to
    psychTrigger: string;
}

export const BEHAVIORAL_CATEGORIES: Record<BehavioralCategory, BehavioralCategoryMeta> = {
    // ====== TWIERDZA (FORTRESS) ======
    fortress: {
        id: 'fortress',
        emoji: '🏰',
        name: 'Twierdza',
        description: 'Czynsz, hipoteka, rachunki',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['slate-700', 'slate-900'],
        psychTrigger: 'Fundament bezpieczeństwa',
    },
    shield: {
        id: 'shield',
        emoji: '🛡️',
        name: 'Spokojny Sen',
        description: 'Fundusz awaryjny, ubezpieczenia',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['blue-600', 'blue-900'],
        psychTrigger: 'Redukcja lęku',
    },
    fuel: {
        id: 'fuel',
        emoji: '⛽',
        name: 'Paliwo',
        description: 'Podstawowa żywność, transport',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['emerald-600', 'emerald-900'],
        psychTrigger: 'Konieczność, nie wybór',
    },

    // ====== ŻYCIE - DOPAMINA ======
    dopamine: {
        id: 'dopamine',
        emoji: '🎢',
        name: 'Dopamina',
        description: 'Gadżety, hobby, gry',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['purple-500', 'pink-600'],
        psychTrigger: 'Kontrolowana przyjemność',
    },
    micro_joy: {
        id: 'micro_joy',
        emoji: '☕',
        name: 'Mikro-Radość',
        description: 'Kawa, przekąski, kosmetyki',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['amber-500', 'orange-600'],
        psychTrigger: 'Efekt szminki',
    },
    xp_points: {
        id: 'xp_points',
        emoji: '🎟️',
        name: 'Punkty XP',
        description: 'Podróże, koncerty, kultura',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['cyan-500', 'blue-600'],
        psychTrigger: 'Grywalizacja życia',
    },
    for_me: {
        id: 'for_me',
        emoji: '🧘',
        name: 'Dla Mnie',
        description: 'Siłownia, terapia, self-care',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['teal-500', 'emerald-600'],
        psychTrigger: 'Inwestycja w siebie',
    },

    // ====== ŻYCIE - SPOŁECZNE ======
    social_glue: {
        id: 'social_glue',
        emoji: '🍷',
        name: 'Smar Społeczny',
        description: 'Restauracje, bary, randki',
        group: 'life',
        subgroup: 'social',
        gradient: ['rose-500', 'pink-600'],
        psychTrigger: 'Więzi, nie jedzenie',
    },
    love_language: {
        id: 'love_language',
        emoji: '🎁',
        name: 'Język Miłości',
        description: 'Prezenty, darowizny',
        group: 'life',
        subgroup: 'social',
        gradient: ['red-500', 'rose-600'],
        psychTrigger: 'Wyrażanie uczuć',
    },
    tribe_tax: {
        id: 'tribe_tax',
        emoji: '👥',
        name: 'Podatek Plemienny',
        description: 'Wesela, składki grupowe',
        group: 'life',
        subgroup: 'social',
        gradient: ['indigo-500', 'purple-600'],
        psychTrigger: 'Presja społeczna',
    },

    // ====== ŻYCIE - CHAOS ======
    chaos_tax: {
        id: 'chaos_tax',
        emoji: '🧠',
        name: 'Podatek od Chaosu',
        description: 'Opłaty za zwłokę, zgubione rzeczy',
        group: 'life',
        subgroup: 'chaos',
        gradient: ['gray-500', 'gray-700'],
        psychTrigger: 'ADHD-friendly tracking',
    },
    impulse_zone: {
        id: 'impulse_zone',
        emoji: '⚡',
        name: 'Strefa Bez Winy',
        description: 'Impulsywne zakupy (kontrolowane)',
        group: 'life',
        subgroup: 'chaos',
        gradient: ['yellow-500', 'amber-600'],
        psychTrigger: 'Zero wstydu',
    },
};

// ============ EMOTION METADATA ============

export interface EmotionMeta {
    id: EmotionTag;
    emoji: string;
    name: string;
    color: string;
}

export const EMOTIONS: Record<EmotionTag, EmotionMeta> = {
    joy: { id: 'joy', emoji: '😊', name: 'Radość', color: 'emerald' },
    necessity: { id: 'necessity', emoji: '😐', name: 'Konieczność', color: 'slate' },
    tired: { id: 'tired', emoji: '😴', name: 'Zmęczenie', color: 'blue' },
    regret: { id: 'regret', emoji: '😢', name: 'Żal', color: 'red' },
    bored: { id: 'bored', emoji: '😑', name: 'Nuda', color: 'gray' },
    social: { id: 'social', emoji: '🤝', name: 'Więzi', color: 'amber' },
    reward: { id: 'reward', emoji: '🎁', name: 'Nagroda', color: 'purple' },
};

// ============ MCC → BEHAVIORAL MAPPING ============

/**
 * Maps traditional ExpenseCategory to suggested BehavioralCategory
 * User can override this mapping
 */
export const MCC_TO_BEHAVIORAL: Record<ExpenseCategory, BehavioralCategory> = {
    groceries: 'fuel',
    restaurants: 'social_glue',
    transport: 'fuel',
    utilities: 'fortress',
    entertainment: 'dopamine',
    shopping: 'impulse_zone',
    health: 'for_me',
    education: 'xp_points',
    subscriptions: 'micro_joy',
    other: 'impulse_zone',
};

// ============ HELPERS ============

export function getCategoryMeta(category: BehavioralCategory): BehavioralCategoryMeta {
    return BEHAVIORAL_CATEGORIES[category];
}

export function getEmotionMeta(emotion: EmotionTag): EmotionMeta {
    return EMOTIONS[emotion];
}

export function getFortressCategories(): BehavioralCategoryMeta[] {
    return Object.values(BEHAVIORAL_CATEGORIES).filter(c => c.group === 'fortress');
}

export function getLifeCategories(): BehavioralCategoryMeta[] {
    return Object.values(BEHAVIORAL_CATEGORIES).filter(c => c.group === 'life');
}

export function suggestBehavioralCategory(mccCategory: ExpenseCategory): BehavioralCategory {
    return MCC_TO_BEHAVIORAL[mccCategory] || 'impulse_zone';
}
